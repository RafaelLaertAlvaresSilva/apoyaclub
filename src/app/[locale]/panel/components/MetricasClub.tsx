import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  variacion,
  sinDatos,
  type MetricaClub,
  type MetricasClub as Metricas,
  type ResumenDeVisitas,
} from "@/lib/club-metrics";
import { DetalleDeVisitas } from "./DetalleDeVisitas";

/**
 * "Tu mes en ApoyaClub" (migraciones 0014 y 0022): lo que el club recibe
 * a cambio de su cuota, en cinco cifras.
 *
 * Está en lo alto del panel a propósito. El riesgo del negocio no es que
 * un club no se registre, es que pague tres meses sin ver nada y se dé
 * de baja; estas cuatro cifras son la respuesta a "¿y esto para qué me
 * sirve?" el día que le llega el recibo.
 *
 * Cada cifra se compara con el mismo periodo anterior. Cuando no hay con
 * qué comparar no se enseña ningún porcentaje: un "+100 %" sacado de un
 * mes a cero es ruido, no información.
 *
 * Ya no salen nombres de empresa: desde que ApoyaClub no pide cuenta
 * para mirar ni para escribir (migración 0034), quien entra en la ficha
 * es anónimo. Lo que sí lleva nombre y apellidos es lo que llega a
 * "Solicitudes", que es donde de verdad se puede actuar.
 */
export function MetricasClub({
  metricas,
  resumen,
}: {
  metricas: Metricas;
  resumen: ResumenDeVisitas;
}) {
  const t = useTranslations("panel.metricas");

  const tarjetas: { clave: string; etiqueta: string; ayuda: string; dato: MetricaClub }[] = [
    {
      clave: "apariciones",
      etiqueta: t("apariciones"),
      ayuda: t("aparicionesAyuda"),
      dato: metricas.apariciones,
    },
    { clave: "visitas", etiqueta: t("visitas"), ayuda: t("visitasAyuda"), dato: metricas.visitas },
    {
      clave: "dossieres",
      etiqueta: t("dossieres"),
      ayuda: t("dossieresAyuda"),
      dato: metricas.dossieres,
    },
    {
      clave: "contactos",
      etiqueta: t("contactos"),
      ayuda: t("contactosAyuda"),
      dato: metricas.contactos,
    },
    {
      clave: "solicitudes",
      etiqueta: t("solicitudes"),
      ayuda: t("solicitudesAyuda"),
      dato: metricas.solicitudes,
    },
  ];

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-900">{t("titulo")}</h2>
        <p className="text-xs text-zinc-500">{t("periodo", { dias: metricas.dias })}</p>
      </div>

      {sinDatos(metricas) ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
          <p className="font-medium text-zinc-900">{t("vacioTitulo")}</p>
          <p className="mt-1">{t("vacioTexto")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/panel/oportunidades" className="font-medium text-teal-700 hover:underline">
              {t("vacioOportunidades")}
            </Link>
            <Link href="/panel/dossier" className="font-medium text-teal-700 hover:underline">
              {t("vacioDossier")}
            </Link>
          </div>
        </div>
      ) : (
        // Dos columnas y no tres: desde que el progreso de la ficha va
        // al lado, esta tarjeta ocupa dos tercios del ancho y con tres
        // columnas los números salían apretados contra su etiqueta.
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {tarjetas.map((tarjeta) => (
            <Tarjeta
              key={tarjeta.clave}
              etiqueta={tarjeta.etiqueta}
              ayuda={tarjeta.ayuda}
              dato={tarjeta.dato}
              textoComparacion={(porcentaje) =>
                porcentaje >= 0
                  ? t("subida", { porcentaje })
                  : t("bajada", { porcentaje: Math.abs(porcentaje) })
              }
            />
          ))}
        </dl>
      )}

      {/* El detalle por semana y por mes, fuera del bloque de arriba a
          propósito: se enseña también cuando el mes va vacío, porque un
          club sin movimiento este mes pero con doscientas visitas
          detrás no está empezando de cero. */}
      <DetalleDeVisitas resumen={resumen} />
    </section>
  );
}

function Tarjeta({
  etiqueta,
  ayuda,
  dato,
  textoComparacion,
}: {
  etiqueta: string;
  ayuda: string;
  dato: MetricaClub;
  textoComparacion: (porcentaje: number) => string;
}) {
  const porcentaje = variacion(dato);

  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{etiqueta}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-brand-navy">{dato.actual}</span>
        {porcentaje !== null && porcentaje !== 0 && (
          <span
            className={`text-xs font-semibold ${porcentaje > 0 ? "text-teal-700" : "text-amber-700"}`}
          >
            {textoComparacion(porcentaje)}
          </span>
        )}
      </dd>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{ayuda}</p>
    </div>
  );
}
