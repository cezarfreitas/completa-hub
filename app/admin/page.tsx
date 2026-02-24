import { redirect } from "next/navigation";

/**
 * Redireciona /admin para /clientes
 */
export default function AdminRedirect() {
  redirect("/clientes");
}
