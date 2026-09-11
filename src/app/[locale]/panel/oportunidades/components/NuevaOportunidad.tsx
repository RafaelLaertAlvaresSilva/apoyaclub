"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { descripcionDeLaIdea, type Idea, type RequisitoIdea } from "@/lib/catalogo-ideas";
import type { ClubTeam } from "@/lib/types";
import { crearOportunidad } from "../actions";
import { CatalogoDeIdeas } from "./CatalogoDeIdeas";
import { OportunidadForm } from "./OportunidadForm";

export function NuevaOportunidad({
  equipos = [],
  requisitos = [],
}: {
  equipos?: ClubTeam[];
  /** Lo que el club puede cumplir según su ficha, para el catálogo. */
  requisitos?: RequisitoIdea[];
}) {
  const t = useTranslations("panel.oportunidades");
  const [abierto, setAbierto] = useState(false);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [estado, formAction] = useActionState(crearOportunidad, null);
  const formulario = useRef<HTMLDivElement>(null);

  // Al elegir una idea, el formulario que se acaba de rellenar queda más
  // abajo de lo que se ve: desde el catálogo parece que no ha pasado
  // nada. Aquí se baja hasta él y se deja el cursor en el primer campo,
  // que es donde el club tiene que seguir.
  useEffect(() => {
    if (!idea) return;

    const quietoParado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formulario.current?.scrollIntoView({
      behavior: quietoParado ? "auto" : "smooth",
      block: "start",
    });

    // `preventScroll` para no pelearse con el desplazamiento de arriba.
    formulario.current
      ?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select")
      ?.focus({ preventScroll: true });
  }, [idea]);

  // Al crearse con éxito, el padre vuelve a pasar `oportunidades` con
  // una fila más; su `key={oportunidades.length}` cambia y remonta este
  // componente ya cerrado, sin necesidad de cerrarlo manualmente aquí.
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
      >{t("nuevaOportunidad")}</button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">{t("nuevaOportunidad2")}</h2>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-zinc-500 hover:underline"
        >{t("cerrar")}</button>
      </div>

      <CatalogoDeIdeas requisitos={requisitos} onElegir={setIdea} />

      <div ref={formulario} className="scroll-mt-4">
        {idea && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              <strong>Añade algo tuyo antes de publicarla.</strong> Cuánta gente va a vuestros
              partidos, cuántos equipos sois, cuántos seguidores tenéis. Si todos los clubes
              publican el mismo texto, la empresa no sabrá por qué elegiros a vosotros.
            </p>
          </div>
        )}

        <OportunidadForm
          key={idea ? idea.id : "en-blanco"}
          accion={formAction}
          estado={estado}
          equipos={equipos}
          textoBoton="Crear oportunidad"
          valoresIniciales={
            idea
              ? {
                  title: idea.titulo,
                  description: descripcionDeLaIdea(idea),
                  opportunityType: idea.tipo,
                  duration: idea.duracion,
                  period: idea.periodo,
                  collaborationType: idea.colaboracion,
                  esNecesidad: idea.esNecesidad ?? false,
                  categoriaNecesidad: idea.categoriaNecesidad,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
