import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/models/Integration";
import { VerificationLog } from "@/models/VerificationLog";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalClients, activeClients, todayLogs, last7DaysAgg, recentLogs] =
      await Promise.all([
        Integration.countDocuments(),
        Integration.countDocuments({ active: true }),
        VerificationLog.find({ createdAt: { $gte: startOfToday } }).lean(),
        VerificationLog.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              total: { $sum: 1 },
              success: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ifNull: ["$response.Cobertura", false] },
                        { $not: [{ $ifNull: ["$response.error", false] }] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              errors: {
                $sum: {
                  $cond: [{ $ifNull: ["$response.error", false] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        VerificationLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    const todaySuccess = todayLogs.filter(
      (l: Record<string, unknown>) => {
        const resp = l.response as Record<string, unknown> | undefined;
        return resp?.Cobertura && !resp?.error;
      }
    ).length;
    const todayErrors = todayLogs.filter(
      (l: Record<string, unknown>) => {
        const resp = l.response as Record<string, unknown> | undefined;
        return resp?.error;
      }
    ).length;
    const todayTotal = todayLogs.length;
    const successRate =
      todayTotal > 0 ? Math.round((todaySuccess / todayTotal) * 100) : 100;

    // Fill missing days in chart
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const found = last7DaysAgg.find(
        (a: { _id: string }) => a._id === key
      );
      chart.push({
        date: key,
        label: d.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
        }),
        total: found?.total ?? 0,
        success: found?.success ?? 0,
        errors: found?.errors ?? 0,
      });
    }

    return NextResponse.json({
      totalClients,
      activeClients,
      todayTotal,
      todaySuccess,
      todayErrors,
      successRate,
      chart,
      recentLogs: recentLogs.map((l: Record<string, unknown>) => ({
        id: String(l._id),
        integrationSlug: l.integrationSlug,
        type: l.type || "viabilidade",
        request: l.request,
        response: l.response,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas" },
      { status: 500 }
    );
  }
}
