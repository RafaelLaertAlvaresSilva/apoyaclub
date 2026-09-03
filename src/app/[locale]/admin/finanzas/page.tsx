import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerFinanzas, type ClubFacturable } from "@/lib/admin-finanzas";
import { etiquetaEstadoSuscripcion } from "@/lib/subscription-mappers";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../components/AdminNav";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const formatoEurosExacto = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function euros(centimos: number): string {
  return formatoEuros.format(centimos / 100);
}

function eurosExactos(centimos: number): string {
  return formatoEurosExacto.format(centimos / 100);
}

/**
 * Control financiero (migración 0021).
 *
 * Responde a "¿de qué vivo?" con cuatro cifras arriba y el detalle
 * debajo. La distinción entre el importe con IVA y sin IVA está en todas
 * partes a propósito: el precio que ve el club lleva el IVA dentro, pero
 * ese IVA no es dinero del negocio, hay que liquidarlo.
 */
export default async function FinanzasPage() {
  const t = await getTranslations("admin.panel");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; segunda capa por si se renderiza en
  // otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const finanzas = await obtenerFinanzas();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Finanzas</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="finanzas" />

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Ingresos recurrentes</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta
            etiqueta="Al mes"
            valor={euros(finanzas.mrrCentimos)}
            detalle={`${euros(finanzas.mrrNetoCentimos)} sin IVA`}
            destacada
          />
          <Tarjeta
            etiqueta="Al año"
            valor={euros(finanzas.arrCentimos)}
            detalle={`${euros(finanzas.arrNetoCentimos)} sin IVA`}
          />
          <Tarjeta
            etiqueta="Si convierten las pruebas"
            valor={`+${euros(finanzas.mrrPotencialCentimos)}`}
            detalle={`${finanzas.clubesEnPrueba} clubes en el mes gratis`}
          />
          <Tarjeta
            etiqueta="En riesgo"
            valor={euros(finanzas.mrrEnRiesgoCentimos)}
            detalle={`${finanzas.clubesEnRiesgo} con el cobro fallando`}
            alerta={finanzas.mrrEnRiesgoCentimos > 0}
          />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          El importe recurrente al mes reparte los planes anuales entre doce, para poder comparar
          clubes con planes distintos. Lo que entra en caja de verdad este mes está en &quot;cobros
          previstos&quot;.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Reparto por plan</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Clubes</th>
                <th className="px-4 py-3 font-medium">Al mes</th>
                <th className="px-4 py-3 font-medium">Al año</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {finanzas.reparto.map((fila) => (
                <tr key={fila.planId}>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {fila.nombre}
                    {fila.planId === "fundador" && (
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {finanzas.plazasFundadorLibres} plazas libres
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{fila.clubes}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {eurosExactos(fila.centimosAlMes)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {eurosExactos(fila.centimosAlAnio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {finanzas.clubesSinPlan > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            {finanzas.clubesSinPlan}{" "}
            {finanzas.clubesSinPlan === 1
              ? "club de pago no tiene plan registrado"
              : "clubes de pago no tienen plan registrado"}
            . Suelen ser altas anteriores a los tres planes: su importe no está contado arriba.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Caja</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta
            etiqueta="Cobros previstos (30 días)"
            valor={euros(finanzas.cobrosProximos30diasCentimos)}
            detalle="Importe completo de los que renuevan"
          />
          <Tarjeta etiqueta="Clubes pagando" valor={String(finanzas.clubesQuePagan)} />
          <Tarjeta etiqueta="En el mes gratis" valor={String(finanzas.clubesEnPrueba)} />
          <Tarjeta etiqueta="Cancelados" valor={String(finanzas.clubesCancelados)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Club a club</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Importe</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Próximo cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {finanzas.clubes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    Todavía no hay ningún club suscrito.
                  </td>
                </tr>
              ) : (
                finanzas.clubes.map((club) => <FilaFinanciera key={club.id} club={club} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilaFinanciera({ club }: { club: ClubFacturable }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{club.nombre}</p>
        {club.esFundador && (
          <p className="text-xs text-amber-700">Fundador nº {club.numeroFundador}</p>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-600">
        {club.planId ? club.planId : <span className="text-zinc-400">sin plan</span>}
      </td>
      <td className="px-4 py-3 tabular-nums text-zinc-700">
        {club.centimosPorCobro != null ? eurosExactos(club.centimosPorCobro) : "—"}
      </td>
      <td className="px-4 py-3 text-zinc-600">{etiquetaEstadoSuscripcion(club.estado)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {club.proximaRenovacion ? formatoFecha.format(new Date(club.proximaRenovacion)) : "—"}
      </td>
    </tr>
  );
}

function Tarjeta({
  etiqueta,
  valor,
  detalle,
  destacada = false,
  alerta = false,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  destacada?: boolean;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 ${
        alerta ? "border-amber-300" : destacada ? "border-teal-600" : "border-zinc-200"
      }`}
    >
      <p className="text-sm text-zinc-500">{etiqueta}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          alerta ? "text-amber-700" : "text-zinc-900"
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-zinc-500">{detalle}</p>}
    </div>
  );
}
