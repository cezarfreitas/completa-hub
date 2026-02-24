"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogsDataTable, type LogEntry } from "./logs-data-table";

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

  useEffect(() => { if (slugFromUrl) setFilterSlug(slugFromUrl); }, [slugFromUrl]);

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
      subheading={activeCliente ? `Filtrando: ${activeCliente.name}` : "Histórico de requisições"}
    >
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Filtro */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Cliente:</span>
          <Select
            value={filterSlug || ALL}
            onValueChange={(v) => setFilterSlug(v === ALL ? "" : v)}
          >
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.slug} value={c.slug} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {logs.length} registro(s)
            </span>
          )}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground mr-2" />
            Carregando...
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <LogsDataTable
              data={logs}
              expandedId={expandedId}
              onToggleExpand={setExpandedId}
            />
          </div>
        )}

      </div>
    </AdminShell>
  );
}
