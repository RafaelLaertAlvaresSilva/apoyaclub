import { getLocale } from "next-intl/server";
import { BarraLogo } from "@/components/BarraLogo";
import {
  subscriptionRowToInfo,
  type SubscriptionRow,
} from "@/lib/subscription-mappers";
import { leerVisibilidadDelClub } from "@/lib/modo-pruebas";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { AvisoModoPruebas, AvisoOcultoPorElClub } from "./components/AvisoModoPruebas";
import { AvisoSuscripcion } from "./components/AvisoSuscripcion";
import { PanelNav } from "./components/PanelNav";
import { InterruptorDeTema } from "./components/InterruptorDeTema";

/**
 * Envuelve todas las páginas de `/panel` (Fase 10) para mostrar, si
 * hace falta, un aviso del estado de la suscripción. Cada página sigue
 * haciendo su propia comprobación de sesión (el middleware ya protege
 * la ruta); este layout no redirige a nadie, solo añade el aviso
 * cuando hay una sesión de club válida.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let filaSuscripcion: SubscriptionRow | null = null;
  // La dirección de la ficha pública, para el enlace "Ver tu página
  // pública" del menú. Un club sin ficha todavía no tiene slug: ahí el
  // enlace simplemente no se pinta.
  let paginaPublica: string | null = null;
  // Si el club ya ha guardado nombre y localidad. Sin esa fila, en la
  // ficha solo se puede rellenar la identidad, y el menú tiene que
  // enseñar el resto de secciones apagadas en vez de dejar pulsarlas.
  let perfilCreado = false;
  // Modo de pruebas (0053, lo pone el admin) u oculto por el propio
  // club (0055): usa su panel, pero no se ve en público. Su página daría
  // "no encontrada", así que el enlace a ella se quita y en su lugar
  // sale un aviso arriba.
  let modoPruebas = false;
  let ocultoPorElClub = false;

  if (user && (user.app_metadata?.role as Role | undefined) === "club") {
    const { data } = await supabase
      .from("clubs")
      .select(
        "slug, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end",
      )
      .eq("id", user.id)
      .maybeSingle<SubscriptionRow>();
    filaSuscripcion = data;
    const slug = (data as (SubscriptionRow & { slug?: string | null }) | null)
      ?.slug;
    perfilCreado = data != null;
    if (perfilCreado) ({ modoPruebas, ocultoPorElClub } = await leerVisibilidadDelClub(supabase, user.id));
    if (slug && !modoPruebas && !ocultoPorElClub) paginaPublica = `/${await getLocale()}/club/${slug}`;
  }

  return (
    /*
     * `tema-panel` es el interruptor del modo oscuro, y vive aquí a
     * propósito: solo el panel se pone oscuro. La página pública del
     * club es el escaparate que ve una empresa, de día y en su
     * oficina, y esa se queda clara siempre.
     *
     * Lleva su propio fondo (`bg-zinc-50`, que dentro de la envoltura
     * ya es el gris carbón) y `min-h-dvh` porque el fondo del `body`
     * lo pinta el layout de arriba, que es el mismo para toda la web:
     * sin esto, una pantalla corta dejaría ver una franja clara por
     * debajo.
     */
    <div className="tema-panel flex min-h-dvh flex-1 flex-col bg-zinc-50">
      <BarraLogo extra={<InterruptorDeTema />} />
      {modoPruebas ? <AvisoModoPruebas /> : ocultoPorElClub && <AvisoOcultoPorElClub />}
      {filaSuscripcion && (
        <AvisoSuscripcion
          suscripcion={subscriptionRowToInfo(filaSuscripcion)}
        />
      )}

      {/* El menú vive aquí y no dentro de cada página: así las once
          páginas del panel no tienen que acordarse de ponerlo, ni de
          decir cuál es su sección (lo deduce de la dirección). */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pt-6 sm:px-6 lg:flex-row lg:gap-6">
        <PanelNav paginaPublica={paginaPublica} perfilCreado={perfilCreado} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
