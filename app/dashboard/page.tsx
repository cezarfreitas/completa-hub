"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  todayTotal: number;
  todaySuccess: number;
  todayErrors: number;
  successRate: number;
  chart: {
    date: string;
    label: string;
    total: number;
    success: number;
    errors: number;
  }[];
  recentLogs: {
    id: string;
    integrationSlug: string;
    type: string;
    request: { nome?: string; cidade?: string };
    response: { Cobertura?: string; error?: string };
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminShell heading="Dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            Carregando...
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!stats) {
    return (
      <AdminShell heading="Dashboard">
        <p className="text-muted-foreground">Erro ao carregar dados.</p>
      </AdminShell>
    );
  }

  const statCards = [
    {
      label: "Total Clientes",
      value: stats.totalClients,
      sub: `${stats.activeClients} ativos`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Requisições Hoje",
      value: stats.todayTotal,
      sub: "últimas 24h",
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Taxa de Sucesso",
      value: `${stats.successRate}%`,
      sub: `${stats.todaySuccess} bem-sucedidas`,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Erros Hoje",
      value: stats.todayErrors,
      sub: stats.todayErrors === 0 ? "Nenhum erro" : "verificar logs",
      icon: AlertTriangle,
      color: stats.todayErrors > 0 ? "text-red-600" : "text-green-600",
      bg: stats.todayErrors > 0 ? "bg-red-50" : "bg-green-50",
    },
  ];

  return (
    <AdminShell heading="Dashboard" subheading="Visão geral do sistema">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Recent Activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart */}
        <Card className="border shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Atividade dos últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart}>
                  <defs>
                    <linearGradient
                      id="gradSuccess"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor="#22c55e"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradErrors"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(220 13% 91%)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "13px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    name="Sucesso"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#gradSuccess)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    name="Erros"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#gradErrors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Atividade Recente
              </CardTitle>
              <Link
                href="/logs"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver todos
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentLogs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma atividade recente
                </p>
              ) : (
                stats.recentLogs.slice(0, 8).map((log) => {
                  const hasError = !!log.response?.error;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          hasError ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {log.request?.nome || log.integrationSlug}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.integrationSlug}</span>
                          <span>·</span>
                          <Badge
                            variant={hasError ? "destructive" : "success"}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {hasError ? "Erro" : "OK"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
