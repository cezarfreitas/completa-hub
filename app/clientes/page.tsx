"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, X, Users, Link2 } from "lucide-react";
import { ClientesDataTable, type Cliente } from "./clientes-data-table";

const getEndpoints = (slug: string, origin: string) => {
  const s = slug.trim().toLowerCase().replace(/\s+/g, "-") || "cliente-abc";
  const base = origin ? `${origin}/api/${s}` : `/api/${s}`;
  return {
    viabilidade: `${base}/viabilidade`,
    documentacao: `${base}/documentacao`,
  };
};

const emptyForm = {
  slug: "",
  name: "",
  plan_id: 4928,
  completa_api_url: "https://assine.completa.vc/api/v2/subscriptions",
  completa_origin: "https://completa.conecte.ai/api/NYoTwiBvcZKoeunF",
  n8n_config_url: "",
};

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {hint && (
          <span className="text-xs text-muted-foreground">({hint})</span>
        )}
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
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
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
        ? data.map((d: Cliente & { _id?: string }) => ({
            ...d,
            id: String(d.id ?? d._id ?? ""),
          }))
        : []
    );
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const url = editingId
        ? `/api/integrations/${editingId}`
        : "/api/integrations";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? {
            name: form.name,
            plan_id: form.plan_id,
            completa_api_url: form.completa_api_url,
            completa_origin: form.completa_origin,
            n8n_webhook_url: null,
            n8n_config_url: form.n8n_config_url || null,
          }
        : { ...form, n8n_webhook_url: null };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg("err", data.error || "Erro ao salvar");
        return;
      }

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
    setForm({
      slug: c.slug,
      name: c.name,
      plan_id: c.plan_id,
      completa_api_url: c.completa_api_url,
      completa_origin: c.completa_origin,
      n8n_config_url: c.n8n_config_url || "",
    });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remover "${name}"? O endpoint deixará de funcionar.`)) return;
    const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    const data = await res.json();
    res.ok
      ? showMsg("ok", "Cliente removido")
      : showMsg("err", data.error || "Erro ao remover");
    if (res.ok) loadClientes();
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };
  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const eps = getEndpoints(form.slug, origin);

  return (
    <AdminShell
      heading="Clientes"
      subheading="Gerencie clientes e seus endpoints de integração"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Clientes" }]}
      actions={
        !showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {message && (
          <Alert variant={message.type === "ok" ? "success" : "destructive"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {showForm && (
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">
                  {editingId ? "Editar cliente" : "Novo cliente"}
                </CardTitle>
                <CardDescription className="mt-1">
                  Preencha os dados para{" "}
                  {editingId ? "atualizar" : "cadastrar"} o cliente
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelForm}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldGroup label="Nome">
                    <Input
                      value={form.name}
                      onChange={update("name")}
                      required
                      placeholder="Ex: Cliente ABC"
                    />
                  </FieldGroup>
                  <FieldGroup label="Slug" hint="único, imutável">
                    <Input
                      value={form.slug}
                      onChange={update("slug")}
                      required
                      disabled={!!editingId}
                      placeholder="cliente-abc"
                      className="disabled:opacity-60"
                    />
                  </FieldGroup>
                  <FieldGroup label="Plan ID">
                    <Input
                      type="number"
                      value={form.plan_id}
                      onChange={update("plan_id")}
                      required
                    />
                  </FieldGroup>
                </div>

                {form.slug.trim() && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Link2 className="h-4 w-4" />
                      Endpoints gerados
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[eps.viabilidade, eps.documentacao].map((url) => (
                        <div
                          key={url}
                          className="flex items-center gap-2 rounded-md bg-background px-3 py-2"
                        >
                          <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            POST
                          </span>
                          <span className="truncate font-mono text-xs text-foreground">
                            {url}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <p className="text-sm font-medium text-foreground">
                    API Completa
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldGroup label="URL da API">
                      <Input
                        type="url"
                        value={form.completa_api_url}
                        onChange={update("completa_api_url")}
                        required
                        placeholder="https://assine.completa.vc/api/v2/subscriptions"
                      />
                    </FieldGroup>
                    <FieldGroup label="Origin">
                      <Input
                        value={form.completa_origin}
                        onChange={update("completa_origin")}
                        required
                        placeholder="https://..."
                      />
                    </FieldGroup>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Salvando..."
                      : editingId
                        ? "Salvar alterações"
                        : "Cadastrar cliente"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Client list */}
        {clientes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">
                Nenhum cliente cadastrado
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Cadastre seu primeiro cliente para configurar os endpoints de
                integração.
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar primeiro cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border shadow-sm">
            <ClientesDataTable
              data={clientes}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
