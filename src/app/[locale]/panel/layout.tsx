import { BarraLogo } from "@/components/BarraLogo";
import { subscriptionRowToInfo, type SubscriptionRow } from "@/lib/subscription-mappers";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { AvisoSuscripcion } from "./components/AvisoSuscripcion";

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

  if (user && (user.app_metadata?.role as Role | undefined) === "club") {
    const { data } = await supabase
      .from("clubs")
      .select(
        "stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end",
      )
      .eq("id", user.id)
      .maybeSingle<SubscriptionRow>();
    filaSuscripcion = data;
  }

  return (
    <>
      <BarraLogo />
      {filaSuscripcion && <AvisoSuscripcion suscripcion={subscriptionRowToInfo(filaSuscripcion)} />}
      {children}
    </>
  );
}
