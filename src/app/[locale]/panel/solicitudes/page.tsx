import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { companyRowToProfile, type CompanyRow } from "@/lib/company-mappers";
import { contactRequestRowToContactRequest, type ContactRequestRow } from "@/lib/contact-request-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { SolicitudCard } from "./components/SolicitudCard";

type ContactRequestConOportunidad = ContactRequestRow & {
  opportunities: { title: string } | null;
};

/** Panel del club: solicitudes de contacto recibidas (Fase 8). */
export default async function SolicitudesPage() {
  const t = await getTranslations("panel.solicitudes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const { data: filasRaw } = await supabase
    .from("contact_requests")
    .select("*, opportunities(title)")
    .eq("club_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ContactRequestConOportunidad[]>();

  const filas = filasRaw ?? [];
  const companyIds = Array.from(new Set(filas.map((fila) => fila.company_id)));

  const [{ data: companiesRaw }, emailsPorEmpresa] = await Promise.all([
    companyIds.length > 0
      ? supabase.from("companies").select("*").in("id", companyIds).returns<CompanyRow[]>()
      : Promise.resolve({ data: [] as CompanyRow[] }),
    obtenerEmailsEmpresas(companyIds),
  ]);

  const perfilesPorEmpresa = new Map(
    (companiesRaw ?? []).map((fila) => [fila.id, companyRowToProfile(fila)]),
  );

  const solicitudes = filas.map((fila) => ({
    solicitud: contactRequestRowToContactRequest(fila),
    opportunityTitle: fila.opportunities?.title ?? null,
    empresa: perfilesPorEmpresa.get(fila.company_id) ?? null,
    empresaEmail: emailsPorEmpresa.get(fila.company_id) ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("solicitudesDeContacto")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="solicitudes" />

      {solicitudes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">{t("todaviaNoHasRecibido")}</p>
      ) : (
        <ul className="space-y-4">
          {solicitudes.map(({ solicitud, opportunityTitle, empresa, empresaEmail }) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              opportunityTitle={opportunityTitle}
              empresa={empresa}
              empresaEmail={empresaEmail}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** El email de la empresa vive en `auth.users` (no en `companies`), igual
 * que `obtenerEmailContacto` para el club en `club/[slug]/data.ts`. */
async function obtenerEmailsEmpresas(companyIds: string[]): Promise<Map<string, string>> {
  if (companyIds.length === 0) return new Map();

  try {
    const admin = createAdminClient();
    const resultados = await Promise.all(companyIds.map((id) => admin.auth.admin.getUserById(id)));

    const mapa = new Map<string, string>();
    resultados.forEach((resultado, indice) => {
      const email = resultado.data.user?.email;
      if (email) mapa.set(companyIds[indice], email);
    });
    return mapa;
  } catch {
    return new Map();
  }
}
