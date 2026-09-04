import {
  cuandoFueElUltimo,
  empresasPendientesDeInforme,
  ventanaDeInforme,
} from "@/lib/recordatorio-informe";
import { BotonInforme } from "./BotonInforme";

/**
 * El aviso de que toca mandar informes, dos veces por temporada.
 *
 * No es un correo: es un recuadro en el panel. El envío al patrocinador
 * lo hace el club desde su propio correo o por WhatsApp, porque la
 * empresa tiene relación con el club y no con ApoyaClub. Lo que sí es
 * asunto de la plataforma es recordárselo, y hacerlo concreto: un
 * "acuérdate de mandar informes" genérico se ignora a la segunda
 * semana; "a Ferretería Ramírez todavía no le has descargado ninguno"
 * no.
 *
 * Fuera de las dos ventanas no aparece nada, y una empresa desaparece
 * de la lista en cuanto se descarga su informe. Un aviso que sigue ahí
 * después de hacerle caso enseña a ignorarlo.
 */
export function RecordatorioInforme({
  empresasConTareas,
  ultimosInformes,
  hoy,
}: {
  empresasConTareas: string[];
  ultimosInformes: Map<string, string>;
  hoy: string;
}) {
  const ventana = ventanaDeInforme(hoy);
  if (!ventana) return null;

  const pendientes = empresasPendientesDeInforme(empresasConTareas, ultimosInformes, ventana);
  if (pendientes.length === 0) return null;

  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h2 className="text-base font-semibold text-teal-900">{ventana.titulo}</h2>
      <p className="mt-1 text-sm text-teal-800">{ventana.porQue}</p>

      <ul className="mt-4 flex flex-col gap-2">
        {pendientes.map(({ empresa, ultimoInforme }) => (
          <li
            key={empresa}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-zinc-900">{empresa}</p>
              <p className="text-xs text-zinc-500">{cuandoFueElUltimo(ultimoInforme)}</p>
            </div>
            <BotonInforme empresa={empresa} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-teal-800">
        El informe lo mandas tú, desde tu correo o por WhatsApp. Descárgalo y adjúntalo con dos
        líneas tuyas: llega mucho mejor que un correo automático.
      </p>
    </section>
  );
}
