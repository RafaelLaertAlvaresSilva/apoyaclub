import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../components/AdminNav";
import { FilaEmpresa } from "./components/FilaEmpresa";
import type { EmpresaAdminRow } from "./types";
import { CABECERA_TABLA } from "../components/estilos";

type FilaCompany = {
  id: string;
  name: string | null;
  slug: string | null;
  sector: string | null;
  city: string | null;
  province: string | null;
  open_to_sponsor: boolean | null;
  alerts_enabled: boolean | null;
  admin_suspended?: boolean | null;
  admin_test_mode?: boolean | null;
};

const AVISOS: Record<string, { texto: string; bien: boolean }> = {
  suspendida: {
    texto: "Empresa suspendida. Ya no sale en el directorio, no recibe avisos y no puede entrar a su panel.",
    bien: true,
  },
  reactivada: { texto: "Empresa reactivada. Vuelve a tener su panel y, si ella lo tiene marcado, su ficha.", bien: true },
  "modo-pruebas": {
    texto:
      "Empresa en modo de pruebas. En un minuto como mucho deja de verse en el directorio, y puede seguir usando su panel con normalidad.",
    bien: true,
  },
  "fuera-de-pruebas": {
    texto: "Modo de pruebas quitado. Si la empresa tiene marcado salir en el directorio, vuelve a verse en un minuto.",
    bien: true,
  },
  "sin-ficha": {
    texto:
      "Esa empresa todavía no ha guardado su ficha, así que no hay nada que esconder ni suspender. En cuanto la guarde, podrás hacerlo.",
    bien: false,
  },
  "no-admin": { texto: "Tu sesión ha caducado. Vuelve a iniciar sesión e inténtalo otra vez.", bien: false },
};

/** Cuántas filas de una tabla hay por empresa (para la columna de actividad). */
function contarPorEmpresa(filas: { company_id: string }[] | null): Map<string, number> {
  const cuenta = new Map<string, number>();
  for (const fila of filas ?? []) cuenta.set(fila.company_id, (cuenta.get(fila.company_id) ?? 0) + 1);
  return cuenta;
}

/**
 * Listado de empresas para el admin (migración 0055): lo mismo que el
 * de clubes, con su actividad, el modo de pruebas y suspender.
 *
 * Como en clubes, la lista de partida son las cuentas con rol "empresa"
 * en Supabase Auth: una empresa recién registrada que todavía no ha
 * guardado su ficha no tiene fila en `companies` y aun así tiene que
 * salir aquí.
 */
export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; buscar?: string }>;
}) {
  const { aviso, buscar } = await searchParams;
  const busqueda = (buscar ?? "").trim().toLowerCase();
  const mensaje = aviso ? AVISOS[aviso] : undefined;
  const t = await getTranslations("admin.empresas");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const admin = createAdminClient();
  const usuarios = await obtenerUsuariosPorRol("empresa");
  const ids = usuarios.map((usuario) => usuario.id);

  const [{ data: empresas }, { data: ofertas }, { data: propuestas }, { data: guardados }] =
    ids.length > 0
      ? await Promise.all([
          // `*` y no una lista de columnas: si la web se publica antes de
          // ejecutar la migración 0055, las columnas nuevas todavía no
          // existen y una lista explícita haría fallar toda la página.
          admin.from("companies").select("*").in("id", ids).returns<FilaCompany[]>(),
          admin
            .from("company_offers")
            .select("company_id")
            .in("company_id", ids)
            .is("archived_at", null)
            .eq("status", "available")
            .returns<{ company_id: string }[]>(),
          admin.from("club_proposals").select("company_id").in("company_id", ids).returns<{ company_id: string }[]>(),
          admin.from("company_favorites").select("company_id").in("company_id", ids).returns<{ company_id: string }[]>(),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const porId = new Map((empresas ?? []).map((fila) => [fila.id, fila]));
  const ofertasPorEmpresa = contarPorEmpresa(ofertas);
  const propuestasPorEmpresa = contarPorEmpresa(propuestas);
  const guardadosPorEmpresa = contarPorEmpresa(guardados);

  const filas: EmpresaAdminRow[] = usuarios
    .map((usuario) => {
      const fila = porId.get(usuario.id);
      const lugar = [fila?.city, fila?.province].filter(Boolean).join(" · ");
      return {
        id: usuario.id,
        name: fila?.name?.trim() || "(ficha sin completar)",
        slug: fila?.slug ?? null,
        sector: fila?.sector ?? null,
        lugar: lugar || "—",
        email: usuario.email,
        createdAt: usuario.createdAt,
        fichaCreada: Boolean(fila),
        enElDirectorio: Boolean(fila?.open_to_sponsor),
        avisosActivados: Boolean(fila?.alerts_enabled),
        ofertasActivas: ofertasPorEmpresa.get(usuario.id) ?? 0,
        propuestasRecibidas: propuestasPorEmpresa.get(usuario.id) ?? 0,
        guardados: guardadosPorEmpresa.get(usuario.id) ?? 0,
        suspended: Boolean(fila?.admin_suspended),
        modoPruebas: Boolean(fila?.admin_test_mode),
      } satisfies EmpresaAdminRow;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const visibles = busqueda
    ? filas.filter((fila) =>
        [fila.name, fila.lugar, fila.email, fila.sector].some((campo) => (campo ?? "").toLowerCase().includes(busqueda)),
      )
    : filas;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("empresas")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="empresas" />

      {mensaje && (mensaje.bien ? <AvisoExito mensaje={mensaje.texto} /> : <AvisoError mensaje={mensaje.texto} />)}

      {filas.length > 0 && (
        <form className="flex flex-wrap items-center gap-2">
          <label htmlFor="buscar-empresa" className="sr-only">
            Buscar una empresa por nombre, sector, localidad o correo
          </label>
          <input
            id="buscar-empresa"
            name="buscar"
            type="search"
            defaultValue={buscar ?? ""}
            placeholder="Nombre, sector, localidad o correo"
            className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accion-tinta focus:outline-none focus:ring-1 focus:ring-accion-tinta"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-brand-navy"
          >
            Buscar
          </button>
          {busqueda && (
            <>
              <Link
                href="/admin/empresas"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-100"
              >
                Ver todas
              </Link>
              <span className="text-sm text-zinc-500">
                {visibles.length} de {filas.length}
              </span>
            </>
          )}
        </form>
      )}

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("todaviaNoSeHa")}</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-zinc-500">Ninguna empresa coincide con «{buscar}».</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className={CABECERA_TABLA}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("empresa")}</th>
                <th className="px-4 py-3 font-medium">{t("alta")}</th>
                <th className="px-4 py-3 font-medium">Actividad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibles.map((fila) => (
                <FilaEmpresa key={fila.id} fila={fila} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
