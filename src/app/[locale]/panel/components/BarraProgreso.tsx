"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

  const completo = huecos.length === 0;
  const visibles = verTodos ? huecos : huecos.slice(0, 3);
  const ocultos = huecos.length - visibles.length;

  const mensaje = completo
    ? "Ficha completa. Sales por delante de los clubes que no la han terminado."
    : porcentaje >= 60
      ? "Buen ritmo. Cada apartado que rellenes te sube en el buscador."
      : "Tu ficha aún tiene poca información, y eso te hace salir más abajo en el buscador.";

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
      <p className="mt-2 text-xs text-zinc-500">{mensaje}</p>

      {!completo && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-medium text-zinc-700">
            Te falta por rellenar{" "}
            <span className="font-normal text-zinc-500">
              ({huecos.length} {huecos.length === 1 ? "apartado" : "apartados"})
            </span>
          </h3>
          <ul className="mt-3 space-y-3">
            {visibles.map((hueco) => (
              <li key={hueco.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{hueco.titulo}</p>
                  <p className="text-sm text-zinc-500">{hueco.porQue}</p>
                </div>
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
      )}
    </div>
  );
}
