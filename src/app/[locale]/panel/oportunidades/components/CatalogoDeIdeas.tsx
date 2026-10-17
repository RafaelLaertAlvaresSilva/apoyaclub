"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import { IconoDeCategoria } from "@/components/IconoDeCategoria";
import {
  CATEGORIAS_IDEA,
  ideasParaElClub,
  textoDeLoQueFalta,
  textosDeLaIdea,
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
  const t = useTranslations("panel.oportunidades.catalogo");
  const tIdeas = useTranslations("ideas");
  // Los nombres y pistas de las categorías son los de la portada.
  const tCategorias = useTranslations("home.categoriasIdea");
  const intlLocale = useIntlLocale();
  const [categoria, setCategoria] = useState<CategoriaIdea | null>(null);

  const tiene = new Set(requisitos);
  const ideas = categoria ? ideasParaElClub(categoria, tiene) : [];
  const pista = categoria ? tCategorias(`${categoria}.pista`) : null;

  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
      <p className="text-sm font-semibold text-zinc-900">
        {t("titulo")}
      </p>
      <p className="mt-0.5 text-sm text-zinc-600">
        {t("texto")}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIAS_IDEA.map((entrada) => (
          <button
            key={entrada.id}
            type="button"
            onClick={() => setCategoria(categoria === entrada.id ? null : entrada.id)}
            /* `inline-flex` para que el símbolo y el nombre vayan en
               la misma línea y centrados. Con el `block` de antes, el
               símbolo se colocaba sobre la línea de base del texto y
               quedaba un par de píxeles más abajo. */
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoria === entrada.id
                ? "bg-accion text-sobre-color"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-teal-500 hover:text-teal-700"
            }`}
          >
            {/* El mismo símbolo que esta categoría tiene en la página
                pública: sale del mismo sitio, así que no pueden
                separarse. Hereda el color de la pastilla, que cambia a
                blanco al seleccionarla. */}
            <IconoDeCategoria categoria={entrada.id} className="h-3.5 w-3.5 flex-none" />
            {tCategorias(`${entrada.id}.etiqueta`)}
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
                  <p className="text-sm font-medium text-zinc-900">{textosDeLaIdea(idea, tIdeas).titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{textosDeLaIdea(idea, tIdeas).queEs}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    <span className="font-medium text-zinc-600">{t("seLleva")}</span>{" "}
                    {textosDeLaIdea(idea, tIdeas).queRecibe}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400">{textosDeLaIdea(idea, tIdeas).duracion}</span>

                    {idea.disponible ? (
                      <button
                        type="button"
                        onClick={() => onElegir(idea)}
                        className="rounded-lg bg-accion px-3 py-1.5 text-xs font-semibold text-sobre-color transition-colors hover:bg-accion-fuerte"
                      >
                        {t("usar")}
                      </button>
                    ) : (
                      /* Apagada, pero a la vista: enterarse de que esto
                         también se vende es justo lo que el club ha
                         venido a buscar. Solo le falta un dato suyo. */
                      <span className="text-right text-xs text-amber-700">
                        {t("paraEsto", { falta: textoDeLoQueFalta(idea.leFalta, tIdeas, intlLocale) })}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-zinc-500">
            {t("alElegir")}
          </p>
        </div>
      )}
    </div>
  );
}
