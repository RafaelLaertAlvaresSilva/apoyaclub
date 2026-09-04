import { Link } from "@/i18n/navigation";
import {
  cuantoFalta,
  estadoVisible,
  hoyISO,
  tareasParaHoy,
  type TareaPatrocinio,
} from "@/lib/tareas-patrocinio";

/**
 * "Hoy toca esto": lo vencido y lo que vence hoy, arriba del panel.
 *
 * Es la mitad del valor de toda la función. Una lista de compromisos
 * que hay que ir a buscar es una lista que nadie mira; lo que hace que
 * las cosas se cumplan es que al entrar te salga delante que ayer se
 * pasó la fecha de la publicación de la ferretería.
 *
 * Si no hay nada, no se enseña nada. Un recuadro verde diciendo "vas al
 * día" cada día acaba siendo ruido que se aprende a ignorar, y el día
 * que salga en rojo también se ignorará.
 */
export function TareasDeHoy({ tareas }: { tareas: TareaPatrocinio[] }) {
  const hoy = hoyISO();
  const urgentes = tareasParaHoy(tareas, hoy);

  if (urgentes.length === 0) return null;

  const vencidas = urgentes.filter((tarea) => estadoVisible(tarea, hoy) === "caducada").length;

  return (
    <section
      className={`rounded-xl border p-5 ${
        vencidas > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`text-base font-semibold ${vencidas > 0 ? "text-red-800" : "text-amber-900"}`}>
          {vencidas > 0
            ? `Hoy toca esto — y ${vencidas} se te ${vencidas === 1 ? "ha pasado" : "han pasado"} de fecha`
            : "Hoy toca esto"}
        </h2>
        <Link
          href="/panel/tareas"
          className={`text-sm font-medium hover:underline ${
            vencidas > 0 ? "text-red-800" : "text-amber-900"
          }`}
        >
          Ver todas →
        </Link>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {urgentes.slice(0, 6).map((tarea) => {
          const vencida = estadoVisible(tarea, hoy) === "caducada";

          return (
            <li
              key={tarea.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-white/70 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-zinc-900">{tarea.empresa}</span>
              <span className="text-zinc-700">{tarea.accion}</span>
              <span
                className={`ml-auto shrink-0 text-xs font-medium ${
                  vencida ? "text-red-700" : "text-amber-800"
                }`}
              >
                {cuantoFalta(tarea.fin, hoy)}
              </span>
            </li>
          );
        })}
      </ul>

      {urgentes.length > 6 && (
        <p className="mt-2 text-xs text-zinc-600">Y {urgentes.length - 6} más.</p>
      )}
    </section>
  );
}
