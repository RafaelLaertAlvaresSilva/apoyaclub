import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { hoyParaElFormulario } from "@/lib/publico-partidos";
import { obtenerProspectosDelClub } from "@/lib/prospectos-datos";
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
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const prospectos = await obtenerProspectosDelClub(supabase, user.id);

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

      <ListaDeObjetivos prospectos={prospectos} hoy={hoyParaElFormulario()} />
    </div>
  );
}
