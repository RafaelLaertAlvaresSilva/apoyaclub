import { ESTADOS_SOLICITUD } from "@/lib/contact-requests";
import { ETIQUETA_OBJETIVO, formatoValorOportunidad } from "@/lib/opportunities";
import type { CompanyProfile, ContactRequest, ContactRequestStatus } from "@/lib/types";
import { cambiarEstadoSolicitud } from "../actions";

const ESTILO_ESTADO: Record<ContactRequestStatus, string> = {
  new: "bg-teal-600 text-white",
  seen: "bg-sky-500 text-white",
  in_conversation: "bg-amber-500 text-white",
  closed: "bg-zinc-400 text-white",
  discarded: "bg-zinc-300 text-zinc-600",
};

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

export function SolicitudCard({
  solicitud,
  opportunityTitle,
  empresa,
  empresaEmail,
}: {
  solicitud: ContactRequest;
  opportunityTitle: string | null;
  empresa: CompanyProfile | null;
  empresaEmail: string | null;
}) {
  const nombreEmpresa = empresa?.name || "Empresa sin nombre en su perfil";

  const presupuesto =
    empresa?.budgetMin != null || empresa?.budgetMax != null
      ? [empresa?.budgetMin, empresa?.budgetMax]
          .filter((valor): valor is number => valor != null)
          .map((valor) => formatoValorOportunidad.format(valor))
          .join(" - ")
      : null;

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{nombreEmpresa}</h3>
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
        {empresaEmail && (
          <p>
            Email:{" "}
            <a href={`mailto:${empresaEmail}`} className="font-medium text-teal-700 hover:underline">
              {empresaEmail}
            </a>
          </p>
        )}
        {empresa?.sector && <p>Sector: {empresa.sector}</p>}
        {empresa?.city && <p>Localidad: {empresa.city}</p>}
        {empresa?.website && (
          <p>
            Web:{" "}
            <a
              href={empresa.website}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-teal-700 hover:underline"
            >
              {empresa.website.replace(/^https?:\/\//, "")}
            </a>
          </p>
        )}
        {presupuesto && <p>Presupuesto orientativo: {presupuesto}</p>}
        {empresa && empresa.objectives.length > 0 && (
          <p className="sm:col-span-2">
            Objetivos: {empresa.objectives.map((objetivo) => ETIQUETA_OBJETIVO[objetivo]).join(", ")}
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
