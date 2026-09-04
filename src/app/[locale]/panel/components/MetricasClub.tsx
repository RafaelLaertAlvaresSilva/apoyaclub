import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  variacion,
  sinDatos,
  type EmpresaInteresada,
  type MetricaClub,
  type MetricasClub as Metricas,
} from "@/lib/club-metrics";

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
 * Debajo, las empresas concretas que han pasado por la ficha: es lo que
 * hace la métrica accionable, porque un nombre se puede llamar por
 * teléfono y una cifra no.
 */
export function MetricasClub({
  metricas,
  empresas,
}: {
  metricas: Metricas;
  empresas: EmpresaInteresada[];
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
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* El acumulado, fuera del bloque de los 30 días a propósito: se
          enseña también cuando el mes va vacío, porque un club sin
          movimiento este mes pero con doscientas visitas detrás no
          está empezando de cero y no hay por qué hacerle creer que sí. */}
      {metricas.visitasTotales > 0 && (
        <p className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {metricas.visitasTotales === 1
            ? t("visitasTotalesUna")
            : t("visitasTotales", { visitas: metricas.visitasTotales })}
        </p>
      )}

      <ListaDeEmpresas empresas={empresas} />
    </section>
  );
}

/**
 * Las empresas registradas que han pasado por la ficha, con la que vio
 * el contacto arriba del todo. Solo se enseña si hay alguna: un bloque
 * vacío en el panel de un club recién llegado solo desanima.
 */
function ListaDeEmpresas({ empresas }: { empresas: EmpresaInteresada[] }) {
  const t = useTranslations("panel.metricas");

  if (empresas.length === 0) return null;

  return (
    <div className="mt-6 border-t border-zinc-100 pt-5">
      <h3 className="text-sm font-semibold text-zinc-900">{t("empresasTitulo")}</h3>
      <p className="mt-1 text-xs text-zinc-500">{t("empresasTexto")}</p>

      <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {empresas.map((empresa) => (
          <li
            key={empresa.companyId}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-zinc-900">{empresa.nombre}</p>
              <p className="text-zinc-500">
                {[empresa.sector, empresa.ciudad].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            {empresa.vioElContacto && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                {t("empresasVioContacto")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
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
