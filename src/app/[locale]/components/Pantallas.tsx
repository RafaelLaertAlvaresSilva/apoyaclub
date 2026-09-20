"use client";

import { useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";

/**
 * Las cuatro pantallas del producto, en pestañas.
 *
 * Sustituye a seis secciones de la portada —lo que el club puede
 * ofrecer, las oportunidades de ejemplo, la página del club, el
 * seguimiento, el dossier y el panel—, que juntas eran más de la mitad
 * del texto de la página. Un club que entra por primera vez no lee seis
 * bloques seguidos: mira, y decide si le interesa.
 *
 * Así que aquí no se cuenta, se enseña. Cada pestaña es una maqueta y
 * una sola frase debajo. Lo que se ha quitado de aquí no se ha perdido:
 * está entero en /para-clubes, que es donde va quien ya ha decidido que
 * le interesa.
 *
 * Las maquetas llevan datos de muestra y se dice al pie. Enseñar
 * números inventados sin avisar es la forma más barata de perder la
 * credibilidad que esta sección existe para ganar.
 */

export type Pantalla = { clave: string; pestana: string; pie: string };

export type DatosDelClub = {
  url: string;
  nombre: string;
  etiqueta1: string;
  etiqueta2: string;
  etiqueta3: string;
  seguidores: string;
  alcance: string;
  equipos: string;
  oportunidades: string;
};

export type DatosDeOportunidad = {
  categoria: string;
  titulo: string;
  precio: string;
  periodo: string;
  datos: string[];
  incluye: string[];
};

type Props = {
  lista: Pantalla[];
  etiquetaLista: string;
  club: DatosDelClub;
  oportunidad: DatosDeOportunidad;
  estados: { nombre: string; texto: string }[];
  nota: string;
};

export function Pantallas({ lista, etiquetaLista, club, oportunidad, estados, nota }: Props) {
  const [activa, setActiva] = useState(0);
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  // Flechas para cambiar de pestaña: es lo que espera quien navega con
  // el teclado, y sin esto la única forma de llegar a la cuarta es el
  // ratón.
  function alPulsarTecla(evento: React.KeyboardEvent, indice: number) {
    const salto = evento.key === "ArrowRight" ? 1 : evento.key === "ArrowLeft" ? -1 : 0;
    if (salto === 0) return;

    evento.preventDefault();
    const siguiente = (indice + salto + lista.length) % lista.length;
    setActiva(siguiente);
    botones.current[siguiente]?.focus();
  }

  const pantalla = lista[activa];

  return (
    <div>
      <div
        role="tablist"
        aria-label={etiquetaLista}
        className="mt-8 flex flex-wrap justify-center gap-2"
      >
        {lista.map((item, indice) => {
          const seleccionada = indice === activa;
          return (
            <button
              key={item.clave}
              ref={(nodo) => {
                botones.current[indice] = nodo;
              }}
              type="button"
              role="tab"
              id={`${base}-pestana-${item.clave}`}
              aria-controls={`${base}-panel-${item.clave}`}
              aria-selected={seleccionada}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => setActiva(indice)}
              onKeyDown={(evento) => alPulsarTecla(evento, indice)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                seleccionada
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-brand-navy"
              }`}
            >
              {item.pestana}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panel-${pantalla.clave}`}
        aria-labelledby={`${base}-pestana-${pantalla.clave}`}
        className="mt-10"
      >
        <div className="flex justify-center">
          {pantalla.clave === "pagina" && <MaquetaPagina club={club} />}
          {pantalla.clave === "oportunidad" && <MaquetaOportunidad oportunidad={oportunidad} />}
          {pantalla.clave === "solicitudes" && <MaquetaSolicitudes estados={estados} />}
          {pantalla.clave === "dossier" && <MaquetaDossier />}
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-zinc-600">
          {pantalla.pie}
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400">{nota}</p>
    </div>
  );
}

/* ---------- LA PÁGINA DEL CLUB ---------- */

function MaquetaPagina({ club }: { club: DatosDelClub }) {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-brand-navy/10">
      <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
        <span className="ml-2 truncate text-xs text-zinc-500">{club.url}</span>
      </div>

      <div className="h-28 bg-gradient-to-br from-brand-navy to-brand-teal-dark" />

      <div className="px-6">
        <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-md">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--brand-teal-dark)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
          </svg>
        </div>
      </div>

      <div className="px-6 pb-6 pt-3.5">
        <div className="text-[17px] font-extrabold text-brand-navy">{club.nombre}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="teal">{club.etiqueta1}</Badge>
          <Badge tone="teal">{club.etiqueta2}</Badge>
          <Badge tone="neutral">{club.etiqueta3}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2.5 border-t border-zinc-100 pt-4">
          <Dato numero="12,4k" etiqueta={club.seguidores} />
          <Dato numero="48k" etiqueta={club.alcance} />
          <Dato numero="9" etiqueta={club.equipos} />
          <Dato numero="3" etiqueta={club.oportunidades} />
        </div>
      </div>
    </div>
  );
}

function Dato({ numero, etiqueta }: { numero: string; etiqueta: string }) {
  return (
    <div>
      <div className="text-base font-extrabold text-brand-navy">{numero}</div>
      <div className="text-[11px] text-zinc-500">{etiqueta}</div>
    </div>
  );
}

/* ---------- UNA OPORTUNIDAD ---------- */

function MaquetaOportunidad({ oportunidad }: { oportunidad: DatosDeOportunidad }) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-navy/15">
      <div className="h-1.5 bg-brand-teal-dark" />
      <div className="p-7">
        <Badge tone="teal">{oportunidad.categoria.toUpperCase()}</Badge>
        <h3 className="mt-4 text-lg font-extrabold leading-snug text-brand-navy">
          {oportunidad.titulo}
        </h3>

        <p className="mt-3">
          <span className="text-3xl font-extrabold tracking-tight text-brand-navy">
            {oportunidad.precio}
          </span>
          <span className="text-base text-zinc-500">{oportunidad.periodo}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {oportunidad.datos.map((dato) => (
            <span
              key={dato}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
            >
              {dato}
            </span>
          ))}
        </div>

        <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-5">
          {oportunidad.incluye.map((cosa) => (
            <li key={cosa} className="flex items-start gap-2.5">
              <Tic />
              <span className="text-sm text-zinc-700">{cosa}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Tic() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 flex-none text-brand-teal"
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- QUIÉN TE ESCRIBE ---------- */

/** Los cuatro estados son los que tiene de verdad una solicitud en
 * `contact_requests`. Si algún día se añaden etapas se cambian ahí, no
 * aquí: lo que no puede pasar es que la portada dibuje un embudo que el
 * club no se encuentra al entrar. */
function MaquetaSolicitudes({ estados }: { estados: { nombre: string; texto: string }[] }) {
  return (
    <ol className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {estados.map((estado, indice) => (
        <li key={estado.nombre} className="rounded-2xl border border-zinc-200 bg-white p-5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-teal-light text-sm font-extrabold text-brand-teal-dark">
            {indice + 1}
          </span>
          <h3 className="mt-3 text-sm font-extrabold text-brand-navy">{estado.nombre}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{estado.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/* ---------- EL DOSSIER ---------- */

function MaquetaDossier() {
  return (
    <div className="flex justify-center gap-5" aria-hidden="true">
      <Hoja />
      <Hoja segunda />
    </div>
  );
}

/** Líneas grises, sin texto inventado: lo que importa es la forma. */
function Hoja({ segunda = false }: { segunda?: boolean }) {
  return (
    <div
      className={`w-32 flex-none rounded-xl border border-zinc-200 bg-white p-4 shadow-xl shadow-brand-navy/10 sm:w-40 ${
        segunda ? "mt-8 rotate-2" : "-rotate-2"
      }`}
    >
      <div className="mb-3 h-2 w-3/5 rounded bg-brand-navy" />
      <div className="mb-1.5 h-1 w-full rounded bg-zinc-200" />
      <div className="mb-1.5 h-1 w-11/12 rounded bg-zinc-200" />
      <div className="mb-4 h-1 w-full rounded bg-zinc-200" />
      <div
        className={`mb-4 rounded ${segunda ? "h-12 bg-brand-navy/10" : "h-16 bg-brand-teal-light"}`}
      />
      <div className="mb-1.5 h-1 w-4/5 rounded bg-zinc-200" />
      <div className="mb-1.5 h-1 w-full rounded bg-zinc-200" />
      <div className="h-1 w-5/6 rounded bg-zinc-200" />
    </div>
  );
}
