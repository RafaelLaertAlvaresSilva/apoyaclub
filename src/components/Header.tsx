import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";

/**
 * Cabecera pública compartida (Fase 1). Antes vivía copiada a mano
 * dentro de la landing y no existía en el resto de páginas públicas
 * (buscador, ficha de club, legales), que se quedaban sin forma de
 * volver al inicio o acceder. Mismo comportamiento que ya tenía la
 * landing: con sesión, enlaza directo al panel del rol; sin sesión, a
 * iniciar sesión / crear cuenta de club.
 *
 * El logo (`public/logo-full.png`) es el archivo original del
 * usuario recortado y reescalado en alta resolución, con el eslogan
 * "CONECTA · IMPULSA · CRECE" incluido. `next/image` sirve el
 * tamaño justo para cada pantalla, así que no pesa lo que pesa el
 * archivo original en `public/`.
 *
 * "Buscar clubes" es la puerta de entrada del lado empresa, que antes
 * solo existía dentro de la landing: se ve siempre, con y sin sesión, y
 * también en móvil (ahí abreviado a "Clubes" para que quepa junto al
 * botón principal).
 *
 * No se usa en /panel, /empresa ni /admin: esas zonas tienen su propia
 * navegación (PanelNav, EmpresaNav, AdminNav), ni en las páginas de
 * autenticación, que mantienen a propósito un layout mínimo sin nav.
 */
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rol = user?.app_metadata?.role as Role | undefined;
  const accesoDirecto = user && rol ? { href: RUTA_POR_ROL[rol], etiqueta: "Ir a mi panel" } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-full.png"
            alt="ApoyaClub"
            width={4275}
            height={984}
            priority
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/buscar"
            className="text-sm font-medium text-zinc-600 transition hover:text-brand-navy"
          >
            <span className="sm:hidden">Clubes</span>
            <span className="hidden sm:inline">Buscar clubes</span>
          </Link>

          {accesoDirecto ? (
            <Button href={accesoDirecto.href} size="sm">
              {accesoDirecto.etiqueta}
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-zinc-600 transition hover:text-brand-navy sm:inline"
              >
                Iniciar sesión
              </Link>
              <Button href="/registro-club" size="sm">
                <span className="sm:hidden">Empezar</span>
                <span className="hidden sm:inline">Crea la página de tu club</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
