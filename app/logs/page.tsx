"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogsDataTable, type LogEntry } from "./logs-data-table";
import { ScrollText, Filter } from "lucide-react";

interface Cliente {
  slug: string;
  name: string;
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get("slug") || "";
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const ALL = "__all__";
  const [filterSlug, setFilterSlug] = useState<string>(slugFromUrl || "");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugFromUrl) setFilterSlug(slugFromUrl);
  }, [slugFromUrl]);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => setClientes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterSlug && filterSlug !== ALL) p.set("slug", filterSlug);
    p.set("limit", "50");
    fetch(`/api/logs?${p}`)
      .then((r) => r.json())
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [filterSlug]);

  const activeCliente = clientes.find((c) => c.slug === filterSlug);

  return (
    <AdminShell
      heading="Logs"
      subheading={
        activeCliente
          ? `Filtrando: ${activeCliente.name}`
          : "Histórico de requisições"
      }
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Logs" },
      ]}
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Filtrar por cliente
                </label>
                <p className="text-xs text-muted-foreground">
                  {activeCliente
                    ? `Exibindo apenas logs de ${activeCliente.name}`
                    : "Exibindo logs de todos os clientes"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filterSlug || ALL}
                onValueChange={(v) => setFilterSlug(v === ALL ? "" : v)}
              >
                <SelectTrigger className="h-9 w-[240px]">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loading && (
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {logs.length} registro{logs.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Carregando logs...
            </div>
          </div>
        ) : logs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ScrollText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">
                Nenhum registro encontrado
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {activeCliente
                  ? `Não há logs para ${activeCliente.name}. Tente outro cliente ou aguarde novas requisições.`
                  : "Não há logs registrados. As requisições aparecerão aqui quando forem recebidas."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <LogsDataTable
                data={logs}
                expandedId={expandedId}
                onToggleExpand={setExpandedId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
