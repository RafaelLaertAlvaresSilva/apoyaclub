import { useTranslations } from "next-intl";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import {
  colaboracionesTerminadas,
  aFecha,
  empresasPendientesDeInforme,
  ventanaDeInforme,
  type EmpresaParaInformar,
} from "@/lib/recordatorio-informe";
import type { TareaPatrocinio } from "@/lib/tareas-patrocinio";
import { BotonInforme } from "./BotonInforme";

/**
 * El aviso de que toca mandar informes.
 *
 * No es un correo: es un recuadro en el panel. El envío al patrocinador
 * lo hace el club desde su propio correo o por WhatsApp, porque la
 * empresa tiene relación con el club y no con ApoyaClub. Lo que sí es
 * asunto de la plataforma es recordárselo, y hacerlo concreto: un
 * "acuérdate de mandar informes" genérico se ignora a la segunda
 * semana; "a Ferretería Ramírez todavía no le has descargado ninguno"
 * no.
 *
 * Dos avisos distintos, y el de arriba manda sobre el de abajo:
 *
 *   - Colaboración terminada. Sale cualquier día del año, en cuanto el
 *     club cierra lo último que le debía a esa empresa. Es el que sirve
 *     para el torneo de un fin de semana o la campaña de un mes, que no
 *     pueden esperar a diciembre.
 *   - Ventana de temporada. Para el patrocinio largo.
 */
export function RecordatorioInforme({
  tareas,
  ultimosInformes,
  hoy,
}: {
  tareas: TareaPatrocinio[];
  ultimosInformes: Map<string, string>;
  hoy: string;
}) {
  const t = useTranslations("panel.tareas.informe");
  const terminadas = colaboracionesTerminadas(tareas, ultimosInformes);
  const ventana = ventanaDeInforme(hoy);
  const deTemporada = ventana
    ? empresasPendientesDeInforme(tareas, ultimosInformes, ventana, terminadas)
    : [];

  if (terminadas.length === 0 && deTemporada.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {terminadas.length > 0 && (
        <Aviso
          titulo={t("terminadas", { n: terminadas.length })}
          porQue={t("terminadasPorQue")}
          empresas={terminadas}
        />
      )}

      {ventana && deTemporada.length > 0 && (
        <Aviso
          titulo={t(`ventana.${ventana.tipo}.titulo`)}
          porQue={t(`ventana.${ventana.tipo}.porQue`)}
          empresas={deTemporada}
        />
      )}
    </div>
  );
}

function Aviso({
  titulo,
  porQue,
  empresas,
}: {
  titulo: string;
  porQue: string;
  empresas: EmpresaParaInformar[];
}) {
  const t = useTranslations("panel.tareas.informe");
  const intlLocale = useIntlLocale();
  const formatoMes = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" });
  const formatoDia = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long" });
  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h2 className="text-base font-semibold text-teal-900">{titulo}</h2>
      <p className="mt-1 text-sm text-teal-800">{porQue}</p>

      <ul className="mt-4 flex flex-col gap-2">
        {empresas.map((empresa) => (
          <li
            key={empresa.empresa}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-zinc-900">{empresa.empresa}</p>
              <p className="text-xs text-zinc-500">
                {[
                  empresa.terminadaEl
                    ? t("terminadoEl", { fecha: formatoDia.format(aFecha(empresa.terminadaEl)) })
                    : null,
                  empresa.ultimoInforme
                    ? t("ultimoFue", { mes: formatoMes.format(aFecha(empresa.ultimoInforme)) })
                    : t("ningunInforme"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <BotonInforme empresa={empresa.empresa} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-teal-800">
        {t("loMandasTu")}
      </p>
    </section>
  );
}
