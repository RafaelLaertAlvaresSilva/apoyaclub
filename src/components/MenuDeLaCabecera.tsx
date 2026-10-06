"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";

/**
 * El menú de la cabecera, en cualquier pantalla.
 *
 * Antes la cabecera gastaba dos filas en el móvil: arriba el logo con
 * "Entrar" y "Empezar", y debajo una tira de enlaces que se desplazaba
 * en horizontal. Dos problemas: las dos filas se comían 110 px de la
 * primera pantalla, que en un teléfono es justo donde se decide si
 * alguien se queda; y la tira que se desplaza esconde lo que no cabe
 * sin que se vea que hay más —el degradado de la derecha lo insinúa,
 * pero poco—.
 *
 * Ahora arriba solo están el logo y este botón, y todo lo demás vive
 * dentro. "Buscar clubes" va aparte y en verde, arriba del todo: es lo
 * único que puede hacer alguien que llega sin cuenta y sin saber qué es
 * esto, y el resto son páginas de presentación o cosas de quien ya
 * tiene cuenta.
 *
 * Es un componente de cliente porque hace falta estado para abrir y
 * cerrar. La cabecera que lo usa sigue siendo de servidor: le pasa los
 * enlaces ya resueltos, así que la sesión no se consulta aquí.
 */

type Enlace = { href: string; etiqueta: string };

export function MenuDeLaCabecera({
  enlaces,
  accesoDirecto,
}: {
  enlaces: readonly Enlace[];
  accesoDirecto: Enlace | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // Cambiar de página con el menú abierto lo dejaría abierto encima de
  // la nueva. Pasa al volver atrás con el botón del navegador, donde no
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
  // El Escape lo cierra, que es lo que espera quien navega con teclado.
  useEffect(() => {
    if (!abierto) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPulsarTecla);

    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierto]);

  // "Buscar clubes" sale del montón para ir arriba y en verde. Se busca
  // por `href` y no por posición porque la lista cambia según haya
  // sesión o no, y en la de dentro va en otro sitio.
  const destacado = enlaces.find((enlace) => enlace.href === "/buscar") ?? null;
  const resto = enlaces.filter((enlace) => enlace.href !== "/buscar");

  const CLASE_FILA =
    "flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3.5 text-base font-semibold text-brand-navy transition-colors hover:bg-zinc-100";

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        aria-label="Abrir el menú"
        className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-50 text-brand-navy transition-colors hover:bg-zinc-100"
      >
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
        </span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-brand-navy/50"
          />

          <div className="absolute inset-y-0 right-0 w-full max-w-xs overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-500">Menú</span>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar el menú"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl leading-none text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-brand-navy"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav aria-label="Secciones" className="flex flex-col gap-2 p-4">
              {destacado && (
                <Link
                  href={destacado.href}
                  className="flex items-center gap-3 rounded-xl bg-brand-teal-dark px-4 py-4 text-white transition-colors hover:bg-brand-navy"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 shrink-0"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <span className="min-w-0">
                    <span className="block text-base font-bold leading-tight">
                      {destacado.etiqueta}
                    </span>
                    <span className="block text-sm leading-snug text-white/80">
                      Mira qué clubes hay cerca de ti
                    </span>
                  </span>
                </Link>
              )}

              {resto.map((enlace) => (
                <Link key={enlace.href} href={enlace.href} className={CLASE_FILA}>
                  {enlace.etiqueta}
                </Link>
              ))}

              <Link href="/favoritos" className={CLASE_FILA}>
                <span>Guardados</span>
                <span aria-hidden="true" className="text-lg text-zinc-400">
                  ♡
                </span>
              </Link>
            </nav>

            {/* La cuenta, separada por una línea pero arriba, no pegada
                al fondo del cajón. Pegada abajo quedaba debajo del
                banner de cookies, que también vive ahí y en la misma
                capa: los botones estaban, pero no se veían. */}
            <div className="flex flex-col gap-2.5 border-t border-zinc-200 p-4">
              {/* `sm:hidden` en el botón verde: a partir de ahí vive
                  fuera, en la barra, y tenerlo en los dos sitios a la
                  vez es decirle dos veces lo mismo a quien abre el
                  menú. Por debajo de 640 px fuera no cabe, y entonces
                  este es el único. */}
              {accesoDirecto ? (
                <>
                  <Link
                    href={accesoDirecto.href}
                    className="rounded-xl bg-brand-teal-dark px-4 py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-brand-navy sm:hidden"
                  >
                    {accesoDirecto.etiqueta}
                  </Link>

                  {/* La salida, debajo de la entrada. En el teléfono el
                      botón verde vive aquí dentro, así que esta va con
                      él; a partir de `sm` los dos están fuera, en la
                      barra. */}
                  <span className="sm:hidden">
                    <CerrarSesionBoton ancho />
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href="/registro"
                    className="rounded-xl bg-brand-teal-dark px-4 py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-brand-navy sm:hidden"
                  >
                    Crea tu página
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-zinc-300 px-4 py-3.5 text-center text-base font-semibold text-brand-navy transition-colors hover:bg-zinc-50"
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
