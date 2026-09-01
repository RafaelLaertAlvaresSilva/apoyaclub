import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { EliminarCuentaForm } from "./components/EliminarCuentaForm";

/** Privacidad y datos del club (Fase 11): exportar y eliminar la cuenta. */
export default async function PrivacidadClubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Privacidad y datos</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="privacidad" />

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Descargar mis datos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Descarga un archivo con todos los datos de tu cuenta: perfil del club, equipos,
          patrocinadores, oportunidades, dossier, solicitudes de contacto recibidas y el
          registro de tus consentimientos.
        </p>
        <a
          href="/panel/exportar"
          className="mt-4 inline-block rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Descargar mis datos (JSON)
        </a>
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Eliminar mi cuenta</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Elimina de forma permanente tu cuenta y todos los datos asociados. Esta acción no
          se puede deshacer.
        </p>
        <div className="mt-4">
          <EliminarCuentaForm />
        </div>
      </section>

      <p className="text-xs text-zinc-400">
        Más información sobre cómo tratamos tus datos en nuestra{" "}
        <a href="/privacidad" className="font-medium text-teal-700 hover:underline">
          Política de Privacidad
        </a>
        .
      </p>
    </div>
  );
}
