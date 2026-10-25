"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * El vídeo de presentación, al lado del mensaje de la portada.
 *
 * DENTRO DE UN MARCO DE TELÉFONO, y no suelto. El vídeo es vertical
 * (9:16), que es el formato de un reel. Puesto a secas en media
 * columna de un ordenador se lee como un vídeo mal encajado; dentro de
 * un teléfono se lee como lo que es. El marco además lo justifica: a
 * nadie le extraña que un teléfono sea alto.
 *
 * Y es estrecho a propósito. A 460 px de ancho —media columna— un 9:16
 * mide 818 px de alto, y el héroe pasaría de 553 px a 870: en un
 * portátil, los botones "Soy un club" y "Soy una empresa" se quedarían
 * fuera de la pantalla, que es lo contrario de lo que este cambio
 * busca. A 300 px el vídeo mide 533 y cabe al lado del texto.
 *
 * ARRANCA SOLO, SIN SONIDO Y EN BUCLE, que es como funciona un vídeo
 * de cabecera: ningún navegador deja que algo suene sin que lo pidas, y
 * un vídeo parado con un triángulo encima no lo pulsa casi nadie.
 *
 * LOS MANDOS VAN DEBAJO DEL TELÉFONO, no encima del vídeo. Encima
 * taparían los últimos 40 px de la imagen, que es justo donde este
 * vídeo pone "sin permanencia · sin comisiones · www.apoyaclub.com".
 * Debajo se ven siempre, sin tener que pasar el ratón por encima —que
 * en un móvil no existe— y sin tapar nada.
 */
export function VideoDeLaPortada({
  src,
  poster,
  etiqueta,
}: {
  src: string;
  poster: string;
  etiqueta: string;
}) {
  const t = useTranslations("home.video");
  const video = useRef<HTMLVideoElement>(null);
  const [conSonido, setConSonido] = useState(false);
  const [enMarcha, setEnMarcha] = useState(true);
  const [momento, setMomento] = useState(0);
  const [duracion, setDuracion] = useState(0);

  /**
   * Quien ha pedido en su sistema que no se muevan las cosas, no ve
   * un bucle: ve la imagen fija y los mandos. No es un adorno de
   * accesibilidad — a quien le marea el movimiento, un vídeo en bucle
   * al lado del texto le impide leerlo.
   */
  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;

    /**
     * PONERSE AL DÍA DE LO QUE YA HA PASADO.
     *
     * El `<video>` viene en el HTML que manda el servidor, así que el
     * navegador empieza a cargarlo nada más leerlo — bastante antes de
     * que React enganche sus manejadores. Para cuando lo hace,
     * `loadedmetadata` ya ha saltado, y ese manejador no se ejecuta
     * nunca: la duración se quedaría a cero para siempre, con la barra
     * muerta y el reloj marcando "0:00 / 0:00" sobre un vídeo de 57
     * segundos que se ve correr. No da ningún error; solo no funciona.
     */
    if (elemento.readyState >= 1) {
      sincronizar(elemento);
      setEnMarcha(!elemento.paused);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      elemento.pause();
  }, []);

  /**
   * Si está en marcha o no lo dice el propio vídeo con sus eventos
   * `play` y `pause`, y no nuestro botón.
   *
   * El navegador también lo para él solo —una pestaña de fondo, la
   * batería baja, el sistema operativo—, y un estado que solo se
   * actualizara al pulsar estaría diciendo que corre cuando está
   * parado: el botón enseñaría "pausa" sobre un vídeo quieto.
   */
  function alPonerse() {
    setEnMarcha(true);
  }
  function alPararse() {
    setEnMarcha(false);
  }

  /**
   * Copiar al componente lo que dice el vídeo: por dónde va y cuánto
   * dura. `duration` es NaN hasta que llegan los metadatos, y una
   * barra cuyo máximo es NaN no se puede arrastrar.
   */
  function sincronizar(elemento: HTMLVideoElement) {
    setMomento(elemento.currentTime);
    if (Number.isFinite(elemento.duration)) setDuracion(elemento.duration);
  }

  function alternarMarcha() {
    const elemento = video.current;
    if (!elemento) return;
    if (elemento.paused) void elemento.play();
    else elemento.pause();
  }

  function alternarSonido() {
    const elemento = video.current;
    if (!elemento) return;

    elemento.muted = conSonido;
    setConSonido(!conSonido);

    // Pedir sonido es pedir verlo: si estaba parado, arranca.
    if (elemento.paused) void elemento.play();
  }

  /**
   * Saltar adelante o atrás.
   *
   * Acotado a los dos extremos a mano: pedirle a un vídeo que vaya al
   * segundo −4 o a uno más allá del final no es un error que avise,
   * simplemente se queda donde estaba, y el botón parecería roto.
   */
  function saltar(segundos: number) {
    const elemento = video.current;
    if (!elemento) return;
    const destino = elemento.currentTime + segundos;
    elemento.currentTime = Math.min(
      Math.max(destino, 0),
      elemento.duration || 0,
    );
  }

  function irA(segundo: number) {
    const elemento = video.current;
    if (!elemento) return;
    elemento.currentTime = segundo;
    setMomento(segundo);
  }

  const avance = duracion > 0 ? (momento / duracion) * 100 : 0;

  return (
    <div className="mx-auto w-[240px] flex-none sm:w-[280px] lg:w-[300px]">
      <div className="relative overflow-hidden rounded-[2rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-brand-navy/25">
        {/* El altavoz. Dos píxeles de nada, pero sin él el marco es un
            rectángulo negro y no un teléfono. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1.5 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-zinc-700"
        />

        <video
          ref={video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={etiqueta}
          onPlay={alPonerse}
          onPause={alPararse}
          onTimeUpdate={(evento) => sincronizar(evento.currentTarget)}
          onDurationChange={(evento) => sincronizar(evento.currentTarget)}
          onLoadedMetadata={(evento) => sincronizar(evento.currentTarget)}
          className="block aspect-[478/850] h-auto w-full rounded-[1.5rem] bg-zinc-900 object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>

      {/* ================= LOS MANDOS ================= */}
      <div className="mt-3 text-center lg:text-left">
        {/* La barra es un `input range` de verdad y no una barra
            pintada con un div. Así se arrastra con el ratón, se mueve
            con las flechas del teclado y los lectores de pantalla
            saben decir por dónde va, sin escribir nada de eso. */}
        <input
          type="range"
          min={0}
          max={duracion > 0 ? duracion : 1}
          step={0.1}
          value={momento}
          onChange={(evento) => irA(Number(evento.target.value))}
          aria-label={t("irAUnMomento")}
          style={{
            background: `linear-gradient(to right, var(--brand-teal-dark) ${avance}%, #e4e4e7 ${avance}%)`,
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion-tinta [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-teal-dark [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-teal-dark [&::-webkit-slider-thumb]:shadow"
        />

        {/* Tres columnas para que los tres mandos de en medio queden
            centrados de verdad: con el reloj y el altavoz metidos en la
            misma fila, cualquier otra cosa los descoloca al cambiar de
            "0:09" a "0:10". */}
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
          <span className="text-xs tabular-nums text-zinc-600">
            {reloj(momento)} / {reloj(duracion)}
          </span>

          <span className="flex items-center gap-1">
            <Mando al={() => saltar(-10)} nombre={t("retroceder")}>
              <IconoSaltar haciaAtras />
            </Mando>

            <button
              type="button"
              onClick={alternarMarcha}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal-dark text-sobre-color transition-colors hover:bg-accion-fuerte focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion-tinta"
            >
              <span className="sr-only">
                {enMarcha ? t("pausar") : t("reanudar")}
              </span>
              <IconoMarcha enMarcha={enMarcha} />
            </button>

            <Mando al={() => saltar(10)} nombre={t("avanzar")}>
              <IconoSaltar />
            </Mando>
          </span>

          <span className="flex justify-end">
            <Mando
              al={alternarSonido}
              nombre={conSonido ? t("quitarSonido") : t("ponerSonido")}
              pulsado={conSonido}
            >
              <IconoSonido conSonido={conSonido} />
            </Mando>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Un botón redondo de los pequeños, con su nombre para quien no lo ve. */
function Mando({
  al,
  nombre,
  pulsado,
  children,
}: {
  al: () => void;
  nombre: string;
  pulsado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={al}
      aria-pressed={pulsado}
      title={nombre}
      className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-accion-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion-tinta"
    >
      <span className="sr-only">{nombre}</span>
      {children}
    </button>
  );
}

/** "0:09", "1:12". El vídeo dura menos de una hora; no hacen falta horas. */
function reloj(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const enteros = Math.floor(segundos);
  const minutos = Math.floor(enteros / 60);
  return `${minutos}:${String(enteros % 60).padStart(2, "0")}`;
}

/**
 * Los dibujos.
 *
 * Dibujados y no caracteres (▶ ⏸ ⏪ 🔊): los símbolos de texto salen de
 * un tamaño distinto en cada sistema, el emoji del altavoz sale de
 * color, y en Windows varios de ellos no salen.
 */
function Lienzo({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function IconoMarcha({ enMarcha }: { enMarcha: boolean }) {
  return (
    <Lienzo>
      {enMarcha ? (
        <path d="M9.5 5.5v13M14.5 5.5v13" />
      ) : (
        <path d="M7.5 5.2l11 6.8-11 6.8z" fill="currentColor" />
      )}
    </Lienzo>
  );
}

/**
 * El doble triángulo de saltar.
 *
 * Se probó antes una flecha circular con un "10" dentro, que es lo que
 * usan los reproductores grandes. A 20 px no se leía: el número salía
 * de tres píxeles y el conjunto parecía un garabato. El doble triángulo
 * lo reconoce todo el mundo a cualquier tamaño, y cuántos segundos
 * salta lo dice el rótulo del botón.
 */
function IconoSaltar({ haciaAtras = false }: { haciaAtras?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-5 w-5 ${haciaAtras ? "-scale-x-100" : ""}`}
    >
      <path d="M4 6.8a.8.8 0 011.26-.65L11.3 11.35a.8.8 0 010 1.3L5.26 17.85A.8.8 0 014 17.2z" />
      <path d="M12.7 6.8a.8.8 0 011.26-.65L20 11.35a.8.8 0 010 1.3l-6.04 5.2A.8.8 0 0112.7 17.2z" />
    </svg>
  );
}

function IconoSonido({ conSonido }: { conSonido: boolean }) {
  return (
    <Lienzo>
      <path d="M4 9.5v5a1 1 0 001 1h2.5l4 3.5v-14l-4 3.5H5a1 1 0 00-1 1z" />
      {conSonido ? (
        <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
      ) : (
        <path d="M16 10l4 4M20 10l-4 4" />
      )}
    </Lienzo>
  );
}
