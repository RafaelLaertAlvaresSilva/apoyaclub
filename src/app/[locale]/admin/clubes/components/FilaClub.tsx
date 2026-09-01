import { etiquetaEstadoSuscripcion, type SubscriptionStatus } from "@/lib/subscription-mappers";
import { quitarVerificacionClub, reactivarClub, suspenderClub, verificarClub } from "../actions";
import type { ClubAdminRow } from "../types";

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

const ESTILO_SUSCRIPCION: Record<Exclude<SubscriptionStatus, null>, string> = {
  trialing: "bg-sky-100 text-sky-700",
  active: "bg-teal-100 text-teal-700",
  past_due: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-700",
  canceled: "bg-zinc-200 text-zinc-600",
  incomplete: "bg-zinc-200 text-zinc-600",
  incomplete_expired: "bg-zinc-200 text-zinc-600",
  paused: "bg-zinc-200 text-zinc-600",
};

/** Una fila del listado de clubes del admin (Fase 12), con las acciones de suspender/verificar. */
export function FilaClub({ fila }: { fila: ClubAdminRow }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{fila.name}</p>
        <p className="text-xs text-zinc-500">{fila.city}</p>
        {fila.email && <p className="text-xs text-zinc-400">{fila.email}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {formatoFecha.format(new Date(fila.createdAt))}
      </td>
      <td className="px-4 py-3 text-zinc-600">{fila.profileCompletion}%</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            fila.subscriptionStatus ? ESTILO_SUSCRIPCION[fila.subscriptionStatus] : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {etiquetaEstadoSuscripcion(fila.subscriptionStatus)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {fila.verified && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              Verificado
            </span>
          )}
          {fila.suspended && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Suspendido
            </span>
          )}
          {!fila.verified && !fila.suspended && <span className="text-xs text-zinc-400">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <form action={fila.verified ? quitarVerificacionClub : verificarClub}>
            <input type="hidden" name="id" value={fila.id} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {fila.verified ? "Quitar verificación" : "Verificar"}
            </button>
          </form>
          <form action={fila.suspended ? reactivarClub : suspenderClub}>
            <input type="hidden" name="id" value={fila.id} />
            <button
              type="submit"
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                fila.suspended
                  ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  : "border-red-200 text-red-700 hover:bg-red-50"
              }`}
            >
              {fila.suspended ? "Reactivar" : "Suspender"}
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
