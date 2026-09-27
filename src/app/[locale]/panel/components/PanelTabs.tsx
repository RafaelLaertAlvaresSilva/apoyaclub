"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ClubProfile, ClubTeam } from "@/lib/types";
import { registrarGuardia } from "./guardia-sin-guardar";
import { IDS_PESTANA, type Pestana } from "./secciones-de-la-ficha";
import { AudienciaForm } from "./AudienciaForm";
import { CanteraForm } from "./CanteraForm";
import { ComunidadForm } from "./ComunidadForm";
import { EquiposForm } from "./EquiposForm";
import { HistoriaForm } from "./HistoriaForm";
import { IdentidadForm } from "./IdentidadForm";
import { InstalacionesForm } from "./InstalacionesForm";
import { NivelDeportivoForm } from "./NivelDeportivoForm";

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

  /**
   * La pestaña en la que estabas, por si el ancla desaparece.
   *
   * Pasaba cada vez que se guardaba algo fuera de Identidad —subir la
   * foto de un equipo, guardar Historia, Cantera, Instalaciones…—: al
   * terminar, el panel te devolvía a "Identidad del club" y había que
   * volver a buscar dónde estabas. Aquí abajo se arregla la causa; esto
   * es la red por si algún día vuelve a pasar por otro motivo.
   */
  const [ultimaPestana, setUltimaPestana] = useState<Pestana>("identidad");

  const esValida = IDS_PESTANA.has(ancla);
  if (esValida && ancla !== ultimaPestana) setUltimaPestana(ancla as Pestana);

  const solicitada = esValida ? (ancla as Pestana) : ultimaPestana;
  const pestanaActiva: Pestana = solicitada !== "identidad" && !perfilCreado ? "identidad" : solicitada;

  /**
   * La causa: Next no escucha los cambios de ancla.
   *
   * La pestaña abierta vive en el ancla de la URL, pero Next se guarda
   * por su cuenta en qué dirección cree que estamos, y ahí nunca llegó
   * el `#equipos`. Al terminar cualquier acción de guardado, vuelve a
   * la dirección que tenía apuntada —sin ancla— y el panel se queda sin
   * saber qué pestaña abrir.
   *
   * `replaceState` con la dirección que ya hay puesta no navega a
   * ningún sitio ni añade nada al historial: solo le dice a Next dónde
   * estamos de verdad.
   */
  useEffect(() => {
    if (!ancla) return;
    window.history.replaceState(null, "", window.location.href);
  }, [ancla]);

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

  /**
   * El menú del panel es quien cambia de sección ahora, y desde allí no
   * se ven los campos de este formulario. Se le deja aquí la
   * comprobación mientras esta pantalla está montada.
   */
  useEffect(() => {
    registrarGuardia(puedeSalir);
    return () => registrarGuardia(null);
  });

  return (
    /* Sin menú propio: las ocho secciones cuelgan de "Perfil del club"
       en el menú del panel. Tener dos columnas de menú, una al lado de
       la otra, era un menú de más y dejaba el formulario estrecho. */
    <div ref={contenedor}>
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
