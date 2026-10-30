import { useLocale, useTranslations } from "next-intl";
import { intlLocaleDe } from "@/config/locales";
import { diasHasta, esAccesoRegalado, unAnioDesde } from "@/lib/acceso-gratuito";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";
import { BANDERA_DEL_PAIS, PAISES } from "@/lib/paises";
import {
  activarModoPruebas,
  cambiarPaisClub,
  darAccesoGratuito,
  quitarModoPruebas,
  quitarVerificacionClub,
  reactivarClub,
  suspenderClub,
  verificarClub,
} from "../actions";
import type { ClubAdminRow } from "../types";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";


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
export function FilaClub({ fila, esAdministrador }: { fila: ClubAdminRow; esAdministrador: boolean }) {
  const t = useTranslations("admin.clubes");
  // El administrador en español; el representante, en el idioma con el
  // que entra (/br/admin para el de Brasil).
  const tf = useTranslations("admin.clubes.fila");
  const tPais = useTranslations("admin.paises");
  const tEstado = useTranslations("panel.suscripcion.estados");
  const formatoFecha = new Intl.DateTimeFormat(intlLocaleDe(useLocale()), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
        <p className="mt-1 text-xs text-zinc-600">
          <span aria-hidden="true">{BANDERA_DEL_PAIS[fila.pais]}</span> {tPais(fila.pais)}
        </p>
        {/* Cambiar el país es solo del administrador: mueve el club a la
            lista (y a la comisión) de otro representante. */}
        {esAdministrador && (
          <form action={cambiarPaisClub} className="mt-1 flex items-center gap-1">
            <input type="hidden" name="id" value={fila.id} />
            <label htmlFor={`pais-${fila.id}`} className="sr-only">
              {tf("paisDelClub")}
            </label>
            <select
              id={`pais-${fila.id}`}
              name="pais"
              defaultValue={fila.pais}
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs"
            >
              {PAISES.map((pais) => (
                <option key={pais} value={pais}>
                  {tPais(pais)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700 hover:border-accion-tinta"
            >
              {tf("cambiar")}
            </button>
          </form>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {formatoFecha.format(new Date(fila.createdAt))}
      </td>
      <td className="px-4 py-3 text-zinc-600">{fila.profileCompletion}%</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">
        <p className="tabular-nums">
          {tf("visitas", { n: fila.visitas })}
        </p>
        <p className="tabular-nums text-zinc-500">
          {tf("empresas", { n: fila.empresas })}
        </p>
        <p
          className={`tabular-nums ${fila.contactos > 0 ? "font-medium text-teal-700" : "text-zinc-400"}`}
        >
          {tf("contactosVistos", { n: fila.contactos })}
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
          {invitado ? tf("invitado") : tEstado(fila.subscriptionStatus ?? "ninguno")}
        </span>

        {fila.trialEndsAt && (fila.subscriptionStatus === "trialing" || invitado) && (
          <p className="mt-1 text-xs text-zinc-500">
            {tf("hasta", { fecha: formatoFecha.format(new Date(fila.trialEndsAt)) })}
            {diasQueQuedan > 0 && ` · ${tf("dias", { n: diasQueQuedan })}`}
          </p>
        )}

        {fila.tieneSuscripcionEnStripe ? (
          <p className="mt-2 text-xs text-zinc-500">{tf("pagaStripe")}</p>
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
              <BotonDePlazo plazo="6-meses">{tf("seisMeses")}</BotonDePlazo>
              <BotonDePlazo plazo="1-anio">{tf("unAnio")}</BotonDePlazo>
              <BotonDePlazo plazo="temporada">{tf("hastaJunio")}</BotonDePlazo>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <label htmlFor={`hasta-${fila.id}`} className="sr-only">
                {tf("accesoHastaFecha")}
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
                {tf("esaFecha")}
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
          {fila.modoPruebas && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {tf("modoPruebas")}
            </span>
          )}
          {fila.piloto && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">{tf("seisMesesGratis")}</span>
          )}
          {fila.traidoPor ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              {tf("traidoPor", { quien: fila.traidoPor })}
            </span>
          ) : (
            fila.origenCampana && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                {tf("anuncio", { codigo: fila.origenCampana })}
              </span>
            )
          )}
          {!fila.verified && !fila.suspended && !fila.modoPruebas && !fila.piloto && !fila.origenCampana && (
            <span className="text-xs text-zinc-500">—</span>
          )}
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
              {fila.verified ? tf("quitarVerificacion") : tf("verificar")}
            </button>
          </form>
          {/* Modo de pruebas: esconde el club de todo lo público sin
              cortarle el panel. Va directo, sin confirmación, porque se
              deshace con el mismo botón y no deja a nadie fuera. */}
          <form action={fila.modoPruebas ? quitarModoPruebas : activarModoPruebas}>
            <input type="hidden" name="id" value={fila.id} />
            <button
              type="submit"
              title={
                fila.modoPruebas
                  ? tf("tituloQuitarPruebas")
                  : tf("tituloPruebas")
              }
              className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
            >
              {fila.modoPruebas ? tf("quitarModoPruebas") : tf("modoPruebas")}
            </button>
          </form>
          {/* Suspender le tumba al club la página pública y le corta el
              acceso al panel, y se hacía de un clic: un roce en el móvil
              y un club se quedaba fuera sin que se enterase nadie.
              Reactivar no hace daño, así que ese va directo. */}
          {fila.suspended ? (
            <form action={reactivarClub}>
              <input type="hidden" name="id" value={fila.id} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {tf("reactivar")}
              </button>
            </form>
          ) : (
            <AccionConConfirmacion
              accion={suspenderClub}
              id={fila.id}
              nombre={fila.name}
              etiqueta={tf("suspender")}
              pregunta={tf("preguntaSuspender")}
              confirmar={tf("confirmarSuspender")}
              enCurso={tf("suspendiendo")}
              clases="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            />
          )}
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
