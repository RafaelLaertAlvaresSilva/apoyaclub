import { getLocale } from "next-intl/server";
import { BarraLogo } from "@/components/BarraLogo";
import { subscriptionRowToInfo, type SubscriptionRow } from "@/lib/subscription-mappers";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { AvisoSuscripcion } from "./components/AvisoSuscripcion";
import { PanelNav } from "./components/PanelNav";

/**
 * Envuelve todas las páginas de `/panel` (Fase 10) para mostrar, si
 * hace falta, un aviso del estado de la suscripción. Cada página sigue
 * haciendo su propia comprobación de sesión (el middleware ya protege
 * la ruta); este layout no redirige a nadie, solo añade el aviso
 * cuando hay una sesión de club válida.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let filaSuscripcion: SubscriptionRow | null = null;
  // La dirección de la ficha pública, para el enlace "Ver tu página
  // pública" del menú. Un club sin ficha todavía no tiene slug: ahí el
  // enlace simplemente no se pinta.
  let paginaPublica: string | null = null;

  if (user && (user.app_metadata?.role as Role | undefined) === "club") {
    const { data } = await supabase
      .from("clubs")
      .select(
        "slug, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end",
      )
      .eq("id", user.id)
      .maybeSingle<SubscriptionRow>();
    filaSuscripcion = data;
    const slug = (data as (SubscriptionRow & { slug?: string | null }) | null)?.slug;
    if (slug) paginaPublica = `/${await getLocale()}/club/${slug}`;
  }

  return (
    <>
      <BarraLogo />
      {filaSuscripcion && <AvisoSuscripcion suscripcion={subscriptionRowToInfo(filaSuscripcion)} />}

      {/* El menú vive aquí y no dentro de cada página: así las once
          páginas del panel no tienen que acordarse de ponerlo, ni de
          decir cuál es su sección (lo deduce de la dirección). */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pt-6 sm:px-6 lg:flex-row lg:gap-6">
        <PanelNav paginaPublica={paginaPublica} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </>
  );
}
