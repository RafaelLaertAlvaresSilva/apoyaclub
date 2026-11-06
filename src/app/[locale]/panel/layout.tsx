import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BarraLogo } from "@/components/BarraLogo";
import {
  subscriptionRowToInfo,
  type SubscriptionRow,
} from "@/lib/subscription-mappers";
import { COOKIE_MENU_PLEGADO, estaPlegado } from "@/lib/menu-plegado";
import { leerVisibilidadDelClub } from "@/lib/modo-pruebas";
import { createClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/i18n/routing";
import { paisDeLaCuenta, type Pais } from "@/lib/paises";
import type { Role } from "@/lib/types";
import { AvisoModoPruebas, AvisoOcultoPorElClub } from "./components/AvisoModoPruebas";
import { PaisDelClubProvider } from "@/components/PaisDelClub";
import { AvisoIdiomaDelPais } from "./components/AvisoIdiomaDelPais";
import { AvisoSuscripcion } from "./components/AvisoSuscripcion";
import { PanelNav } from "./components/PanelNav";
import { InterruptorDeTema } from "./components/InterruptorDeTema";

/**
 * El panel no se deja traducir con el traductor del navegador. Es un
 * formulario detrás de otro, y el traductor cambia el texto por debajo
 * de React: al guardar, React no encuentra lo que pintó y la página se
 * rompe ("No hemos podido cargar esta página"). Le pasó a un club de
 * Brasil el 5-11-2026. El panel ya está en cuatro idiomas; a quien lo
 * usa en otro que no es el de su país se le ofrece el suyo
 * (`AvisoIdiomaDelPais`).
 */
export const metadata: Metadata = {
  other: { google: "notranslate" },
};

/** El idioma de la web de cada país, cuando no es el español. */
const IDIOMA_DEL_PAIS: Partial<Record<Pais, AppLocale>> = { BR: "br", PT: "pt" };

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
  // "no encontrada", así que el enlace lleva a la vista previa y además
  // sale un aviso arriba.
  let modoPruebas = false;
  let ocultoPorElClub = false;
  // El idioma de su país, si está usando el panel en otro.
  let idiomaSugerido: AppLocale | null = null;
  // Su país, para la moneda de sus precios en todo el panel.
  let paisDelClub: Pais | null = null;

  const locale = (await getLocale()) as AppLocale;

  if (user && (user.app_metadata?.role as Role | undefined) === "club") {
    paisDelClub = paisDeLaCuenta(user.app_metadata);
    const delPais = IDIOMA_DEL_PAIS[paisDelClub];
    if (delPais && delPais !== locale) idiomaSugerido = delPais;
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
    // Si no se ve en público, el enlace lleva a la vista previa, que
    // solo ve el club: la página pública daría "no encontrada".
    if (slug) {
      paginaPublica =
        !modoPruebas && !ocultoPorElClub ? `/${locale}/club/${slug}` : `/${locale}/vista-previa`;
    }
  }

  // Si el club dejó el menú plegado la última vez, llega ya plegado.
  const menuPlegado = estaPlegado((await cookies()).get(COOKIE_MENU_PLEGADO)?.value);
  // Escrito en el idioma que se le ofrece, que es el que entiende.
  const tIdioma = idiomaSugerido
    ? await getTranslations({ locale: idiomaSugerido, namespace: "panel.idiomaDelPais" })
    : null;

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
    <div translate="no" className="tema-panel flex min-h-dvh flex-1 flex-col bg-zinc-50">
      <BarraLogo extra={<InterruptorDeTema />} />
      {idiomaSugerido && tIdioma && (
        <AvisoIdiomaDelPais idioma={idiomaSugerido} texto={tIdioma("texto")} boton={tIdioma("boton")} />
      )}
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
        <PanelNav paginaPublica={paginaPublica} perfilCreado={perfilCreado} plegado={menuPlegado} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PaisDelClubProvider pais={paisDelClub}>{children}</PaisDelClubProvider>
        </div>
      </div>
    </div>
  );
}
