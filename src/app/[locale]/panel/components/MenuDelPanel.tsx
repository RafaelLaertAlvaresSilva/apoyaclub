"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cerrarSesion } from "@/app/[locale]/actions";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cookieDelMenu } from "@/lib/menu-plegado";
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
      {
        id: "perfil",
        href: "/panel/perfil",
        etiqueta: "Perfil del club",
        desplegable: true,
      },
      // El recuento de gente en los partidos (migración 0037): de aquí
      // sale la asistencia media que enseña la ficha.
      // Con flecha, como "Perfil del club": debajo cuelga "Apuntar un
      // partido", que es a lo que se entra casi siempre y quedaba al
      // final de la página, debajo de las cifras.
      { id: "publico", href: "/panel/publico", etiqueta: "Público", desplegable: true },
      // Lo que sale de juntar la ficha con ese recuento, sin sumar
      // nada: es lo que el club enseña cuando le preguntan "¿y a cuánta
      // gente llegáis?".
      { id: "alcance", href: "/panel/alcance", etiqueta: "Alcance" },
    ],
  },
  {
    titulo: "Buscar patrocinadores",
    enlaces: [
      {
        id: "oportunidades",
        href: "/panel/oportunidades",
        etiqueta: "Oportunidades",
      },
      // La libreta de empresas a las que el club quiere escribir
      // (migración 0041). Va pegada a Oportunidades porque es el paso
      // siguiente: ya sabes qué ofreces, ahora a quién.
      {
        id: "objetivos",
        href: "/panel/objetivos",
        etiqueta: "A quién escribir",
      },
      {
        id: "solicitudes",
        href: "/panel/solicitudes",
        etiqueta: "Solicitudes",
      },
      // Ya no es solo PDF: también sale en Word.
      { id: "dossier", href: "/panel/dossier", etiqueta: "Dossier" },
    ],
  },
  {
    titulo: "Seguimiento",
    enlaces: [
      {
        id: "patrocinadores",
        href: "/panel/patrocinadores",
        etiqueta: "Patrocinadores",
      },
      // Hasta cuándo dura cada patrocinio y cuándo toca escribir
      // (migración 0050). Va aquí y no en "Buscar patrocinadores"
      // porque renovar no es captar: es cumplir con quien ya está.
      {
        id: "renovaciones",
        href: "/panel/renovaciones",
        etiqueta: "Renovaciones",
      },
      { id: "tareas", href: "/panel/tareas", etiqueta: "Tareas" },
    ],
  },
  {
    titulo: "Cuenta",
    enlaces: [
      {
        id: "suscripcion",
        href: "/panel/suscripcion",
        etiqueta: "Suscripción",
      },
      { id: "privacidad", href: "/panel/privacidad", etiqueta: "Privacidad" },
    ],
  },
];

/**
 * Los títulos de los grupos se comparan en español (`grupo.titulo ===
 * "Mi club"`) y se enseñan traducidos con esta clave.
 */
const CLAVE_DEL_GRUPO: Record<string, string> = {
  "Mi club": "miClub",
  "Buscar patrocinadores": "buscar",
  Seguimiento: "seguimiento",
  Cuenta: "cuenta",
};

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

/**
 * Cada entrada del menú es un botón con su borde, no un texto suelto.
 *
 * Antes solo se veía recuadrada la que estaba abierta, y las demás eran
 * una lista de palabras: había que leerlas para saber dónde acababa una
 * y empezaba otra. Con el borde se cuentan de un vistazo, igual que el
 * interruptor de modo oscuro de la barra de arriba.
 *
 * `border` va en las clases comunes y NO en las de cada estado: si lo
 * pusiera solo el estado apagado, al encenderse perdería los 2 px del
 * borde y la entrada daría un salto. Lo que cambia por estado es el
 * color del borde, nunca si lo lleva.
 */
const CLASES_ENLACE =
  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors";

/**
 * El icono de cada entrada (Lucide, licencia ISC). Con icono, el menú se
 * recorre con la vista sin leer, como en cualquier herramienta de
 * trabajo seria; sin él era una columna de palabras.
 */
const TRAZOS_DEL_MENU: Record<string, string> = {
  inicio:
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  perfil:
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  publico:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  alcance: "M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6",
  oportunidades:
    "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  objetivos:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  solicitudes:
    "M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  dossier: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8",
  patrocinadores:
    "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526M18 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0",
  renovaciones:
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5",
  tareas: "m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8",
  suscripcion: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2 10h20",
  privacidad: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
  verPagina: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
  salir: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function IconoMenu({ id }: { id: string }) {
  const trazo = TRAZOS_DEL_MENU[id];
  if (!trazo) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] flex-none opacity-90"
    >
      <path d={trazo} />
    </svg>
  );
}

/** El club, arriba del menú: su escudo y su nombre, para saber de un
 * vistazo en qué cuenta se está. El escudo va sobre la placa clara
 * porque muchos son letras negras sobre transparente. */
export type ClubDelMenu = { nombre: string; logoUrl: string | null };

function TarjetaDelClub({ club }: { club: ClubDelMenu }) {
  const t = useTranslations("panel.menu");
  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
      <span className="flex size-10 flex-none items-center justify-center overflow-hidden rounded-lg border border-placa-borde bg-placa">
        {club.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- el escudo lo sube el club y puede venir de cualquier tamaño
          <img src={club.logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
        ) : (
          <span className="text-base font-extrabold text-brand-navy">{club.nombre.charAt(0).toUpperCase()}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-titular">{club.nombre}</span>
        <span className="block text-xs text-zinc-500">{t("tuPanel")}</span>
      </span>
    </div>
  );
}

function Cuenta({ valor, abierto }: { valor: number; abierto: boolean }) {
  if (valor <= 0) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
        abierto ? "bg-white text-teal-700" : "bg-peligro text-sobre-color"
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
  const t = useTranslations("panel.menu");
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
    /* Sin la línea vertical que había antes: con cada sección ya
       recuadrada, el raíl al lado se leía como una segunda caja. La
       sangría sola basta para ver que cuelgan de "Perfil del club". */
    <div className="mb-1 ml-3 flex flex-col gap-1 pl-2">
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
            className={`rounded-lg border px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              activa === seccion.id
                ? "border-teal-200 bg-teal-50 font-semibold text-teal-800" : "border-zinc-200 font-medium text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-titular"
            }`}
          >
            {t(`secciones.${seccion.id}`)}
          </button>
        );
      })}
    </div>
  );
}

/** Lo que cuelga de "Público": por ahora, ir directo a apuntar un partido. */
const OPCIONES_DE_PUBLICO = [{ id: "apuntar", href: "/panel/publico#apuntar" }] as const;

function OpcionesDePublico({ alNavegar }: { alNavegar?: () => void }) {
  const t = useTranslations("panel.menu");
  const ruta = usePathname();
  const ancla = useSyncExternalStore(suscribirseAlAncla, leerAncla, () => "");

  return (
    <div className="mb-1 ml-3 flex flex-col gap-1 pl-2">
      {OPCIONES_DE_PUBLICO.map((opcion) => {
        const activa = ruta === "/panel/publico" && ancla === opcion.id;
        return (
          <Link
            key={opcion.id}
            href={opcion.href}
            onClick={() => {
              alNavegar?.();
              // Estando ya en la página, el enlace solo cambia el ancla:
              // se avisa a mano para que el formulario se abra.
              if (ruta === "/panel/publico") {
                window.setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 0);
              }
            }}
            aria-current={activa ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors ${
              activa
                ? "border-teal-200 bg-teal-50 font-semibold text-teal-800"
                : "border-zinc-200 font-medium text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-titular"
            }`}
          >
            <span aria-hidden="true" className="text-base leading-none">+</span>
            {t(`publico.${opcion.id}`)}
          </Link>
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
  const t = useTranslations("panel.menu");
  const ruta = usePathname();

  // Cada desplegable, abierto al entrar en su página para no obligar a
  // abrirlo cada vez; cerrado desde cualquier otra, donde solo estorbaría.
  const [desplegados, setDesplegados] = useState<Record<string, boolean>>({
    perfil: ruta === "/panel/perfil",
    publico: ruta === "/panel/publico",
  });
  const alternar = (id: string) => setDesplegados((antes) => ({ ...antes, [id]: !antes[id] }));

  return (
    <div className="flex flex-col gap-1.5">
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo ?? "inicio"}>
          {grupo.titulo && (
            /* Con fondo y no solo en gris: sobre una columna blanca, un
               título en texto pequeño se confundía con un enlace más y
               los cuatro apartados no se distinguían de un vistazo. */
            <p className="mb-1 mt-4 rounded-lg bg-teal-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
              {t(`grupos.${CLAVE_DEL_GRUPO[grupo.titulo] ?? "cuenta"}`)}
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

            // El borde del abierto es de SU PROPIO color: encima del
            // relleno verde, un borde gris se vería como un cerco.
            const clases = `${CLASES_ENLACE} ${
              abierto
                ? "border-accion bg-accion font-semibold text-sobre-color" : "border-zinc-200 font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-titular"
            }`;

            if (enlace.desplegable) {
              const desplegado = Boolean(desplegados[enlace.id]);
              const esFicha = enlace.id === "perfil";
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
                        setDesplegados((antes) => ({ ...antes, [enlace.id]: true }));
                        alNavegar?.();
                      }}
                      aria-current={abierto ? "page" : undefined}
                      className="flex flex-1 items-center gap-2"
                    >
                      <IconoMenu id={enlace.id} />
                      {t(`enlaces.${enlace.id}`)}
                    </Link>
                    <button
                      type="button"
                      onClick={() => alternar(enlace.id)}
                      aria-expanded={desplegado}
                      aria-label={
                        esFicha
                          ? desplegado
                            ? t("ocultarSeccionesFicha")
                            : t("verSeccionesFicha")
                          : desplegado
                            ? t("ocultarOpcionesPublico")
                            : t("verOpcionesPublico")
                      }
                      /* Un cuadrado de 32 px y no un texto con relleno:
                         antes era el carácter "▾" a 12 px, que en Windows
                         se dibuja más pequeño todavía y acababa
                         pareciendo un punto. Y como zona para pulsar,
                         un carácter de 12 px en un teléfono es imposible
                         de acertar. */
                      /* `black/10` y no `white/15`: esta fila es blanca cuando el
                         apartado está cerrado y verde oscuro cuando está
                         abierto, y un velo blanco sobre blanco no se ve.
                         Oscurecer funciona encima de los dos. */
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors hover:bg-black/10"
                    >
                      {/* Dibujada y no escrita: la flecha es la misma de
                          las otras listas desplegables de la web, se ve
                          igual en todos los sistemas y gira al abrirse,
                          que es lo que dice si está abierta o cerrada. */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-[18px] w-[18px] transition-transform duration-200 ${
                          desplegado ? "rotate-180" : ""
                        }`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {desplegado && esFicha && (
                    <SeccionesDeLaFicha
                      perfilCreado={perfilCreado}
                      alNavegar={alNavegar}
                    />
                  )}
                  {desplegado && enlace.id === "publico" && <OpcionesDePublico alNavegar={alNavegar} />}
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
                <IconoMenu id={enlace.id} />
                {t(`enlaces.${enlace.id}`)}
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
              className={`${CLASES_ENLACE} border-zinc-200 font-medium text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-titular`}
            >
              <IconoMenu id="verPagina" />
              {t("verPaginaPublica")}
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
                className={`${CLASES_ENLACE} w-full border-zinc-200 font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-titular`}
              >
                <IconoMenu id="salir" />
                {t("cerrarSesion")}
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * La flecha doble de plegar y desplegar el menú: hacia la izquierda
 * para recogerlo, hacia la derecha para sacarlo.
 */
function IconoPlegar({ haciaLaDerecha = false }: { haciaLaDerecha?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-[18px] w-[18px] flex-none ${haciaLaDerecha ? "rotate-180" : ""}`}
    >
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
    </svg>
  );
}

/**
 * El menú del panel del club.
 *
 * En el ordenador es una columna fija a la izquierda, que el club
 * puede plegar en una franja estrecha cuando quiere más ancho. En el móvil no cabe: ahí es un botón que abre el menú entero
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
  plegadoInicial = false,
  club = null,
}: {
  sinAbrir: number;
  vencidas: number;
  renovaciones: number;
  paginaPublica: string | null;
  perfilCreado: boolean;
  /** Cómo lo dejó el club la última vez (lo lee el layout de la cookie). */
  plegadoInicial?: boolean;
  /** Nombre y escudo para la tarjeta de arriba; null sin ficha creada. */
  club?: ClubDelMenu | null;
}) {
  const t = useTranslations("panel.menu");
  const [abierto, setAbierto] = useState(false);

  // Solo en el ordenador: el club puede plegar la columna para trabajar
  // con más ancho (el dossier, las tablas de patrocinadores...). Se
  // recuerda en una cookie para que siga plegado al cambiar de página
  // y al volver otro día.
  const [plegado, setPlegado] = useState(plegadoInicial);
  function cambiarPlegado(nuevo: boolean) {
    setPlegado(nuevo);
    document.cookie = cookieDelMenu(nuevo);
  }
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
      {/* Ordenador, plegado: una franja estrecha con el botón para
          volver a abrirlo. Lleva el total de avisos en rojo para que
          plegar el menú no esconda que hay solicitudes o tareas
          esperando. */}
      {plegado && (
        <aside className="hidden w-12 shrink-0 lg:block">
          <button
            type="button"
            onClick={() => cambiarPlegado(false)}
            aria-expanded={false}
            aria-label={t("mostrarMenu")}
            title={t("mostrarMenu")}
            className="sticky top-6 flex w-12 flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-1 py-3 text-titular transition-colors hover:border-zinc-300 hover:bg-zinc-100"
          >
            <IconoPlegar haciaLaDerecha />
            <span className="text-xs font-bold uppercase tracking-wider [writing-mode:vertical-rl]">
              {t("menuPlegado")}
            </span>
            {avisos > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-peligro px-1.5 py-0.5 text-xs font-bold text-sobre-color">
                {avisos}
              </span>
            )}
          </button>
        </aside>
      )}

      {/* Ordenador, abierto */}
      <aside className={plegado ? "hidden" : "hidden w-60 shrink-0 lg:block"}>
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
          <button
            type="button"
            onClick={() => cambiarPlegado(true)}
            aria-expanded={true}
            className="mb-1.5 flex w-full items-center justify-end gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-titular"
          >
            {t("ocultarMenu")}
            <IconoPlegar />
          </button>
          {club && <TarjetaDelClub club={club} />}
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
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-titular"
        >
          <span aria-hidden="true" className="flex flex-col gap-[3px]">
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
          </span>
          {t("menuDelPanel")}
          {avisos > 0 && (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-peligro px-1.5 py-0.5 text-xs font-bold text-sobre-color">
              {avisos}
            </span>
          )}
        </button>

        {abierto && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setAbierto(false)}
              aria-hidden="true"
            />
            <div className="relative flex h-full w-[17rem] max-w-[85%] flex-col overflow-y-auto bg-white p-3 shadow-xl">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="mb-1 self-end rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                {t("cerrar")}
              </button>
              {club && <TarjetaDelClub club={club} />}
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
