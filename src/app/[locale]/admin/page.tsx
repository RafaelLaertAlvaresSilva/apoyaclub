import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerMetricasAdmin } from "@/lib/admin-metrics";
import { BANDERA_DEL_PAIS, NOMBRE_DEL_PAIS, PAISES, esPaisValido } from "@/lib/paises";
import { soloAdministrador } from "@/lib/acceso-admin-servidor";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./components/AdminNav";

const formatoNumero = new Intl.NumberFormat("es-ES");

/**
 * Una cifra del resumen.
 *
 * `pideAtencion` es lo que separa mirar de tener que hacer algo: trece
 * tarjetas iguales obligaban a leerlas todas cada día para descubrir
 * que "Pago pendiente" no era cero. Se pinta en ámbar solo cuando su
 * número no es cero, y entonces lleva a donde se arregla; el resto del
 * tiempo se ve como las demás y no grita por costumbre, que es como una
 * alerta deja de significar nada.
 */
function TarjetaMetrica({
  etiqueta,
  valor,
  detalle,
  pideAtencion = false,
  href,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  pideAtencion?: boolean;
  href?: string;
}) {
  const encendida = pideAtencion && valor !== "0";
  const clases = `block rounded-xl border p-5 ${
    encendida
      ? "border-amber-300 bg-amber-50"
      : "border-zinc-200 bg-white"
  } ${href ? "transition-colors hover:border-accion-tinta" : ""}`;

  const contenido = (
    <>
      <p className={`text-sm ${encendida ? "text-amber-900" : "text-zinc-500"}`}>{etiqueta}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${encendida ? "text-amber-900" : "text-zinc-900"}`}
      >
        {valor}
      </p>
      {detalle && (
        <p className={`mt-1 text-xs ${encendida ? "text-amber-800" : "text-zinc-500"}`}>{detalle}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clases}>
        {contenido}
      </Link>
    );
  }

  return <div className={clases}>{contenido}</div>;
}

/** Resumen del panel de administración (Fase 12). */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ pais?: string }> }) {
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

  // Solo del administrador: un representante va a su lista de clubes.
  await soloAdministrador();

  // Filtro por país: los mismos números, solo de los clubes de ese país.
  const { pais: paisPedido } = await searchParams;
  const pais = esPaisValido(paisPedido) ? paisPedido : null;
  const metricas = await obtenerMetricasAdmin(pais);
  // Las tarjetas que llevan a la lista de clubes, ya con el mismo filtro.
  const listaDeClubes = pais ? `/admin/clubes?pais=${pais}` : "/admin/clubes";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("resumen")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="resumen" />

      <nav aria-label="Filtrar por país" className="flex flex-wrap gap-2">
        {[null, ...PAISES].map((opcion) => (
          <Link
            key={opcion ?? "todos"}
            href={opcion ? `/admin?pais=${opcion}` : "/admin"}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              opcion === pais
                ? "border-accion-tinta bg-white font-medium text-accion-tinta"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-accion-tinta"
            }`}
          >
            {opcion ? `${BANDERA_DEL_PAIS[opcion]} ${NOMBRE_DEL_PAIS[opcion]}` : "Todos los países"}
          </Link>
        ))}
      </nav>
      {pais && (
        <p className="-mt-3 text-xs text-zinc-500">
          Empresas y búsquedas no tienen país: esas dos cifras son siempre de toda la plataforma.
        </p>
      )}

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
          <TarjetaMetrica
            etiqueta={t("pagoPendiente")}
            valor={formatoNumero.format(metricas.clubes.pagoPendiente)}
            pideAtencion
            href={listaDeClubes}
          />
          <TarjetaMetrica
            etiqueta={t("cancelados")}
            valor={formatoNumero.format(metricas.clubes.cancelados)}
            pideAtencion
            href={listaDeClubes}
          />
          <TarjetaMetrica
            etiqueta={t("nuncaHanEmpezado")}
            valor={formatoNumero.format(metricas.clubes.sinEmpezar)}
            detalle="No han iniciado la suscripción"
            pideAtencion
            href={listaDeClubes}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">{t("moderacion")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TarjetaMetrica
            etiqueta={t("clubesSuspendidos")}
            valor={formatoNumero.format(metricas.clubes.suspendidos)}
            pideAtencion
            href={listaDeClubes}
          />
          <TarjetaMetrica etiqueta={t("clubesVerificados")} valor={formatoNumero.format(metricas.clubes.verificados)} />
        </div>
      </section>
    </div>
  );
}
