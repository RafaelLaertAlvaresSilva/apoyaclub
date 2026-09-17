import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { contactRequestRowToContactRequest, type ContactRequestRow } from "@/lib/contact-request-mappers";
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

  // Desde que no hay cuentas de empresa (migración 0034), la solicitud
  // ya trae dentro quién escribe: no hay que ir a buscar ningún perfil
  // ni ningún correo a otra tabla.
  const solicitudes = (filasRaw ?? []).map((fila) => ({
    solicitud: contactRequestRowToContactRequest(fila),
    opportunityTitle: fila.opportunities?.title ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("solicitudesDeContacto")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Empresas que han escrito desde tu página pública. Contestar el mismo día es lo que más cierra acuerdos.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="solicitudes" />

      {solicitudes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">{t("todaviaNoHasRecibido")}</p>
      ) : (
        <ul className="space-y-4">
          {solicitudes.map(({ solicitud, opportunityTitle }) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              opportunityTitle={opportunityTitle}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
