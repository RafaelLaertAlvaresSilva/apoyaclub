"use client";

import { useTranslations } from "next-intl";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import { fechaMedia, type Partido } from "@/lib/publico-partidos";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import { borrarPartido } from "../actions";

export function PartidoFila({ partido }: { partido: Partido }) {
  const t = useTranslations("panel.publico");
  const intlLocale = useIntlLocale();
  const formatoNumero = new Intl.NumberFormat(intlLocale);

  return (
    <li className="flex flex-wrap items-center gap-3 tonal tonal-auto rounded-lg border border-(--tono-borde) border-l-4 border-l-(--tono-fuerte) bg-white shadow-sm p-3">
      {/* En el móvil la fecha y el partido van en dos líneas, y las
          personas y "Borrar" debajo: todo en una fila dejaba el nombre
          del rival en columnas de una palabra. */}
      <span className="w-24 flex-none text-sm tabular-nums text-zinc-500">
        {fechaMedia(partido.fecha, intlLocale)}
      </span>

      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-medium text-zinc-900">
          {t(partido.enCasa ? "contra" : "enCampoDe", { rival: partido.rival })}
        </p>
        <p className="text-xs text-zinc-500">
          {[
            partido.enCasa ? t("enCasa") : t("fuera"),
            partido.equipo,
            partido.competicion,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span className="ml-auto flex-none text-right">
        <span className="block text-base font-semibold tabular-nums text-zinc-900">
          {formatoNumero.format(partido.publico)}
        </span>
        <span className="block text-xs text-zinc-500">{t("personas")}</span>
      </span>

      {/* Pregunta antes de borrar, como el resto del panel: era el único
          sitio donde un toque sin querer borraba el partido sin avisar. */}
      <div className="flex-none">
        <AccionConConfirmacion
          accion={(formData) => borrarPartido(null, formData)}
          id={partido.id}
          nombre={t(partido.enCasa ? "contra" : "enCampoDe", { rival: partido.rival })}
          etiqueta={t("borrar")}
          clases="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
        />
      </div>
    </li>
  );
}
