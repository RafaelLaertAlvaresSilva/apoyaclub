"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ResumenDeVisitas } from "@/lib/club-metrics";
import { CAJA_METRICA, CUERPO_METRICA, TITULO_METRICA } from "./estilos-metricas";

/**
 * Quién ha entrado en la ficha, por semana o por mes.
 *
 * Las tarjetas de arriba comparan un periodo con el anterior, que es lo
 * que sirve para ver si algo va a mejor. Esto es otra pregunta: cuánta
 * gente ha pasado, cuántas de esas eran empresas y cuántas llegaron a
 * abrir el contacto. Es el embudo, y leído de izquierda a derecha
 * cuenta una historia — cuánta gente mira, cuánta se interesa de verdad.
 */
export function DetalleDeVisitas({ resumen }: { resumen: ResumenDeVisitas }) {
  const t = useTranslations("panel.metricas");
  const [ventana, setVentana] = useState<"semana" | "mes">("semana");
  const datos = ventana === "semana" ? resumen.semana : resumen.mes;

  const sinNada = resumen.totalVisitas === 0 && resumen.totalContactos === 0;
  if (sinNada) return null;

  return (
    <div className="mt-5 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-titular">{t("quienEntradoFicha")}</h3>

        <div className="flex rounded-lg border border-zinc-300 p-0.5">
          {(["semana", "mes"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setVentana(opcion)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                ventana === opcion ? "bg-accion text-sobre-color hover:bg-accion-fuerte" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {opcion === "semana" ? t("ultimos7Dias") : t("ultimos30Dias")}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Dato
          valor={datos.visitas}
          etiqueta={t("hanVistoFicha")}
          ayuda={t("personasHanAbiertoPagina")}
        />
        <Dato
          valor={datos.contactos}
          etiqueta={t("hanAbiertoContacto")}
          ayuda={t("hanPulsadoParaVer")}
        />
      </dl>

      <p className="mt-3 text-xs text-zinc-500">
        {t("desdeQueEstas", { visitas: resumen.totalVisitas, contactos: resumen.totalContactos })}
      </p>
    </div>
  );
}

function Dato({ valor, etiqueta, ayuda }: { valor: number; etiqueta: string; ayuda: string }) {
  return (
    <div className={CAJA_METRICA}>
      <dt className={TITULO_METRICA}>{etiqueta}</dt>
      <dd className={`${CUERPO_METRICA} pb-0 text-2xl font-bold tabular-nums text-titular`}>{valor}</dd>
      <p className="px-3 pb-3 pt-1 text-xs leading-snug text-zinc-500">{ayuda}</p>
    </div>
  );
}
