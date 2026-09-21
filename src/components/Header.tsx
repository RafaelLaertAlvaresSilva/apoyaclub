import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";

/**
 * Cabecera pública compartida (Fase 1, reordenada en la Fase 17).
 *
 * Antes vivía copiada a mano dentro de la landing y no existía en el
 * resto de páginas públicas (buscador, ficha de club, legales), que se
 * quedaban sin forma de volver al inicio o acceder.
 *
 * La reordenación de la Fase 17 arregla cuatro cosas:
 *
 *   - Los enlaces no decían para quién eran. "Buscar clubes" y
 *     "Empresas", uno al lado del otro, son dos herramientas de dos
 *     públicos distintos: un club leía "Buscar clubes" y entendía que
 *     era para buscar OTROS clubes, y una empresa leía "Empresas" y
 *     entendía que era su puerta, cuando el directorio es justo lo
 *     contrario —quién puede ayudar a un club—. Ahora quien no ha
 *     entrado ve las dos puertas por su nombre: "Para clubes" y "Para
 *     empresas".
 *   - Navegar y las utilidades pesaban lo mismo. Cuatro enlaces grises
 *     en fila y un botón, todos del mismo tamaño y color, no son una
 *     jerarquía. Ahora la navegación va pegada al logo y lo personal
 *     —guardados, sesión— va a la derecha, más claro y detrás de una
 *     separación.
 *   - El corazón suelto en el ordenador no le decía a nadie qué había
 *     detrás. Lleva su palabra, igual que ya la llevaba en el móvil.
 *   - Los enlaces no cambiaban al entrar. Un club con la sesión abierta
 *     no necesita que le expliquen qué es ApoyaClub: ahí la cabecera
 *     enseña las herramientas (buscador y directorio) en vez de las dos
 *     páginas de presentación.
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

/**
 * Cada enlace, dentro de su recuadro.
 *
 * Eran texto suelto, y desde que la página tiene fondo la cabecera es
 * la única franja blanca de arriba: las palabras flotaban en ella sin
 * que nada dijera que se podían pulsar.
 *
 * El relleno es el mismo tono del fondo de la página, así que los
 * recuadros se leen como botones sin gritar. La jerarquía no la hace
 * la forma —todos son recuadros— sino el color: cinco en gris claro y
 * uno, el de crear la página, en verde. Un solo botón de color en una
 * cabecera se ve antes que cinco compitiendo.
 */
const CLASES_BASE_ENLACE =
  "rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100";
const CLASES_ENLACE = `${CLASES_BASE_ENLACE} text-brand-navy`;
const CLASES_UTILIDAD = `${CLASES_BASE_ENLACE} text-zinc-600 hover:text-brand-navy`;

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
        {/* Todo en una fila no cabe hasta bien entrado el escritorio: el
            logo solo ya se come 243 px, y con los tres enlaces, los
            guardados, la sesión y el botón hacen falta unos 1.050. Por
            debajo de eso los enlaces bajan a una segunda fila.
            *
            * El corte estuvo en `sm` (640 px) y ahí la fila única se
            * montaba sobre sí misma: "Guardados" salía escrito encima
            * de "Para empresas" y nadie lo veía, porque casi nunca se
            * mira a ese ancho. Pasó a `lg` (1024), y al meter los
            * enlaces en recuadros —que suman unos 120 px de relleno—
            * hubo que subirlo otra vez, a `xl` (1280). El número no es
            * decorativo: es lo que mide la fila. Si se añade un enlace
            * más, hay que volver a medir. */}
        <div className="flex items-center justify-between gap-3">
          {/* Izquierda: la marca y a dónde se puede ir. */}
          <div className="flex min-w-0 items-center gap-4 xl:gap-7">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo-full.png"
                alt="ApoyaClub"
                width={4275}
                height={984}
                priority
                className="h-10 w-auto xl:h-14"
              />
            </Link>

            <nav aria-label="Secciones" className="hidden items-center gap-1 xl:flex">
              {enlaces.map((enlace) => (
                <Link key={enlace.href} href={enlace.href} className={CLASES_ENLACE}>
                  {enlace.etiqueta}
                </Link>
              ))}
            </nav>
          </div>

          {/* Derecha: lo que es tuyo. Guardados y sesión son utilidades,
              no secciones, y por eso van más apagados y detrás de una
              línea: quien busca "para empresas" no tiene que leerlos. */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <span aria-hidden="true" className="hidden h-5 w-px bg-zinc-200 xl:block" />

            <Link href="/favoritos" className={`hidden xl:inline ${CLASES_UTILIDAD}`}>
              <span aria-hidden="true">♡</span> Guardados
            </Link>

            {accesoDirecto ? (
              <Button href={accesoDirecto.href} size="sm">
                <span className="sm:hidden">Mi panel</span>
                <span className="hidden sm:inline">{accesoDirecto.etiqueta}</span>
              </Button>
            ) : (
              <>
                {/* También en el móvil. Antes solo salía abajo del todo,
                    al final de la segunda fila, que es el último sitio
                    donde mira quien ya tiene cuenta. */}
                <Link href="/login" className={CLASES_UTILIDAD}>
                  <span className="sm:hidden">Entrar</span>
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
                <Button href="/registro-club" size="sm">
                  <span className="sm:hidden">Empezar</span>
                  <span className="hidden sm:inline">Crea tu página</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* La segunda fila, solo en el teléfono. Con el texto entero: un
            corazón suelto no le dice a nadie que ahí están sus clubes
            guardados. Se desplaza en horizontal en vez de partirse en
            dos alturas, que en un teléfono se comen la pantalla justo
            donde menos sobra. */}
        <div className="relative xl:hidden">
          <nav
            aria-label="Secciones"
            className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {enlaces.map((enlace) => (
              <Link key={enlace.href} href={enlace.href} className={`shrink-0 ${CLASES_ENLACE}`}>
                {enlace.etiqueta}
              </Link>
            ))}
            <Link href="/favoritos" className={`shrink-0 ${CLASES_ENLACE}`}>
              <span aria-hidden="true">♡</span> Guardados
            </Link>
          </nav>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent"
          />
        </div>
      </div>
    </header>
  );
}
