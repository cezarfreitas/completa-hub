"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X } from "lucide-react";
import { ClientesDataTable, type Cliente } from "./clientes-data-table";

const getEndpoints = (slug: string, origin: string) => {
  const s = slug.trim().toLowerCase().replace(/\s+/g, "-") || "cliente-abc";
  const base = origin ? `${origin}/api/${s}` : `/api/${s}`;
  return { viabilidade: `${base}/viabilidade`, documentacao: `${base}/documentacao` };
};

const emptyForm = {
  slug: "",
  name: "",
  plan_id: 4928,
  completa_api_url: "https://assine.completa.vc/api/v2/subscriptions",
  completa_origin: "https://completa.conecte.ai/api/NYoTwiBvcZKoeunF",
  n8n_config_url: "",
};

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {hint && <span className="ml-1.5 text-xs text-muted-foreground/60">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function GestaoClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const loadClientes = async () => {
    const res = await fetch("/api/integrations?admin=1");
    const data = await res.json();
    setClientes(
      Array.isArray(data)
        ? data.map((d: Cliente & { _id?: string }) => ({ ...d, id: String(d.id ?? d._id ?? "") }))
        : []
    );
  };

  useEffect(() => { loadClientes(); }, []);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const url = editingId ? `/api/integrations/${editingId}` : "/api/integrations";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { name: form.name, plan_id: form.plan_id, completa_api_url: form.completa_api_url, completa_origin: form.completa_origin, n8n_webhook_url: null, n8n_config_url: form.n8n_config_url || null }
        : { ...form, n8n_webhook_url: null };

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showMsg("err", data.error || "Erro ao salvar"); return; }

      showMsg("ok", editingId ? "Cliente atualizado" : "Cliente adicionado");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadClientes();
    } catch {
      showMsg("err", "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: Cliente) => {
    setForm({ slug: c.slug, name: c.name, plan_id: c.plan_id, completa_api_url: c.completa_api_url, completa_origin: c.completa_origin, n8n_config_url: c.n8n_config_url || "" });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remover "${name}"? O endpoint deixará de funcionar.`)) return;
    const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    const data = await res.json();
    res.ok ? showMsg("ok", "Cliente removido") : showMsg("err", data.error || "Erro ao remover");
    if (res.ok) loadClientes();
  };

  const cancelForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const eps = getEndpoints(form.slug, origin);

  return (
    <AdminShell
      heading="Clientes"
      subheading="Gerencie clientes e seus endpoints"
      actions={
        !showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo
          </Button>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">

        {message && (
          <Alert variant={message.type === "ok" ? "success" : "destructive"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {editingId ? "Editar cliente" : "Novo cliente"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Preencha os dados para {editingId ? "atualizar" : "cadastrar"}
                </p>
              </div>
              <button type="button" onClick={cancelForm} className="rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identificação */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Nome">
                  <Input value={form.name} onChange={update("name")} required placeholder="Cliente ABC" className="h-9 text-sm" />
                </FieldGroup>
                <FieldGroup label="Slug" hint="(único, imutável)">
                  <Input value={form.slug} onChange={update("slug")} required disabled={!!editingId} placeholder="cliente-abc" className="h-9 text-sm disabled:opacity-50" />
                </FieldGroup>
              </div>

              {/* Preview de endpoints */}
              {form.slug.trim() && (
                <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Endpoints gerados</p>
                  {[eps.viabilidade, eps.documentacao].map((url) => (
                    <div key={url} className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold uppercase text-primary">POST</span>
                      <span className="truncate text-foreground">{url}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* API */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">API Completa</p>
                <FieldGroup label="URL da API">
                  <Input type="url" value={form.completa_api_url} onChange={update("completa_api_url")} required placeholder="https://assine.completa.vc/api/v2/subscriptions" className="h-9 text-sm" />
                </FieldGroup>
                <FieldGroup label="Origin">
                  <Input value={form.completa_origin} onChange={update("completa_origin")} required placeholder="https://..." className="h-9 text-sm" />
                </FieldGroup>
                <FieldGroup label="Plan ID">
                  <Input type="number" value={form.plan_id} onChange={update("plan_id")} required className="h-9 w-32 text-sm" />
                </FieldGroup>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Salvando..." : editingId ? "Salvar" : "Cadastrar"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {clientes.length > 0 ? `${clientes.length} cliente(s)` : "Clientes"}
            </p>
            {!showForm && clientes.length > 0 && (
              <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            )}
          </div>

          {clientes.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
              <button type="button" onClick={() => setShowForm(true)} className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Cadastrar primeiro cliente
              </button>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <ClientesDataTable data={clientes} onEdit={handleEdit} onRemove={handleRemove} />
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  );
}
