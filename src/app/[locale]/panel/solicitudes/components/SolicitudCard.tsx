import { ESTADOS_SOLICITUD } from "@/lib/contact-requests";
import type { ContactRequest, ContactRequestStatus } from "@/lib/types";
import { cambiarEstadoSolicitud } from "../actions";

const ESTILO_ESTADO: Record<ContactRequestStatus, string> = {
  new: "bg-teal-700 text-white",
  seen: "bg-sky-500 text-white",
  in_conversation: "bg-amber-500 text-white",
  closed: "bg-zinc-400 text-white",
  discarded: "bg-zinc-300 text-zinc-600",
};

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

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
  const titular =
    solicitud.remitenteEmpresa ||
    solicitud.remitenteNombre ||
    "Solicitud anterior (sin datos de contacto)";

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{titular}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_ESTADO[solicitud.status]}`}
            >
              {ESTADOS_SOLICITUD.find((estado) => estado.id === solicitud.status)?.etiqueta}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {opportunityTitle ? `Sobre: ${opportunityTitle}` : "Sobre el club en general"}
            {" · "}
            {formatoFecha.format(new Date(solicitud.createdAt))}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-sm text-zinc-600 sm:grid-cols-2">
        {solicitud.remitenteNombre && solicitud.remitenteEmpresa && (
          <p>Persona: {solicitud.remitenteNombre}</p>
        )}
        {solicitud.remitenteEmail && (
          <p>
            Correo:{" "}
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
            Teléfono:{" "}
            <a
              href={`tel:${solicitud.remitenteTelefono.replace(/\s+/g, "")}`}
              className="font-medium text-teal-700 hover:underline"
            >
              {solicitud.remitenteTelefono}
            </a>
          </p>
        )}
      </div>

      <div className="mt-3 whitespace-pre-line rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
        {solicitud.message}
      </div>

      <div className="mt-4 flex w-fit overflow-hidden rounded-lg border border-zinc-300">
        {ESTADOS_SOLICITUD.map((estadoOpcion) => (
          <form key={estadoOpcion.id} action={cambiarEstadoSolicitud}>
            <input type="hidden" name="id" value={solicitud.id} />
            <input type="hidden" name="status" value={estadoOpcion.id} />
            <button
              type="submit"
              disabled={solicitud.status === estadoOpcion.id}
              className={`px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default ${
                solicitud.status === estadoOpcion.id
                  ? ESTILO_ESTADO[estadoOpcion.id]
                  : "bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {estadoOpcion.etiqueta}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
