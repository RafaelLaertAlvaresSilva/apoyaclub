import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerMetricasAdmin } from "@/lib/admin-metrics";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./components/AdminNav";

const formatoNumero = new Intl.NumberFormat("es-ES");

function TarjetaMetrica({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-zinc-400">{detalle}</p>}
    </div>
  );
}

/** Resumen del panel de administración (Fase 12). */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const metricas = await obtenerMetricasAdmin();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel de administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Resumen</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="resumen" />

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Clubes y empresas</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica
            etiqueta="Clubes en prueba"
            valor={formatoNumero.format(metricas.clubes.enPrueba)}
            detalle="Primer mes gratis, en curso"
          />
          <TarjetaMetrica
            etiqueta="Clubes de pago"
            valor={formatoNumero.format(metricas.clubes.activos)}
            detalle="Suscripción activa"
          />
          <TarjetaMetrica etiqueta="Clubes registrados" valor={formatoNumero.format(metricas.clubes.total)} />
          <TarjetaMetrica etiqueta="Empresas registradas" valor={formatoNumero.format(metricas.empresas.total)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Actividad</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TarjetaMetrica
            etiqueta="Oportunidades publicadas"
            valor={formatoNumero.format(metricas.oportunidadesPublicadas)}
          />
          <TarjetaMetrica
            etiqueta="Solicitudes de contacto enviadas"
            valor={formatoNumero.format(metricas.solicitudesContacto)}
          />
          <TarjetaMetrica
            etiqueta="Búsquedas realizadas"
            valor={formatoNumero.format(metricas.busquedasRealizadas)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Suscripción</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica
            etiqueta="Conversión de prueba a pago"
            valor={metricas.conversion.porcentaje != null ? `${metricas.conversion.porcentaje}%` : "—"}
            detalle={`${formatoNumero.format(metricas.conversion.convirtieron)} de ${formatoNumero.format(metricas.conversion.empezaronPrueba)} que empezaron`}
          />
          <TarjetaMetrica etiqueta="Pago pendiente" valor={formatoNumero.format(metricas.clubes.pagoPendiente)} />
          <TarjetaMetrica etiqueta="Cancelados" valor={formatoNumero.format(metricas.clubes.cancelados)} />
          <TarjetaMetrica
            etiqueta="Nunca han empezado"
            valor={formatoNumero.format(metricas.clubes.sinEmpezar)}
            detalle="No han iniciado la suscripción"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Moderación</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TarjetaMetrica etiqueta="Clubes suspendidos" valor={formatoNumero.format(metricas.clubes.suspendidos)} />
          <TarjetaMetrica etiqueta="Clubes verificados" valor={formatoNumero.format(metricas.clubes.verificados)} />
        </div>
      </section>
    </div>
  );
}
