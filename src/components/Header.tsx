import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { MenuDeLaCabecera } from "@/components/MenuDeLaCabecera";

/**
 * Cabecera pública compartida.
 *
 * Antes vivía copiada a mano dentro de la landing y no existía en el
 * resto de páginas públicas (buscador, ficha de club, legales), que se
 * quedaban sin forma de volver al inicio o acceder.
 *
 * Hoy es una sola fila a cualquier ancho: el logo, un botón verde y el
 * menú. Lo que hay detrás de ese menú está en `MenuDeLaCabecera`, y la
 * razón de que esté ahí y no desplegado aquí está explicada en ese
 * archivo.
 *
 * Los enlaces cambian según haya sesión o no. Quien no ha entrado ve
 * las dos puertas por su nombre —"Para clubes" y "Para empresas"—
 * porque todavía no sabe cuál es la suya. Un club con la sesión abierta
 * no necesita que le expliquen qué es ApoyaClub: ahí salen las
 * herramientas, el buscador y el directorio de empresas.
 *
 * El logo (`public/logo-full.png`) es el archivo original del usuario
 * recortado y reescalado en alta resolución, con el eslogan
 * "CONECTA · IMPULSA · CRECE" incluido. `next/image` sirve el tamaño
 * justo para cada pantalla, así que no pesa lo que pesa el archivo
 * original en `public/`.
 *
 * No se usa en /panel, /empresa ni /admin: esas zonas tienen su propia
 * navegación (PanelNav, EmpresaNav, AdminNav), ni en las páginas de
 * autenticación, que mantienen a propósito un layout mínimo sin nav.
 */

/** Sin sesión: las dos puertas y el buscador. Nada más, porque quien
 * acaba de llegar todavía no sabe cuál de las dos es la suya y un quinto
 * enlace solo le retrasa la decisión. */
const ENLACES_DE_VISITA = [
  { href: "/para-clubes", etiqueta: "Para clubes" },
  { href: "/para-empresas", etiqueta: "Para empresas" },
  { href: "/buscar", etiqueta: "Buscar clubes" },
] as const;

/** Con sesión: las herramientas. El directorio de empresas vuelve
 * aquí —es a quién escribir, y lo mira un club que ya está dentro— sin
 * competir con "Para empresas", que a estas alturas ya sobra. */
const ENLACES_CON_SESION = [
  { href: "/buscar", etiqueta: "Buscar clubes" },
  { href: "/empresas", etiqueta: "Empresas" },
] as const;

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rol = user?.app_metadata?.role as Role | undefined;
  const accesoDirecto = user && rol ? { href: RUTA_POR_ROL[rol], etiqueta: "Ir a mi panel" } : null;
  const enlaces = accesoDirecto ? ENLACES_CON_SESION : ENLACES_DE_VISITA;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        {/* Una sola fila, a cualquier ancho: el logo a la izquierda y a
            la derecha el botón verde y el menú.
            *
            * Antes aquí se intentaba meter todo —tres enlaces, los
            * guardados, la sesión y el botón— y no cabía hasta los
            * 1.280 px. Por debajo de eso había que partirlo en dos
            * filas, y ese reparto se rompía solo cada vez que se
            * añadía un enlace: a 640 px "Guardados" llegó a salir
            * escrito encima de "Para empresas" durante semanas.
            *
            * Con todo dentro del menú ya no hay nada que medir, y la
            * cabecera ocupa lo mismo en un teléfono que en un
            * ordenador.
            *
            * Fuera se queda un solo botón, el verde: es la única cosa
            * de esta barra que no es navegar. Un botón de color solo,
            * en una barra blanca, se ve antes que cinco compitiendo. */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="min-w-0 shrink">
            <Image
              src="/logo-full.png"
              alt="ApoyaClub"
              width={4275}
              height={984}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Por debajo de 640 px no cabe junto al logo y al menú, y
                ahí vive dentro del cajón. El envoltorio lo esconde en
                vez de hacerlo el propio botón: `hidden` y el
                `inline-flex` que lleva de serie son los dos reglas de
                `display`, y cuál gana depende del orden en que Tailwind
                las escriba, no del orden en que se pongan aquí. */}
            <span className="hidden sm:block">
              <Button href={accesoDirecto ? accesoDirecto.href : "/registro"} size="sm">
                {accesoDirecto ? accesoDirecto.etiqueta : "Crea tu página"}
              </Button>
            </span>

            <MenuDeLaCabecera enlaces={enlaces} accesoDirecto={accesoDirecto} />
          </div>
        </div>

      </div>
    </header>
  );
}
