import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

/**
 * Barra fina con el logo, para las zonas que no llevan la cabecera
 * pública: el panel del club, el de la empresa, el de administración,
 * las páginas de acceso y las de aviso.
 *
 * Hasta ahora, un club que entraba en su panel se quedaba sin ninguna
 * forma de volver a la portada: ni logo, ni enlace, ni nada. La única
 * salida era editar la dirección a mano o darle al atrás del navegador.
 *
 * Es distinta de `Header` a propósito. Aquella lleva los botones de
 * captación ("Crea la página de tu club"), que no pintan nada delante de
 * alguien que ya tiene su cuenta abierta. Esta solo lleva el logo y la
 * salida a la portada.
 *
 * No consulta la sesión ni ninguna otra cosa: así se puede poner en
 * cualquier página sin arrastrarla a renderizarse en cada visita.
 *
 * `extra` es para el panel, que mete ahí su interruptor de modo
 * oscuro. Las demás zonas que usan esta barra (empresa, administración,
 * acceso) no tienen modo oscuro y no le pasan nada.
 */
export function BarraLogo({ extra }: { extra?: ReactNode }) {
  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          aria-label="Ir a la portada de ApoyaClub"
          className="shrink-0"
        >
          {/*
            DOS LOGOS, NO UNO. El de siempre lleva un fondo blanco pegado
            —es un PNG sin transparencia—, así que sobre la barra oscura
            del panel salía un cuadrado blanco alrededor. El de la
            versión oscura es el mismo logo con su resplandor y SÍ tiene
            transparencia, así que no enseña caja ninguna.

            Se pintan los dos y el CSS esconde el que no toca, en vez de
            cambiar la dirección de la imagen desde JavaScript: así el
            logo correcto ya viene en el HTML y no hay ni un parpadeo al
            entrar.

            Las dos imágenes miden EXACTAMENTE lo mismo (950 × 210), y
            no por casualidad: al oscuro se le recortó el halo más flojo
            y luego se rellenaron los lados, porque su resplandor hacía
            que a la misma altura el logo pareciera un tercio más
            pequeño que el claro. Así la barra no se mueve al cambiar de
            modo ni el logo cambia de tamaño.
          */}
          <Image
            src="/logo-full-claro.webp"
            alt="ApoyaClub"
            width={950}
            height={210}
            priority
            className="logo-claro h-10 w-auto sm:h-12"
          />
          <Image
            src="/logo-full-oscuro.webp"
            alt="ApoyaClub"
            width={950}
            height={210}
            priority
            className="logo-oscuro h-10 w-auto sm:h-12"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          {extra}

          {/* El logo ya lleva a la portada, pero no todo el mundo sabe
              que un logo se puede pulsar: el enlace lo dice con
              palabras. */}
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-zinc-600 transition hover:text-titular"
          >
            Volver a la portada
          </Link>
        </div>
      </div>
    </div>
  );
}
