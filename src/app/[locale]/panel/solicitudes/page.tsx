import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { contactRequestRowToContactRequest, type ContactRequestRow } from "@/lib/contact-request-mappers";
import { createClient } from "@/lib/supabase/server";
import { SolicitudCard } from "./components/SolicitudCard";
import { tituloDelPanel } from "@/lib/titulo-del-panel";
import { CabeceraDePagina } from "../components/CabeceraDePagina";
import { EstadoVacio } from "../components/EstadoVacio";

type ContactRequestConOportunidad = ContactRequestRow & {
  opportunities: { title: string } | null;
};

export async function generateMetadata() {
  return tituloDelPanel("solicitudes");
}

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
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <CabeceraDePagina icono="solicitudes" etiqueta={t("panelDelClub")} titulo={t("solicitudesDeContacto")} texto={t("empresasHanEscritoDesde")} />


      {solicitudes.length === 0 ? (
        <EstadoVacio icono="solicitudes">{t("todaviaNoHasRecibido")}</EstadoVacio>
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
