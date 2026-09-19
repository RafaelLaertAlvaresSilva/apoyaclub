import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { calcularAlcance, cifrasDelInforme } from "@/lib/alcance";
import { reunirDatosDeAlcance } from "@/lib/alcance-datos";
import { deportesDelClub } from "@/lib/dossier";
import type { DatosDelClub } from "@/lib/plantillas-correo-club";
import { hoyParaElFormulario } from "@/lib/publico-partidos";
import { obtenerProspectosDelClub } from "@/lib/prospectos-datos";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { ListaDeObjetivos } from "./components/ListaDeObjetivos";

/**
 * A quién escribir (migración 0041).
 *
 * El club ya tiene página, oportunidades y cartel. Y entonces se sienta
 * y no sabe por dónde empezar: esa es la pared de verdad. Aquí apunta a
 * quién quiere llamar, de dónde sale ese nombre y cuándo volver a
 * intentarlo.
 *
 * No hay ninguna lista de empresas comprada ni sacada de ningún sitio:
 * el club escribe a quien ya conoce, que además es quien más
 * probabilidades tiene de decirle que sí.
 */
export default async function ObjetivosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const locale = await getLocale();

  const [prospectos, datosDeAlcance, { data: dossier }] = await Promise.all([
    obtenerProspectosDelClub(supabase, user.id),
    reunirDatosDeAlcance(supabase, user.id),
    supabase
      .from("club_dossiers")
      .select("share_enabled, share_token")
      .eq("club_id", user.id)
      .maybeSingle<{ share_enabled: boolean | null; share_token: string | null }>(),
  ]);

  // Con lo que se escriben los correos. Se calcula aquí, en el
  // servidor, y viaja ya masticado: el generador no toca la base de
  // datos, así que se puede probar entero sin levantar nada.
  const { perfil, equipos } = datosDeAlcance;
  const cifras = cifrasDelInforme(calcularAlcance(datosDeAlcance));
  const cifra = (id: string) => cifras.find((una) => una.id === id)?.valor ?? null;

  const deportes = deportesDelClub(equipos);

  const club: DatosDelClub = {
    nombre: perfil?.name ?? "tu club",
    localidad: perfil?.city ?? null,
    deporte: deportes[0]?.toLocaleLowerCase("es") ?? null,
    jugadores: cifra("jugadores"),
    familias: cifra("familias"),
    socios: cifra("socios"),
    publicoMedio: cifra("publicoMedio"),
    urlFicha: perfil?.slug ? `${SITE_URL}/${locale}/club/${perfil.slug}` : SITE_URL,
    urlDossier:
      dossier?.share_enabled && dossier.share_token
        ? `${SITE_URL}/${locale}/dossier/${dossier.share_token}`
        : null,
    firmante: perfil?.contactName ?? null,
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">A quién escribir</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Tu lista de empresas: a quién queréis llamar, quién de vuestra gente las conoce y cuándo
            toca volver a intentarlo. Lo que se pierde casi siempre no es un &quot;no&quot;, es un
            &quot;llámame en septiembre&quot; que nadie apuntó.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="objetivos" />

      <ListaDeObjetivos prospectos={prospectos} hoy={hoyParaElFormulario()} club={club} />
    </div>
  );
}
