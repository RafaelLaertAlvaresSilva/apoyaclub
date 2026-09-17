"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ClubProfile, ClubTeam } from "@/lib/types";
import { AudienciaForm } from "./AudienciaForm";
import { CanteraForm } from "./CanteraForm";
import { ComunidadForm } from "./ComunidadForm";
import { EquiposForm } from "./EquiposForm";
import { HistoriaForm } from "./HistoriaForm";
import { IdentidadForm } from "./IdentidadForm";
import { InstalacionesForm } from "./InstalacionesForm";
import { NivelDeportivoForm } from "./NivelDeportivoForm";

type Pestana =
  | "identidad"
  | "nivel"
  | "equipos"
  | "instalaciones"
  | "cantera"
  | "historia"
  | "audiencia"
  | "comunidad";

const IDS_PESTANA = new Set<string>([
  "identidad",
  "nivel",
  "equipos",
  "instalaciones",
  "cantera",
  "historia",
  "audiencia",
  "comunidad",
]);

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "identidad", etiqueta: "Identidad" },
  { id: "nivel", etiqueta: "Nivel deportivo" },
  { id: "equipos", etiqueta: "Equipos" },
  { id: "instalaciones", etiqueta: "Instalaciones" },
  { id: "cantera", etiqueta: "Cantera" },
  { id: "historia", etiqueta: "Historia" },
  { id: "audiencia", etiqueta: "Audiencia" },
  { id: "comunidad", etiqueta: "Acción social" },
];

export function PanelTabs({
  userId,
  perfil,
  equipos,
}: {
  userId: string;
  perfil: ClubProfile | null;
  equipos: ClubTeam[];
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  // Hasta que no exista el club (nombre + localidad guardados), solo se
  // puede rellenar la Identidad: el resto de secciones dependen de esa
  // fila para poder guardarse.
  const perfilCreado = perfil !== null;

  // La pestaña abierta la manda el ancla de la URL (`/panel#equipos`),
  // no un estado interno. Es lo que hace que funcionen los botones de
  // "Empieza aquí" y de "te falta por rellenar": los dos llevan al
  // propio panel, así que con un estado interno pulsarlos no hacía
  // absolutamente nada.
  const ancla = useSyncExternalStore(suscribirseAlAncla, leerAncla, () => "");

  const solicitada = IDS_PESTANA.has(ancla) ? (ancla as Pestana) : "identidad";
  const pestanaActiva: Pestana = solicitada !== "identidad" && !perfilCreado ? "identidad" : solicitada;

  // Al llegar desde uno de esos enlaces, la sección queda más abajo de
  // lo que se ve, así que hay que bajar hasta ella y dejar el cursor
  // puesto en el primer campo.
  //
  // Depende del ancla y no de la pestaña activa a propósito: el paso 1
  // de "Empieza aquí" apunta a Identidad, que es la pestaña que ya está
  // abierta, así que la pestaña no cambia y el efecto no llegaba a
  // ejecutarse nunca. Desde fuera eso se ve exactamente igual que un
  // botón roto.
  useEffect(() => {
    if (!ancla) return;

    contenedor.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Dejar el cursor en el primer campo ahorra al club el paso de
    // buscar por dónde empezar. `preventScroll` para no pelearse con el
    // desplazamiento suave de la línea de arriba.
    const primerCampo = contenedor.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]), textarea, select",
    );
    primerCampo?.focus({ preventScroll: true });
  }, [ancla]);

  /**
   * Si hay algo escrito sin guardar, se pregunta antes de cambiar de
   * pestaña.
   *
   * Cada pestaña guarda con su propio botón, así que media descripción
   * escrita más un toque en "Equipos" se iba entera, sin avisar. Era la
   * forma más rápida de que un directivo con poco tiempo no volviera a
   * rellenar la ficha.
   *
   * Se comprueba mirando los campos de verdad —lo que hay dentro contra
   * lo que traían puesto— en vez de llevar la cuenta de cada tecla: así
   * escribir y borrar no cuenta como cambio, y un formulario recién
   * guardado tampoco.
   */
  function haySinGuardar(): boolean {
    const campos = contenedor.current?.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("form input, form textarea, form select");
    if (!campos) return false;

    for (const campo of campos) {
      if (campo.type === "hidden" || campo.type === "file") continue;

      if (campo instanceof HTMLSelectElement) {
        const porDefecto = [...campo.options].find((opcion) => opcion.defaultSelected);
        if ((porDefecto?.value ?? campo.options[0]?.value ?? "") !== campo.value) return true;
        continue;
      }

      if (campo.type === "checkbox" || campo.type === "radio") {
        if ((campo as HTMLInputElement).defaultChecked !== (campo as HTMLInputElement).checked) {
          return true;
        }
        continue;
      }

      if (campo.defaultValue !== campo.value) return true;
    }

    return false;
  }

  /** true si se puede cambiar de pestaña: no hay nada sin guardar, o lo
   * hay y el club ha dicho que le da igual. */
  function puedeSalir(): boolean {
    if (!haySinGuardar()) return true;
    return window.confirm(
      "Tienes cambios sin guardar en esta pestaña. Si sales ahora se pierden.",
    );
  }

  return (
    <div ref={contenedor} className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {PESTANAS.map((pestana) => {
          const bloqueada = pestana.id !== "identidad" && !perfilCreado;
          return (
            <button
              key={pestana.id}
              type="button"
              disabled={bloqueada}
              onClick={() => {
                if (!puedeSalir()) return;
                // Cambiar el ancla es lo que abre la pestaña, porque el
                // ancla es la única fuente de la verdad aquí.
                window.location.hash = pestana.id;
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                pestanaActiva === pestana.id
                  ? "bg-teal-700 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {pestana.etiqueta}
            </button>
          );
        })}
      </nav>

      <div>
        {!perfilCreado && (
          <p className="mb-4 text-sm text-zinc-500">
            Completa la identidad del club (nombre y localidad) para desbloquear el resto de
            secciones.
          </p>
        )}

        {pestanaActiva === "identidad" && <IdentidadForm userId={userId} perfil={perfil} />}
        {pestanaActiva === "nivel" && perfilCreado && (
          <NivelDeportivoForm perfil={perfil} userId={userId} />
        )}
        {pestanaActiva === "equipos" && perfilCreado && <EquiposForm equipos={equipos} userId={userId} />}
        {pestanaActiva === "instalaciones" && perfilCreado && (
          <InstalacionesForm userId={userId} perfil={perfil} />
        )}
        {pestanaActiva === "cantera" && perfilCreado && <CanteraForm perfil={perfil} />}
        {pestanaActiva === "historia" && perfilCreado && (
          <HistoriaForm userId={userId} perfil={perfil} />
        )}
        {pestanaActiva === "audiencia" && perfilCreado && <AudienciaForm perfil={perfil} />}
        {pestanaActiva === "comunidad" && perfilCreado && <ComunidadForm perfil={perfil} userId={userId} />}
      </div>
    </div>
  );
}

/** Ancla actual de la URL, sin la almohadilla. */
function leerAncla(): string {
  return window.location.hash.replace("#", "");
}

/**
 * Avisa cuando cambia el ancla: al pulsar un enlace `#loquesea` y también
 * al usar el atrás/adelante del navegador.
 */
function suscribirseAlAncla(alCambiar: () => void): () => void {
  window.addEventListener("hashchange", alCambiar);
  window.addEventListener("popstate", alCambiar);
  return () => {
    window.removeEventListener("hashchange", alCambiar);
    window.removeEventListener("popstate", alCambiar);
  };
}
