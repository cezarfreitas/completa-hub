"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  XCircle,
  Activity,
  ArrowLeft,
  Copy,
  TrendingUp,
  Check,
  ChevronDown,
  ChevronRight,
  Plug,
  ClipboardList,
  FileText,
} from "lucide-react";
import { LogsDataTable, type LogEntry } from "@/app/logs/logs-data-table";

/* ─── Payloads de exemplo ─── */
const payloadViabilidade = `{
  "rua": "Rua Exemplo",
  "numero": "100",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "cep": "01000000",
  "nome": "João Silva",
  "whatsapp": "5511999999999"
}`;

const payloadDocumentacao = `{
  "id_conectai": "uuid-retornado-pela-viabilidade",
  "Nome": "João",
  "Sobrenome": "Silva",
  "Rua": "Rua Exemplo",
  "Numero": "207",
  "Bairro": "Centro",
  "Cidade": "São Paulo",
  "Cep": "07700-210",
  "Estado": "SP",
  "Nascimento": "1990-01-15",
  "Whatsapp": "5511999999999",
  "Email": "email@exemplo.com",
  "RG ou CNH": "34580143",
  "CPF": "31242328874",
  "Foto Documento": "https://url-foto-documento",
  "Selfie Documento": "https://url-selfie-documento",
  "Data de Vencimento": "30"
}`;

const CAMPOS_DOC = [
  { campo: "id_conectai", req: true, desc: "ID retornado pela viabilidade" },
  { campo: "Nome", req: true, desc: "Nome" },
  { campo: "Sobrenome", req: true, desc: "Sobrenome" },
  { campo: "Rua", req: true, desc: "Logradouro" },
  { campo: "Numero", req: true, desc: "Número" },
  { campo: "Bairro", req: true, desc: "Bairro" },
  { campo: "Cidade", req: true, desc: "Cidade" },
  { campo: "Cep", req: true, desc: "CEP" },
  { campo: "Estado", req: true, desc: "UF" },
  { campo: "Nascimento", req: true, desc: "Data de nascimento (ISO ou dd/mm/yyyy)" },
  { campo: "Whatsapp", req: true, desc: "Telefone com DDD" },
  { campo: "Email", req: true, desc: "E-mail" },
  { campo: "RG ou CNH", req: true, desc: "Documento (só números)" },
  { campo: "CPF", req: true, desc: "CPF (só números)" },
  { campo: "Foto Documento", req: true, desc: "URL da foto do documento" },
  { campo: "Selfie Documento", req: true, desc: "URL da selfie com documento" },
  { campo: "Data de Vencimento", req: true, desc: "Dia do vencimento (ex: 30)" },
  { campo: "Outro Telefone", req: false, desc: "Telefone alternativo" },
  { campo: "Plano", req: false, desc: "Plano contratado" },
  { campo: "Data criação Lead", req: false, desc: "ISO date" },
  { campo: "Data Ganho", req: false, desc: "ISO date" },
];

interface ClienteInfo {
  slug: string;
  name: string;
  endpoint: string;
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5 text-xs">
      {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> {label}</>}
    </Button>
  );
}

function EndpointRow({ method = "POST", url, onCopy }: { method?: string; url: string; onCopy: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{method}</span>
      <code className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{url}</code>
      <CopyBtn text={onCopy} />
    </div>
  );
}

function Collapsible({ trigger, children, defaultOpen = false }: { trigger: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {trigger}
      </button>
      {open && <div className="mt-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

function StatCard({ label, value, total, color, bg, icon }: { label: string; value: number; total?: number; color: string; bg: string; icon: React.ReactNode }) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-none">
          {value}
          {pct !== null && <span className={`ml-2 text-sm font-normal ${color}`}>({pct}%)</span>}
        </p>
      </div>
    </div>
  );
}

function LogSection({ title, icon, count, logs, expandedId, onToggleExpand }: { title: string; icon: React.ReactNode; count: number; logs: LogEntry[]; expandedId: string | null; onToggleExpand: (id: string | null) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <Badge variant="secondary">{count} registros</Badge>
      </div>
      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-0">
            <LogsDataTable data={logs} expandedId={expandedId} onToggleExpand={onToggleExpand} hideTipoColumn hideClienteColumn />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ClientePortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const [cRes, lRes] = await Promise.all([
          fetch(`/api/integrations?slug=${encodeURIComponent(slug)}`),
          fetch(`/api/logs?slug=${encodeURIComponent(slug)}&limit=500`),
        ]);
        if (!cRes.ok) { router.replace("/"); return; }
        setCliente(await cRes.json());
        const ld = await lRes.json();
        setLogs(Array.isArray(ld) ? ld : []);
      } catch { setCliente(null); }
      finally { setLoading(false); }
    };
    load();
  }, [slug, router]);

  const urlViabilidade = origin ? `${origin}/api/${slug}/viabilidade` : `/api/${slug}/viabilidade`;
  const urlDocumentacao = origin ? `${origin}/api/${slug}/documentacao` : `/api/${slug}/documentacao`;
  const curlViab = `curl -X POST "${urlViabilidade}" -H "Content-Type: application/json" -d '${payloadViabilidade.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}'`;
  const curlDoc = `curl -X POST "${urlDocumentacao}" -H "Content-Type: application/json" -d '${payloadDocumentacao.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}'`;

  const isDoc = (l: LogEntry) => {
    const r = l.request as Record<string, unknown>;
    return !!(r?.id_conectai ?? r?.id_conecteai);
  };
  const isOk = (l: LogEntry) => {
    if (isDoc(l)) {
      const r = l.response as Record<string, unknown> | undefined;
      return r?.ok === true || r?.message === "Documentação recebida";
    }
    return !l.response?.error && !!l.response?.id_conecteai && l.response?.Cobertura != null;
  };
  const isErr = (l: LogEntry) => {
    if (isDoc(l)) {
      const r = l.response as Record<string, unknown> | undefined;
      return r?.ok !== true && r?.message !== "Documentação recebida";
    }
    return !!l.response?.error || (!l.response?.id_conecteai && l.response?.Cobertura != null);
  };

  const logsViab = logs.filter((l) => !isDoc(l));
  const logsDocm = logs.filter(isDoc);
  const sv = { total: logsViab.length, ok: logsViab.filter(isOk).length, err: logsViab.filter(isErr).length };
  const sd = { total: logsDocm.length, ok: logsDocm.filter(isOk).length, err: logsDocm.filter(isErr).length };

  const chartData = (() => {
    const map: Record<string, { ok: number; err: number }> = {};
    for (const l of logs) {
      const k = new Date(l.createdAt).toISOString().slice(0, 10);
      if (!map[k]) map[k] = { ok: 0, err: 0 };
      if (isOk(l)) map[k].ok += 1;
      else if (isErr(l)) map[k].err += 1;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
      dia: new Date(k + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Sucesso: v.ok,
      Erro: v.err,
    }));
  })();

  if (loading) {
    return (
      <AdminShell heading="Carregando...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            Carregando dados do cliente...
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!cliente) return null;

  return (
    <AdminShell
      heading={cliente.name}
      subheading={`slug: ${cliente.slug}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clientes", href: "/clientes" },
        { label: cliente.name },
      ]}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/clientes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Stats: 2 rows x 3 cols on large screens */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ClipboardList className="h-4 w-4" /> Viabilidade
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total" value={sv.total} bg="bg-muted/60" color="text-muted-foreground" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
              <StatCard label="Sucesso" value={sv.ok} total={sv.total} bg="bg-green-50" color="text-green-600" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
              <StatCard label="Erro" value={sv.err} total={sv.total} bg="bg-red-50" color="text-red-500" icon={<XCircle className="h-4 w-4 text-red-500" />} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4" /> Documentação
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total" value={sd.total} bg="bg-muted/60" color="text-muted-foreground" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
              <StatCard label="Sucesso" value={sd.ok} total={sd.total} bg="bg-green-50" color="text-green-600" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
              <StatCard label="Erro" value={sd.err} total={sd.total} bg="bg-red-50" color="text-red-500" icon={<XCircle className="h-4 w-4 text-red-500" />} />
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" /> Atividade por dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }} />
                    <Area type="monotone" dataKey="Sucesso" stroke="#22c55e" strokeWidth={2} fill="url(#gS)" />
                    <Area type="monotone" dataKey="Erro" stroke="#ef4444" strokeWidth={2} fill="url(#gE)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endpoints */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Plug className="h-4 w-4 text-primary" /> Endpoints de integração
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="space-y-3 pb-5">
              <div className="grid gap-3 lg:grid-cols-2">
                <EndpointRow url={urlViabilidade} onCopy={urlViabilidade} />
                <EndpointRow url={urlDocumentacao} onCopy={urlDocumentacao} />
              </div>
            </div>

            <div className="py-4">
              <Collapsible trigger={<span className="text-sm">Instruções — Viabilidade</span>}>
                <div className="space-y-4 pl-6">
                  <p className="text-sm text-muted-foreground">
                    Envie um <strong>POST</strong> com o payload abaixo para consultar cobertura e gerar o <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">id_conecteai</code>.
                  </p>
                  <div className="relative">
                    <pre className="overflow-auto rounded-lg border bg-muted/50 p-4 text-xs font-mono leading-relaxed">{payloadViabilidade}</pre>
                    <div className="absolute right-2 top-2"><CopyBtn text={curlViab} label="cURL" /></div>
                  </div>
                </div>
              </Collapsible>
            </div>

            <div className="py-4">
              <Collapsible trigger={<span className="text-sm">Instruções — Documentação</span>}>
                <div className="space-y-4 pl-6">
                  <p className="text-sm text-muted-foreground">
                    Após a viabilidade, envie um <strong>POST</strong> com os dados do assinante.
                  </p>
                  <Collapsible trigger={<span className="text-sm">Ver todos os campos do payload</span>}>
                    <div className="overflow-auto rounded-lg border bg-muted/30">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr className="text-left text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Campo</th>
                            <th className="px-3 py-2 font-medium">Obrig.</th>
                            <th className="px-3 py-2 font-medium">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CAMPOS_DOC.map((c) => (
                            <tr key={c.campo} className="border-t border-border/50">
                              <td className="px-3 py-2 font-mono text-foreground">{c.campo}</td>
                              <td className="px-3 py-2">{c.req ? <span className="text-green-600">Sim</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-3 py-2 text-muted-foreground">{c.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Collapsible>
                  <div className="relative">
                    <pre className="overflow-auto rounded-lg border bg-muted/50 p-4 text-xs font-mono leading-relaxed">{payloadDocumentacao}</pre>
                    <div className="absolute right-2 top-2"><CopyBtn text={curlDoc} label="cURL" /></div>
                  </div>
                </div>
              </Collapsible>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <div className="grid gap-8 xl:grid-cols-2">
          <LogSection title="Registros de Viabilidade" icon={<ClipboardList className="h-4 w-4" />} count={sv.total} logs={logsViab} expandedId={expandedId} onToggleExpand={setExpandedId} />
          <LogSection title="Registros de Documentação" icon={<FileText className="h-4 w-4" />} count={sd.total} logs={logsDocm} expandedId={expandedId} onToggleExpand={setExpandedId} />
        </div>
      </div>
    </AdminShell>
  );
}
