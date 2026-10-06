"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cerrarSesion } from "@/app/[locale]/actions";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { sePuedeSalir } from "./guardia-sin-guardar";
import { SECCIONES_DE_LA_FICHA } from "./secciones-de-la-ficha";

/**
 * Un apartado del menú. El `titulo` va en `null` para el primero, que
 * es solo "Inicio" y no necesita que nadie le ponga nombre.
 */
type Grupo = {
  titulo: string | null;
  enlaces: {
    id: string;
    href: string;
    etiqueta: string;
    /** Sale del panel: la página pública del club. */
    fuera?: boolean;
    /** Si sus secciones cuelgan debajo, con una flecha para abrirlas. */
    desplegable?: boolean;
  }[];
};

/**
 * El reparto en cuatro apartados no es decorativo: separa dos trabajos
 * que el club hace en momentos distintos de la temporada.
 *
 *   - "Buscar patrocinadores" es eso: qué ofrezco, a quién se lo
 *     ofrezco, quién me ha escrito, qué le mando.
 *   - "Seguimiento" es cumplir: con quién he firmado y qué le he
 *     prometido.
 *
 * Antes estaban mezclados en una fila de once botones sin orden, con
 * "Tareas" entre "Patrocinadores" y "Oportunidades" y "Privacidad" al
 * lado de "Dossier".
 */
const GRUPOS: Grupo[] = [
  {
    titulo: null,
    enlaces: [{ id: "inicio", href: "/panel", etiqueta: "Inicio" }],
  },
  {
    titulo: "Mi club",
    enlaces: [
      { id: "perfil", href: "/panel/perfil", etiqueta: "Perfil del club", desplegable: true },
      // El recuento de gente en los partidos (migración 0037): de aquí
      // sale la asistencia media que enseña la ficha.
      { id: "publico", href: "/panel/publico", etiqueta: "Público" },
      // Lo que sale de juntar la ficha con ese recuento, sin sumar
      // nada: es lo que el club enseña cuando le preguntan "¿y a cuánta
      // gente llegáis?".
      { id: "alcance", href: "/panel/alcance", etiqueta: "Alcance" },
    ],
  },
  {
    titulo: "Buscar patrocinadores",
    enlaces: [
      { id: "oportunidades", href: "/panel/oportunidades", etiqueta: "Oportunidades" },
      // La libreta de empresas a las que el club quiere escribir
      // (migración 0041). Va pegada a Oportunidades porque es el paso
      // siguiente: ya sabes qué ofreces, ahora a quién.
      { id: "objetivos", href: "/panel/objetivos", etiqueta: "A quién escribir" },
      { id: "solicitudes", href: "/panel/solicitudes", etiqueta: "Solicitudes" },
      // Ya no es solo PDF: también sale en Word.
      { id: "dossier", href: "/panel/dossier", etiqueta: "Dossier" },
    ],
  },
  {
    titulo: "Seguimiento",
    enlaces: [
      { id: "patrocinadores", href: "/panel/patrocinadores", etiqueta: "Patrocinadores" },
      // Hasta cuándo dura cada patrocinio y cuándo toca escribir
      // (migración 0050). Va aquí y no en "Buscar patrocinadores"
      // porque renovar no es captar: es cumplir con quien ya está.
      { id: "renovaciones", href: "/panel/renovaciones", etiqueta: "Renovaciones" },
      { id: "tareas", href: "/panel/tareas", etiqueta: "Tareas" },
    ],
  },
  {
    titulo: "Cuenta",
    enlaces: [
      { id: "suscripcion", href: "/panel/suscripcion", etiqueta: "Suscripción" },
      { id: "privacidad", href: "/panel/privacidad", etiqueta: "Privacidad" },
    ],
  },
];

/**
 * Qué apartado está abierto, mirando la dirección en vez de recibirlo
 * como dato.
 *
 * Antes cada una de las once páginas decía la suya a mano
 * (`<PanelNav activo="tareas" />`). Bastaba con copiar una página y
 * olvidarse de cambiar esa palabra para que el menú señalara a otro
 * sitio, y no había forma de que nada lo avisara.
 *
 * `/panel` es exacto a propósito: si fuera por prefijo, Inicio se
 * quedaría encendido en todas las demás, que empiezan igual.
 */
function estaAbierto(ruta: string, href: string): boolean {
  if (href === "/panel") return ruta === "/panel";
  return ruta === href || ruta.startsWith(`${href}/`);
}

const CLASES_ENLACE =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors";

function Cuenta({ valor, abierto }: { valor: number; abierto: boolean }) {
  if (valor <= 0) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
        abierto ? "bg-white text-teal-700" : "bg-red-600 text-white"
      }`}
    >
      {valor}
    </span>
  );
}

/** Ancla actual de la dirección, sin la almohadilla. */
function leerAncla(): string {
  return window.location.hash.replace("#", "");
}

function suscribirseAlAncla(avisar: () => void): () => void {
  window.addEventListener("hashchange", avisar);
  return () => window.removeEventListener("hashchange", avisar);
}

/**
 * Las ocho secciones de la ficha, colgando de "Perfil del club".
 *
 * Cuál está abierta lo manda el ancla de la dirección
 * (`/panel/perfil#equipos`), igual que en el formulario: es la única
 * fuente de la verdad, y es lo que hace que funcionen los enlaces de
 * "te falta por rellenar" que llegan desde otras páginas.
 */
function SeccionesDeLaFicha({
  perfilCreado,
  alNavegar,
}: {
  perfilCreado: boolean;
  alNavegar?: () => void;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const ancla = useSyncExternalStore(suscribirseAlAncla, leerAncla, () => "");

  const enLaFicha = ruta === "/panel/perfil";
  const activa = enLaFicha && ancla ? ancla : enLaFicha ? "identidad" : "";

  function irA(id: string) {
    return () => {
      // El formulario deja aquí su comprobación de campos sin guardar.
      if (!sePuedeSalir()) return;
      alNavegar?.();

      // Estando ya en la ficha basta con mover el ancla, que es lo que
      // el formulario escucha. Desde otra página hay que navegar.
      if (enLaFicha) window.location.hash = id;
      else router.push(`/panel/perfil#${id}`);
    };
  }

  return (
    <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-zinc-200 pl-2">
      {SECCIONES_DE_LA_FICHA.map((seccion) => {
        // Sin club guardado (nombre y localidad) solo se puede rellenar
        // la identidad: el resto necesita esa fila para guardarse.
        const bloqueada = seccion.id !== "identidad" && !perfilCreado;

        return (
          <button
            key={seccion.id}
            type="button"
            disabled={bloqueada}
            onClick={irA(seccion.id)}
            aria-current={activa === seccion.id ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              activa === seccion.id
                ? "bg-teal-50 font-semibold text-teal-800"
                : "font-medium text-zinc-500 hover:bg-zinc-100 hover:text-brand-navy"
            }`}
          >
            {seccion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

function Lista({
  sinAbrir,
  vencidas,
  renovaciones,
  paginaPublica,
  perfilCreado,
  alNavegar,
}: {
  sinAbrir: number;
  vencidas: number;
  renovaciones: number;
  paginaPublica: string | null;
  perfilCreado: boolean;
  alNavegar?: () => void;
}) {
  const ruta = usePathname();

  // Desplegado al entrar en la ficha, para no obligar a abrirlo cada
  // vez; cerrado desde cualquier otra página, donde solo estorbaría.
  const [fichaDesplegada, setFichaDesplegada] = useState(ruta === "/panel/perfil");

  return (
    <div className="flex flex-col gap-0.5">
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo ?? "inicio"}>
          {grupo.titulo && (
            /* Con fondo y no solo en gris: sobre una columna blanca, un
               título en texto pequeño se confundía con un enlace más y
               los cuatro apartados no se distinguían de un vistazo. */
            <p className="mb-1 mt-4 rounded-lg bg-teal-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
              {grupo.titulo}
            </p>
          )}

          {grupo.enlaces.map((enlace) => {
            const abierto = estaAbierto(ruta, enlace.href);
            const contador =
              enlace.id === "solicitudes"
                ? sinAbrir
                : enlace.id === "tareas"
                  ? vencidas
                  : enlace.id === "renovaciones"
                    ? renovaciones
                    : 0;

            const clases = `${CLASES_ENLACE} ${
              abierto
                ? "bg-teal-700 font-semibold text-white"
                : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-brand-navy"
            }`;

            if (enlace.desplegable) {
              return (
                <div key={enlace.id}>
                  {/* El nombre lleva a la página y la flecha abre la
                      lista: son dos cosas distintas y por eso son dos
                      botones. Pulsar "Perfil del club" abre además las
                      secciones, que es lo que se espera al entrar. */}
                  <div className={`${clases} pr-1`}>
                    <Link
                      href={enlace.href}
                      onClick={() => {
                        setFichaDesplegada(true);
                        alNavegar?.();
                      }}
                      aria-current={abierto ? "page" : undefined}
                      className="flex-1"
                    >
                      {enlace.etiqueta}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setFichaDesplegada((desplegada) => !desplegada)}
                      aria-expanded={fichaDesplegada}
                      aria-label={
                        fichaDesplegada
                          ? "Ocultar las secciones de la ficha"
                          : "Ver las secciones de la ficha"
                      }
                      className="rounded px-1.5 text-xs leading-none"
                    >
                      <span aria-hidden="true">{fichaDesplegada ? "▴" : "▾"}</span>
                    </button>
                  </div>

                  {fichaDesplegada && (
                    <SeccionesDeLaFicha perfilCreado={perfilCreado} alNavegar={alNavegar} />
                  )}
                </div>
              );
            }

            return (
              <Link
                key={enlace.id}
                href={enlace.href}
                onClick={alNavegar}
                aria-current={abierto ? "page" : undefined}
                className={clases}
              >
                {enlace.etiqueta}
                <Cuenta valor={contador} abierto={abierto} />
              </Link>
            );
          })}

          {/* La salida a la ficha tal y como la ve una empresa. Va aquí
              abajo, dentro de "Mi club", porque es lo que el club acaba
              de editar arriba: hasta ahora no había desde dónde ir a
              mirarla sin escribir la dirección a mano. */}
          {grupo.titulo === "Mi club" && paginaPublica && (
            <a
              href={paginaPublica}
              target="_blank"
              rel="noopener noreferrer"
              onClick={alNavegar}
              className={`${CLASES_ENLACE} font-medium text-zinc-500 hover:bg-zinc-100 hover:text-brand-navy`}
            >
              Ver tu página pública
              <span aria-hidden="true">↗</span>
            </a>
          )}

          {/* Cerrar sesión cierra el último apartado. Estaba suelto
              arriba a la derecha en las once páginas, lejos de todo lo
              demás que tiene que ver con la cuenta. */}
          {grupo.titulo === "Cuenta" && (
            <form action={cerrarSesion}>
              <button
                type="submit"
                className={`${CLASES_ENLACE} w-full font-medium text-zinc-600 hover:bg-zinc-100 hover:text-brand-navy`}
              >
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * El menú del panel del club.
 *
 * En el ordenador es una columna fija a la izquierda, siempre a la
 * vista. En el móvil no cabe: ahí es un botón que abre el menú entero
 * por encima de la página, y se cierra solo al pulsar cualquier enlace
 * — si no, el club se quedaba con el menú abierto tapando aquello a lo
 * que acababa de entrar.
 */
export function MenuDelPanel({
  sinAbrir,
  vencidas,
  renovaciones,
  paginaPublica,
  perfilCreado,
}: {
  sinAbrir: number;
  vencidas: number;
  renovaciones: number;
  paginaPublica: string | null;
  perfilCreado: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // Cambiar de página con el menú abierto lo deja abierto encima de la
  // nueva. Pasa al volver atrás con el botón del navegador, donde no
  // hay ninguna pulsación que lo cierre.
  //
  // Se compara aquí y no en un efecto a propósito: un efecto cerraría
  // el menú *después* de pintar la página nueva con el menú todavía
  // encima, que es justo el parpadeo que se quiere evitar.
  const [rutaPintada, setRutaPintada] = useState(ruta);
  if (ruta !== rutaPintada) {
    setRutaPintada(ruta);
    setAbierto(false);
  }

  // Con el menú abierto, lo de debajo no se desplaza: si no, al
  // arrastrar el dedo sobre el menú se movía la página del fondo.
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierto]);

  const avisos = sinAbrir + vencidas + renovaciones;

  return (
    <>
      {/* Ordenador */}
      <aside className="hidden w-60 shrink-0 lg:block">
        {/* `max-h` + `overflow-y-auto`: el menú tiene cuatro grupos y,
            con el de "Perfil del club" desplegado, pasa de lo que mide
            una pantalla de portátil. Al ser `sticky` no se desplazaba
            con la página, así que las últimas opciones —entre ellas
            "Cerrar sesión"— no había forma de alcanzarlas. Ahora el
            propio menú se desplaza por dentro.
            *
            * El 3rem son los `top-6` de arriba más el mismo hueco
            * abajo, para que no acabe pegado al borde de la ventana. */}
        <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-2">
          <Lista
            sinAbrir={sinAbrir}
            vencidas={vencidas}
            renovaciones={renovaciones}
            paginaPublica={paginaPublica}
            perfilCreado={perfilCreado}
          />
        </div>
      </aside>

      {/* Móvil */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-brand-navy"
        >
          <span aria-hidden="true" className="flex flex-col gap-[3px]">
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
          </span>
          Menú del panel
          {avisos > 0 && (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
              {avisos}
            </span>
          )}
        </button>

        {abierto && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-zinc-900/40"
              onClick={() => setAbierto(false)}
              aria-hidden="true"
            />
            <div className="relative flex h-full w-[17rem] max-w-[85%] flex-col overflow-y-auto bg-white p-3 shadow-xl">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="mb-1 self-end rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Cerrar
              </button>
              <Lista
                sinAbrir={sinAbrir}
                vencidas={vencidas}
                renovaciones={renovaciones}
                paginaPublica={paginaPublica}
                perfilCreado={perfilCreado}
                alNavegar={() => setAbierto(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
