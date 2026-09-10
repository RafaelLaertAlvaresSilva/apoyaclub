"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { HuecoPerfil } from "@/lib/profile-completion";

/**
 * Progreso de la ficha y, debajo, qué falta exactamente.
 *
 * La barra sola no servía de nada: decía "62 %" y el club no sabía qué
 * hacer con esa cifra. Ahora enseña los tres huecos que más aportan, con
 * el motivo por el que le conviene rellenarlos, y deja desplegar el
 * resto. El porcentaje viene de la base de datos y es el mismo que usa el
 * buscador para ordenar, así que la frase "más información, más
 * visibilidad" es literalmente cierta.
 *
 * Cuando no falta nada, no se enseña. Un recuadro al 100 % ocupando
 * media pantalla todos los días es ruido: ya no pide nada. Y vuelve
 * solo en cuanto aparece un hueco —porque el club añade un equipo sin
 * jugadores, o porque se amplía lo que se considera una ficha
 * completa—, que es justo cuando vuelve a tener algo que decir.
 */
export function BarraProgreso({
  porcentaje,
  huecos,
}: {
  porcentaje: number;
  huecos: HuecoPerfil[];
}) {
  const t = useTranslations("panel.perfil2");
  const [verTodos, setVerTodos] = useState(false);

  const visibles = verTodos ? huecos : huecos.slice(0, 3);
  const ocultos = huecos.length - visibles.length;

  const mensaje =
    porcentaje >= 60
      ? "Buen ritmo. Cada apartado que rellenes te sube en el buscador."
      : "Tu ficha aún tiene poca información, y eso te hace salir más abajo en el buscador.";

  // Nada que pedir, nada que enseñar.
  if (huecos.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-700">{t("perfilCompletado")}</p>
        <p className="text-sm font-semibold text-teal-700">{porcentaje}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-[width]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-snug text-zinc-500">{mensaje}</p>

      <div className="mt-3 border-t border-zinc-100 pt-3">
          <h3 className="text-sm font-medium text-zinc-700">
            Te falta por rellenar{" "}
            <span className="font-normal text-zinc-500">
              ({huecos.length} {huecos.length === 1 ? "apartado" : "apartados"})
            </span>
          </h3>
          <ul className="mt-2 space-y-1.5">
            {visibles.map((hueco) => (
              <li key={hueco.id}>
                {/* Decirle al club qué le falta sin llevarle allí de un
                    clic sería dejar el trabajo a medias. Casi todo se
                    arregla en una pestaña de esta misma página, y ahí
                    basta el ancla; lo que vive en otra sección —los
                    patrocinadores— necesita un enlace de verdad.

                    La fila entera es el enlace, y se ve que lo es: antes
                    era un subrayado gris finísimo sobre texto negro, y
                    desde fuera eso no se distingue de una lista de
                    tareas que no lleva a ninguna parte. */}
                {hueco.ruta ? (
                  <Link href={hueco.ruta} className={CLASES_HUECO}>
                    <ContenidoHueco titulo={hueco.titulo} porQue={hueco.porQue} />
                  </Link>
                ) : (
                  <a href={`#${hueco.pestana}`} className={CLASES_HUECO}>
                    <ContenidoHueco titulo={hueco.titulo} porQue={hueco.porQue} />
                  </a>
                )}
              </li>
            ))}
          </ul>

          {ocultos > 0 && (
            <button
              type="button"
              onClick={() => setVerTodos(true)}
              className="mt-3 text-sm font-medium text-teal-700 hover:underline"
            >
              Ver los {ocultos} restantes
            </button>
          )}
        {verTodos && huecos.length > 3 && (
          <button
            type="button"
            onClick={() => setVerTodos(false)}
            className="mt-3 text-sm font-medium text-teal-700 hover:underline"
          >
            Ver solo los principales
          </button>
        )}
      </div>
    </div>
  );
}

const CLASES_HUECO =
  "group flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/60";

/**
 * Lo que se ve dentro de cada fila: el punto ámbar, el título en verde
 * —el color de "esto se puede pulsar" en todo el panel— y la flecha,
 * que es lo que de verdad dice "te lleva a otro sitio".
 */
function ContenidoHueco({ titulo, porQue }: { titulo: string; porQue: string }) {
  return (
    <>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-teal-800 group-hover:text-teal-900">
          {titulo}
        </span>
        <span className="block text-xs leading-snug text-zinc-500">{porQue}</span>
      </span>
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600"
      >
        <path
          d="M9 18l6-6-6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
