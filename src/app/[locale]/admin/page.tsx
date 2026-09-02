import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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
      {detalle && <p className="mt-1 text-xs text-zinc-500">{detalle}</p>}
    </div>
  );
}

/** Resumen del panel de administración (Fase 12). */
export default async function AdminPage() {
  const t = await getTranslations("admin.panel");
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
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("resumen")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="resumen" />

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">{t("clubesYEmpresas")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica
            etiqueta={t("clubesEnPrueba")}
            valor={formatoNumero.format(metricas.clubes.enPrueba)}
            detalle="Primer mes gratis, en curso"
          />
          <TarjetaMetrica
            etiqueta={t("clubesDePago")}
            valor={formatoNumero.format(metricas.clubes.activos)}
            detalle="Suscripción activa"
          />
          <TarjetaMetrica etiqueta={t("clubesRegistrados")} valor={formatoNumero.format(metricas.clubes.total)} />
          <TarjetaMetrica etiqueta={t("empresasRegistradas")} valor={formatoNumero.format(metricas.empresas.total)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">{t("actividad")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TarjetaMetrica
            etiqueta={t("oportunidadesPublicadas")}
            valor={formatoNumero.format(metricas.oportunidadesPublicadas)}
          />
          <TarjetaMetrica
            etiqueta={t("solicitudesDeContactoEnviadas")}
            valor={formatoNumero.format(metricas.solicitudesContacto)}
          />
          <TarjetaMetrica
            etiqueta={t("busquedasRealizadas")}
            valor={formatoNumero.format(metricas.busquedasRealizadas)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">{t("suscripcion")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica
            etiqueta={t("conversionDePruebaA")}
            valor={metricas.conversion.porcentaje != null ? `${metricas.conversion.porcentaje}%` : "—"}
            detalle={`${formatoNumero.format(metricas.conversion.convirtieron)} de ${formatoNumero.format(metricas.conversion.empezaronPrueba)} que empezaron`}
          />
          <TarjetaMetrica etiqueta={t("pagoPendiente")} valor={formatoNumero.format(metricas.clubes.pagoPendiente)} />
          <TarjetaMetrica etiqueta={t("cancelados")} valor={formatoNumero.format(metricas.clubes.cancelados)} />
          <TarjetaMetrica
            etiqueta={t("nuncaHanEmpezado")}
            valor={formatoNumero.format(metricas.clubes.sinEmpezar)}
            detalle="No han iniciado la suscripción"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">{t("moderacion")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TarjetaMetrica etiqueta={t("clubesSuspendidos")} valor={formatoNumero.format(metricas.clubes.suspendidos)} />
          <TarjetaMetrica etiqueta={t("clubesVerificados")} valor={formatoNumero.format(metricas.clubes.verificados)} />
        </div>
      </section>
    </div>
  );
}
