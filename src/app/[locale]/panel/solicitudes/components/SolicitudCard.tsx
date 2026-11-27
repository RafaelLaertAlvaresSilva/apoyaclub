import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import { ESTADOS_SOLICITUD } from "@/lib/contact-requests";
import type { ContactRequest, ContactRequestStatus } from "@/lib/types";
import { cambiarEstadoSolicitud } from "../actions";
import { formatoConMesCorto } from "@/lib/format";

const ESTILO_ESTADO: Record<ContactRequestStatus, string> = {
  new: "bg-accion text-sobre-color",
  seen: "bg-sky-500 text-sobre-color",
  in_conversation: "bg-aviso text-sobre-aviso",
  closed: "bg-zinc-400 text-sobre-color",
  discarded: "bg-zinc-300 text-zinc-600",
};

export function SolicitudCard({
  solicitud,
  opportunityTitle,
}: {
  solicitud: ContactRequest;
  opportunityTitle: string | null;
}) {
  // Desde que no hay cuentas de empresa (migración 0034), lo que
  // identifica al remitente es lo que escribió en el formulario. Las
  // solicitudes de antes no lo traen: ahí el nombre no se puede saber.
  const t = useTranslations("panel.solicitudes");
  const formatoFecha = formatoConMesCorto(useIntlLocale());
  const titular =
    solicitud.remitenteEmpresa || solicitud.remitenteNombre || t("solicitudAnterior");

  return (
    <li className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {/* La inicial de quien escribe, como en cualquier bandeja de
              correo: las solicitudes se distinguen de un vistazo. */}
          <span
            aria-hidden="true"
            className="flex size-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-teal-dark to-brand-navy text-base font-extrabold text-sobre-color shadow-sm"
          >
            {titular.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-titular">{titular}</h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO_ESTADO[solicitud.status]}`}
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-80" />
                {t(`estados.${solicitud.status}`)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              {opportunityTitle ? t("sobre", { titulo: opportunityTitle }) : t("sobreElClub")}
              {" · "}
              {formatoFecha.format(new Date(solicitud.createdAt))}
            </p>
          </div>
        </div>

        {/* Responder sin copiar la dirección: abre el correo del club
            con la empresa ya puesta. */}
        {solicitud.remitenteEmail && (
          <a
            href={`mailto:${solicitud.remitenteEmail}`}
            className="inline-flex flex-none items-center gap-2 rounded-lg bg-accion px-3.5 py-2 text-sm font-semibold text-sobre-color shadow-sm transition-colors hover:bg-accion-fuerte"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m9 17-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            {t("responder")}
          </a>
        )}
      </div>

      <div className="mt-3 grid gap-1 text-sm text-zinc-600 sm:grid-cols-2 sm:pl-14">
        {solicitud.remitenteNombre && solicitud.remitenteEmpresa && (
          <p>{t("persona", { nombre: solicitud.remitenteNombre })}</p>
        )}
        {solicitud.remitenteEmail && (
          <p>
            {t("correo")}{" "}
            <a
              href={`mailto:${solicitud.remitenteEmail}`}
              className="font-medium text-teal-700 hover:underline"
            >
              {solicitud.remitenteEmail}
            </a>
          </p>
        )}
        {solicitud.remitenteTelefono && (
          <p>
            {t("telefono")}{" "}
            <a
              href={`tel:${solicitud.remitenteTelefono.replace(/\s+/g, "")}`}
              className="font-medium text-teal-700 hover:underline"
            >
              {solicitud.remitenteTelefono}
            </a>
          </p>
        )}
      </div>

      <div className="mt-3 whitespace-pre-line rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 sm:ml-14">
        {solicitud.message}
      </div>

      {/* En el móvil, dos por fila: los cuatro seguidos no cabían y
          "Cerrada" se salía por la derecha. */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-300 bg-zinc-300 sm:ml-14 sm:inline-flex [&>*:last-child:nth-child(odd)]:col-span-2">
        {ESTADOS_SOLICITUD.map((estadoOpcion) => (
          <form key={estadoOpcion.id} action={cambiarEstadoSolicitud}>
            <input type="hidden" name="id" value={solicitud.id} />
            <input type="hidden" name="status" value={estadoOpcion.id} />
            <button
              type="submit"
              disabled={solicitud.status === estadoOpcion.id}
              className={`w-full whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors disabled:cursor-default sm:py-1.5 ${
                solicitud.status === estadoOpcion.id
                  ? ESTILO_ESTADO[estadoOpcion.id]
                  : "bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {t(`estados.${estadoOpcion.id}`)}
            </button>
          </form>
        ))}
      </div>

      {/* Acuerdo cerrado: el siguiente paso es apuntar lo prometido, que
          es lo que hace que ApoyaClub se lo recuerde al club y que en
          junio pueda enseñarle a la empresa lo que recibió. El botón
          abre Tareas con esta empresa ya elegida. */}
      {solicitud.status === "closed" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="min-w-0 flex-1 basis-56 text-sm text-teal-900">{t("cerradaTexto")}</p>
          <Link
            href={
              solicitud.remitenteEmpresa || solicitud.remitenteNombre
                ? `/panel/tareas?empresa=${encodeURIComponent(solicitud.remitenteEmpresa || solicitud.remitenteNombre || "")}#apuntar`
                : "/panel/tareas#apuntar"
            }
            className="shrink-0 rounded-lg bg-accion px-3 py-2 text-sm font-semibold text-sobre-color transition-colors hover:bg-accion-fuerte"
          >
            {t("cerradaApuntar")}
          </Link>
        </div>
      )}
    </li>
  );
}
