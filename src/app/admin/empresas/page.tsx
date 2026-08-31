import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { companyRowToProfile, type CompanyRow } from "@/lib/company-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../components/AdminNav";

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

/**
 * Listado de empresas registradas para el admin (Fase 12): solo
 * lectura, sin acciones de moderación.
 *
 * Igual que en `/admin/clubes`: la lista de partida son las cuentas con
 * rol "empresa" en Supabase Auth, no las filas de `companies` (esa
 * tabla se crea con `upsert` la primera vez que la empresa guarda su
 * perfil, Fase 8), así que una empresa recién registrada que todavía no
 * ha tocado su panel tiene que aparecer igualmente en este listado.
 */
export default async function AdminEmpresasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const usuarios = await obtenerUsuariosPorRol("empresa");
  const ids = usuarios.map((usuario) => usuario.id);

  const { data: filasEmpresas } =
    ids.length > 0
      ? await admin.from("companies").select("*").in("id", ids).returns<CompanyRow[]>()
      : { data: [] as CompanyRow[] };

  const empresasPorId = new Map((filasEmpresas ?? []).map((fila) => [fila.id, companyRowToProfile(fila)]));

  const filas = usuarios
    .map((usuario) => ({ usuario, perfil: empresasPorId.get(usuario.id) ?? null }))
    .sort((a, b) => new Date(b.usuario.createdAt).getTime() - new Date(a.usuario.createdAt).getTime());

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Panel de administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Empresas</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="empresas" />

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no se ha registrado ninguna empresa.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 font-medium">Localidad</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filas.map(({ usuario, perfil }) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {perfil?.name || <span className="font-normal text-zinc-400">(perfil sin completar)</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{perfil?.sector || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{perfil?.city || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{usuario.email || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    {formatoFecha.format(new Date(usuario.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
