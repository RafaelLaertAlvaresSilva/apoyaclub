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
 */
export function BarraLogo() {
  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="Ir a la portada de ApoyaClub" className="shrink-0">
          <Image
            src="/logo-full.png"
            alt="ApoyaClub"
            width={4275}
            height={984}
            priority
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        {/* El logo ya lleva a la portada, pero no todo el mundo sabe que
            un logo se puede pulsar: el enlace lo dice con palabras. */}
        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-zinc-600 transition hover:text-brand-navy"
        >
          Volver a la portada
        </Link>
      </div>
    </div>
  );
}
