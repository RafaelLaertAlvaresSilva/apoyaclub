import { useTranslations } from "next-intl";
import { diasHasta, esAccesoRegalado, unAnioDesde } from "@/lib/acceso-gratuito";
import { etiquetaEstadoSuscripcion, type SubscriptionStatus } from "@/lib/subscription-mappers";
import {
  darAccesoGratuito,
  quitarVerificacionClub,
  reactivarClub,
  suspenderClub,
  verificarClub,
} from "../actions";
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
  const t = useTranslations("admin.clubes");

  // Un club "invitado" no es un estado nuevo en la base de datos: es una
  // prueba gratuita que dura mucho más que el mes normal. Ver
  // `lib/acceso-gratuito.ts`.
  const invitado = esAccesoRegalado(fila.subscriptionStatus, fila.trialEndsAt);
  const diasQueQuedan = diasHasta(fila.trialEndsAt);

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{fila.name}</p>
        <p className="text-xs text-zinc-500">{fila.city}</p>
        {fila.email && <p className="text-xs text-zinc-500">{fila.email}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {formatoFecha.format(new Date(fila.createdAt))}
      </td>
      <td className="px-4 py-3 text-zinc-600">{fila.profileCompletion}%</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">
        <p className="tabular-nums">
          {fila.visitas} {fila.visitas === 1 ? "visita" : "visitas"}
        </p>
        <p className="tabular-nums text-zinc-500">
          {fila.empresas} {fila.empresas === 1 ? "empresa" : "empresas"}
        </p>
        <p
          className={`tabular-nums ${fila.contactos > 0 ? "font-medium text-teal-700" : "text-zinc-400"}`}
        >
          {fila.contactos} {fila.contactos === 1 ? "contacto visto" : "contactos vistos"}
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            invitado
              ? "bg-violet-100 text-violet-700"
              : fila.subscriptionStatus
                ? ESTILO_SUSCRIPCION[fila.subscriptionStatus]
                : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {invitado ? "Invitado" : etiquetaEstadoSuscripcion(fila.subscriptionStatus)}
        </span>

        {fila.trialEndsAt && (fila.subscriptionStatus === "trialing" || invitado) && (
          <p className="mt-1 text-xs text-zinc-500">
            Hasta el {formatoFecha.format(new Date(fila.trialEndsAt))}
            {diasQueQuedan > 0 && ` · ${diasQueQuedan} ${diasQueQuedan === 1 ? "día" : "días"}`}
          </p>
        )}

        {fila.tieneSuscripcionEnStripe ? (
          <p className="mt-2 text-xs text-zinc-500">Paga por Stripe</p>
        ) : (
          /* El acceso de los clubes invitados. Es la prueba gratuita con
             la fecha movida, así que se termina poniendo la de hoy: esa
             noche el cron la cierra sola.

             Los tres botones de arriba son el caso normal —se pulsa uno
             y ya está—; el calendario de abajo queda para la fecha rara.
             Cada botón manda su propio plazo porque el navegador envía
             el nombre y el valor del botón que se pulsa, así que no hace
             falta JavaScript para nada de esto. */
          <form action={darAccesoGratuito} className="mt-2">
            <input type="hidden" name="id" value={fila.id} />

            <div className="flex flex-wrap gap-1">
              <BotonDePlazo plazo="6-meses">6 meses</BotonDePlazo>
              <BotonDePlazo plazo="1-anio">1 año</BotonDePlazo>
              <BotonDePlazo plazo="temporada">Hasta junio</BotonDePlazo>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <label htmlFor={`hasta-${fila.id}`} className="sr-only">
                Acceso gratuito hasta una fecha concreta
              </label>
              <input
                id={`hasta-${fila.id}`}
                type="date"
                name="hasta"
                defaultValue={fila.trialEndsAt ? fila.trialEndsAt.slice(0, 10) : unAnioDesde()}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
              />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                Esa fecha
              </button>
            </div>
          </form>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {fila.verified && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">{t("verificado")}</span>
          )}
          {fila.suspended && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t("suspendido")}</span>
          )}
          {!fila.verified && !fila.suspended && <span className="text-xs text-zinc-500">—</span>}
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

/** Uno de los botones rápidos del acceso invitado. */
function BotonDePlazo({ plazo, children }: { plazo: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      name="plazo"
      value={plazo}
      className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-50"
    >
      {children}
    </button>
  );
}
