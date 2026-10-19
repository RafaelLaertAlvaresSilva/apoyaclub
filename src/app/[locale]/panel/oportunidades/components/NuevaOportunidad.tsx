"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  descripcionDeLaIdea,
  textosDeLaIdea,
  type Idea,
  type RequisitoIdea,
} from "@/lib/catalogo-ideas";
import type { ClubTeam } from "@/lib/types";
import { crearOportunidad } from "../actions";
import { Paso } from "@/app/[locale]/panel/components/SeccionCard";
import { CatalogoDeIdeas } from "./CatalogoDeIdeas";
import { OportunidadForm } from "./OportunidadForm";

export function NuevaOportunidad({
  equipos = [],
  requisitos = [],
  userId,
}: {
  equipos?: ClubTeam[];
  /** Lo que el club puede cumplir según su ficha, para el catálogo. */
  requisitos?: RequisitoIdea[];
  /** El identificador del club, para subir las fotos al almacén. */
  userId: string;
}) {
  const t = useTranslations("panel.oportunidades");
  const tIdeas = useTranslations("ideas");
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

    const quietoParado = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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
        className="rounded-lg bg-accion px-5 py-3 text-base font-semibold text-sobre-color shadow-sm transition-colors hover:bg-accion-fuerte"
      >
        {t("nuevaOportunidad")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-zinc-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-titular">
          {t("nuevaOportunidad2")}
        </h2>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-zinc-500 hover:underline"
        >
          {t("cerrar")}
        </button>
      </div>

      {/* Paso 1: empezar por una idea. Al elegirla, el formulario de
          abajo se rellena casi entero y solo queda el precio y la foto.
          Quien prefiere escribirla él, sigue bajando. */}
      <div className="mb-5">
        <Paso numero={1} tono="verde" titulo={t("pasos.idea")} descripcion={t("pasos.ideaTexto")}>
          <CatalogoDeIdeas requisitos={requisitos} onElegir={setIdea} enPaso />
        </Paso>
      </div>

      <div ref={formulario} className="scroll-mt-4">
        {idea && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              {t.rich("anadeAlgoTuyo", { fuerte: (trozo) => <strong>{trozo}</strong> })}
            </p>
          </div>
        )}

        <OportunidadForm
          userId={userId}
          key={idea ? idea.id : "en-blanco"}
          accion={formAction}
          estado={estado}
          equipos={equipos}
          textoBoton={t("crearOportunidad")}
          primerPaso={2}
          valoresIniciales={
            idea
              ? {
                  title: textosDeLaIdea(idea, tIdeas).titulo,
                  description: descripcionDeLaIdea(idea, tIdeas),
                  opportunityType: idea.tipo,
                  duration: textosDeLaIdea(idea, tIdeas).duracion,
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
