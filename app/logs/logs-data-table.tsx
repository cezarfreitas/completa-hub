"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, AlertCircle, Search } from "lucide-react";

export interface LogEntry {
  _id: string;
  integrationSlug: string;
  request: Record<string, unknown>;
  response: Record<string, unknown> & {
    Cobertura?: string;
    error?: string;
    id_conecteai?: string | null;
  };
  createdAt: string;
}

interface LogsDataTableProps {
  data: LogEntry[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  hideTipoColumn?: boolean;
  hideClienteColumn?: boolean;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function LogsDataTable({
  data,
  expandedId,
  onToggleExpand,
  hideTipoColumn = false,
  hideClienteColumn = false,
}: LogsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);

  const isDocumentacao = (req: Record<string, unknown>) =>
    !!(req?.id_conectai ?? req?.id_conecteai);

  const columns: ColumnDef<LogEntry>[] = [
    ...(!hideTipoColumn
      ? [
          {
            id: "tipo",
            header: "Tipo",
            cell: ({ row }: { row: { original: LogEntry } }) => {
              const req = (row.original.request || {}) as Record<
                string,
                unknown
              >;
              const doc = isDocumentacao(req);
              return (
                <Badge
                  variant={doc ? "secondary" : "default"}
                  className="text-xs"
                >
                  {doc ? "Documentação" : "Viabilidade"}
                </Badge>
              );
            },
          } as ColumnDef<LogEntry>,
        ]
      : []),
    ...(!hideClienteColumn
      ? [
          {
            accessorKey: "integrationSlug",
            header: ({
              column,
            }: {
              column: {
                toggleSorting: (asc: boolean) => void;
                getIsSorted: () => string | false;
              };
            }) => (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="-ml-3 font-semibold"
              >
                Cliente
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            ),
            cell: ({
              row,
            }: {
              row: {
                original: LogEntry;
                getValue: (key: string) => string;
              };
            }) => {
              const hasApiError = !!row.original.response?.error;
              const missingIdConecteai =
                !hasApiError &&
                !row.original.response?.id_conecteai &&
                row.original.response?.Cobertura != null;
              const hasError = hasApiError || missingIdConecteai;
              return (
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${hasError ? "text-red-600" : ""}`}
                  >
                    {row.getValue("integrationSlug")}
                  </span>
                  {hasError && (
                    <Badge variant="error" className="text-[10px]">
                      {missingIdConecteai ? "Sem ID" : "Erro"}
                    </Badge>
                  )}
                </div>
              );
            },
          } as ColumnDef<LogEntry>,
        ]
      : []),
    {
      id: "nome",
      header: "Nome",
      accessorFn: (row) => {
        const r = row.request as Record<string, unknown>;
        return (r?.nome ?? r?.Nome ?? "-") as string;
      },
      cell: ({ row }) => {
        const r = row.original.request as Record<string, unknown>;
        const nome = (r?.nome ?? r?.Nome ?? "-") as string;
        return <span>{nome}</span>;
      },
    },
    {
      id: "cidade",
      header: "Cidade",
      accessorFn: (row) => {
        const r = row.request as Record<string, unknown>;
        return (r?.cidade ?? r?.Cidade ?? "-") as string;
      },
      cell: ({ row }) => {
        const r = row.original.request as Record<string, unknown>;
        const cidade = (r?.cidade ?? r?.Cidade ?? "-") as string;
        return <span className="text-muted-foreground">{cidade}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const req = (row.original.request || {}) as Record<string, unknown>;
        const res = row.original.response as
          | Record<string, unknown>
          | undefined;
        const isDoc = isDocumentacao(req);

        if (isDoc) {
          const ok =
            res?.ok === true || res?.message === "Documentação recebida";
          return (
            <Badge variant={ok ? "success" : "error"}>
              {ok ? "Recebido" : (res?.error as string) || "Erro"}
            </Badge>
          );
        }

        const hasApiError = !!res?.error;
        const missingIdConecteai =
          !hasApiError && !res?.id_conecteai && res?.Cobertura != null;
        return (
          <Badge
            variant={
              hasApiError ? "error" : missingIdConecteai ? "error" : "success"
            }
          >
            {hasApiError
              ? (res?.error as string) || "Erro"
              : missingIdConecteai
                ? "Sem id_conecteai"
                : (res?.Cobertura as string) || "OK"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 font-semibold"
        >
          Data
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div className="w-full">
      {!hideClienteColumn && (
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={
                (table
                  .getColumn("integrationSlug")
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table
                  .getColumn("integrationSlug")
                  ?.setFilterValue(e.target.value)
              }
              className="pl-9"
            />
          </div>
          <p className="ml-auto text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} de {data.length} registro
            {data.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const hasApiError = !!row.original.response?.error;
                const missingIdConecteai =
                  !hasApiError &&
                  !row.original.response?.id_conecteai &&
                  row.original.response?.Cobertura != null;
                const hasError = hasApiError || missingIdConecteai;
                const isExpanded = expandedId === row.original._id;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className={`cursor-pointer transition-colors ${
                        hasError ? "border-l-4 border-l-red-300" : ""
                      }`}
                      onClick={() =>
                        onToggleExpand(isExpanded ? null : row.original._id)
                      }
                      data-state={isExpanded ? "selected" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="bg-muted/20 p-0"
                        >
                          <div className="grid gap-4 p-5 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-sm font-semibold text-foreground">
                                Request
                              </p>
                              <pre className="overflow-auto rounded-lg border bg-card p-4 text-xs font-mono leading-relaxed">
                                {JSON.stringify(
                                  row.original.request || {},
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-2 text-sm font-semibold text-foreground">
                                Response
                              </p>
                              <pre
                                className={`overflow-auto rounded-lg border p-4 text-xs font-mono leading-relaxed ${
                                  hasError
                                    ? "border-red-200 bg-red-50/50"
                                    : "bg-card"
                                }`}
                              >
                                {JSON.stringify(
                                  row.original.response || {},
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                            {missingIdConecteai && (
                              <div className="lg:col-span-2">
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    ID ConecteAI não foi gerado pela API
                                    Completa
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <p className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
