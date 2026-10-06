"use client";

import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { Button } from "@/components/ui/Button";
import {
  cuantoFalta,
  estadoDeRenovacion,
  mensajeDeRenovacion,
  type EstadoRenovacion,
} from "@/lib/renovaciones";
import type { ClubSponsor } from "@/lib/types";
import { Campo, clasesInput } from "../../components/SeccionCard";
import { guardarRenovacion, type EstadoGuardado } from "../actions";

/**
 * Cada patrocinador con sus dos fechas, lo acordado y el mensaje listo
 * para copiar.
 *
 * El día de hoy llega como prop desde el servidor y no se calcula aquí
 * con `new Date()`: si cada mitad usara su propio reloj, el servidor
 * pintaría "faltan 3 días" y el navegador del club, en otra zona
 * horaria, "faltan 2", y React avisaría de que el HTML no coincide.
 *
 * LOS COLORES SON LOS DEL PANEL, no unos propios. Esta sección nació
 * escrita a mano —botón en `bg-teal-700`, campos con su propio borde, y
 * la tarjeta del estado "sin fecha" en `bg-zinc-50` y con el borde a
 * rayas— y el resultado era que, al lado de Patrocinadores o de "A
 * quién escribir", parecía otra web: allí la tarjeta es blanca siempre
 * y aquí se confundía con el fondo de la página.
 *
 * Así que de aquí no sale ninguna clase inventada:
 *
 *   - La tarjeta es `rounded-xl border bg-white p-5`, igual que
 *     `FilaObjetivo`. BLANCA SIEMPRE: el estado se dice con el color
 *     del borde y un halo suave, nunca tiñendo el fondo, que es lo que
 *     la hacía desaparecer.
 *   - Los campos usan `Campo` y `clasesInput` de `SeccionCard`, los
 *     mismos de las cuarenta casillas del panel.
 *   - El botón de guardar es `Button`, el del sistema de diseño, en el
 *     verde de la casa (`brand-teal-dark`).
 *   - Los avisos son `AvisoError` y `AvisoExito`, como en el resto.
 *
 * Las pastillas de estado copian la paleta de `CLASES_ESTADO`
 * (`src/lib/prospectos.ts`): fondo al 100 y texto al 700/800. Las que
 * había antes eran de relleno fuerte y texto blanco, un peso que no
 * tiene ninguna otra pastilla del panel.
 */

const ASPECTO: Record<EstadoRenovacion, { caja: string; pastilla: string; texto: string }> = {
  pasada: {
    caja: "border-red-300 ring-1 ring-red-100",
    pastilla: "bg-red-100 text-red-700",
    texto: "Se pasó",
  },
  urgente: {
    caja: "border-amber-300 ring-1 ring-amber-100",
    pastilla: "bg-amber-100 text-amber-800",
    texto: "Corre prisa",
  },
  proxima: {
    caja: "border-zinc-200",
    pastilla: "bg-teal-100 text-teal-700",
    texto: "Se acerca",
  },
  "al-dia": {
    caja: "border-zinc-200",
    pastilla: "bg-zinc-100 text-zinc-700",
    texto: "Al día",
  },
  "sin-fecha": {
    caja: "border-zinc-200",
    pastilla: "bg-zinc-100 text-zinc-500",
    texto: "Sin fecha",
  },
};

export function ListaDeRenovaciones({
  patrocinadores,
  nombreDelClub,
  temporada,
  hoyISO,
}: {
  patrocinadores: ClubSponsor[];
  nombreDelClub: string;
  temporada: string;
  hoyISO: string;
}) {
  const [anio, mes, dia] = hoyISO.split("-").map(Number);
  const hoy = new Date(anio, mes - 1, dia);

  return (
    <ul className="flex flex-col gap-4">
      {patrocinadores.map((patrocinador) => (
        <li key={patrocinador.id}>
          <FichaDeRenovacion
            patrocinador={patrocinador}
            nombreDelClub={nombreDelClub}
            temporada={temporada}
            hoy={hoy}
          />
        </li>
      ))}
    </ul>
  );
}

function FichaDeRenovacion({
  patrocinador,
  nombreDelClub,
  temporada,
  hoy,
}: {
  patrocinador: ClubSponsor;
  nombreDelClub: string;
  temporada: string;
  hoy: Date;
}) {
  const [estado, accion, enviando] = useActionState<EstadoGuardado, FormData>(
    guardarRenovacion,
    null,
  );
  const [verMensaje, setVerMensaje] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const situacion = estadoDeRenovacion(patrocinador, hoy);
  const aspecto = ASPECTO[situacion];
  const mensaje = mensajeDeRenovacion({ patrocinador, nombreDelClub, temporada });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso de portapapeles —pasa en algunos navegadores de
      // móvil— el texto sigue a la vista y se puede seleccionar a mano.
      setCopiado(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-white p-5 ${aspecto.caja}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{patrocinador.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {patrocinador.sinceYear
              ? `Con el club desde ${patrocinador.sinceYear}`
              : "Sin fecha de inicio"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${aspecto.pastilla}`}
        >
          {/* "Se pasó · Se pasó hace 16 días" lo decía dos veces: en lo
              vencido, la frase de los días ya dice el estado ella sola. */}
          {situacion === "pasada" && patrocinador.renewalDate
            ? cuantoFalta(patrocinador.renewalDate, hoy)
            : `${aspecto.texto}${
                patrocinador.renewalDate
                  ? ` · ${cuantoFalta(patrocinador.renewalDate, hoy)}`
                  : ""
              }`}
        </span>
      </div>

      <form action={accion} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="patrocinadorId" value={patrocinador.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Cuándo escribir"
            ayuda="Ponla antes de que acabe el acuerdo, con margen para hablarlo."
          >
            <input
              type="date"
              name="renewalDate"
              defaultValue={patrocinador.renewalDate ?? ""}
              className={clasesInput}
            />
          </Campo>

          <Campo etiqueta="Cuándo acaba el acuerdo">
            <input
              type="date"
              name="agreementEndsOn"
              defaultValue={patrocinador.agreementEndsOn ?? ""}
              className={clasesInput}
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Qué acordasteis"
          ayuda="Lo que hoy está en la cabeza de quien lo firmó. Cuando cambie la junta, esto es lo único que queda."
        >
          <textarea
            name="renewalNotes"
            rows={2}
            defaultValue={patrocinador.renewalNotes ?? ""}
            placeholder="600 € por temporada, logo en la camiseta y dos publicaciones al mes."
            className={clasesInput}
          />
        </Campo>

        <AvisoError mensaje={estado?.error ?? null} />
        <AvisoExito mensaje={estado?.ok ? "Guardado." : null} />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>

          <button
            type="button"
            onClick={() => setVerMensaje((abierto) => !abierto)}
            aria-expanded={verMensaje}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
          >
            {verMensaje ? "Ocultar el mensaje" : "Qué escribirle"}
          </button>
        </div>
      </form>

      {verMensaje && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-500">
            Un punto de partida, no un correo para mandar tal cual: cámbialo a vuestra manera de
            hablar antes de enviarlo.
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
            {mensaje}
          </pre>
          <button
            type="button"
            onClick={copiar}
            className="mt-3 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
