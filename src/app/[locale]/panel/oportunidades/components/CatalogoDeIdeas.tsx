"use client";

import { useState } from "react";
import {
  CATEGORIAS_IDEA,
  ideasParaElClub,
  textoDeLoQueFalta,
  type CategoriaIdea,
  type Idea,
  type RequisitoIdea,
} from "@/lib/catalogo-ideas";

/**
 * El catálogo de ideas, dentro del formulario de crear oportunidad.
 *
 * El club llega aquí sin saber qué puede ofrecer más allá de la
 * camiseta. Elige una categoría, ve lo que otros clubes venden, pulsa
 * una y el formulario de siempre se abre relleno. Dos pasos, no cinco:
 * un presidente de club rellenando esto en el móvil a las once de la
 * noche no llega al quinto.
 *
 * Lo que nunca viene puesto es el precio. Nadie aquí sabe todavía lo que
 * vale un patrocinio de un club de barrio, y ponerle una cifra sería
 * inventársela.
 */
export function CatalogoDeIdeas({
  requisitos,
  onElegir,
}: {
  /** Lo que el club puede cumplir según su ficha. */
  requisitos: RequisitoIdea[];
  onElegir: (idea: Idea) => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaIdea | null>(null);

  const tiene = new Set(requisitos);
  const ideas = categoria ? ideasParaElClub(categoria, tiene) : [];
  const pista = CATEGORIAS_IDEA.find((entrada) => entrada.id === categoria)?.pista;

  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
      <p className="text-sm font-semibold text-zinc-900">
        ¿No sabes qué ofrecer? Mira por aquí
      </p>
      <p className="mt-0.5 text-sm text-zinc-600">
        Un patrocinio no es solo el hueco de la camiseta. Elige por dónde quieres empezar.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIAS_IDEA.map((entrada) => (
          <button
            key={entrada.id}
            type="button"
            onClick={() => setCategoria(categoria === entrada.id ? null : entrada.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoria === entrada.id
                ? "bg-teal-700 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-teal-500 hover:text-teal-700"
            }`}
          >
            {entrada.etiqueta}
          </button>
        ))}
      </div>

      {categoria && (
        <div className="mt-4">
          {pista && <p className="mb-3 text-xs text-zinc-500">{pista}</p>}

          <ul className="grid gap-2 sm:grid-cols-2">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <div
                  className={`flex h-full flex-col rounded-lg border bg-white p-3 ${
                    idea.disponible ? "border-zinc-200" : "border-dashed border-zinc-300"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900">{idea.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{idea.queEs}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    <span className="font-medium text-zinc-600">La empresa se lleva:</span>{" "}
                    {idea.queRecibeLaEmpresa}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400">{idea.duracion}</span>

                    {idea.disponible ? (
                      <button
                        type="button"
                        onClick={() => onElegir(idea)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
                      >
                        Usar esta idea
                      </button>
                    ) : (
                      /* Apagada, pero a la vista: enterarse de que esto
                         también se vende es justo lo que el club ha
                         venido a buscar. Solo le falta un dato suyo. */
                      <span className="text-right text-xs text-amber-700">
                        Para esto, antes {textoDeLoQueFalta(idea.leFalta)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-zinc-500">
            Al elegir una idea se rellena el formulario de abajo y lo puedes cambiar entero. El
            precio lo pones tú: nadie sabe mejor que el club lo que vale lo suyo.
          </p>
        </div>
      )}
    </div>
  );
}
