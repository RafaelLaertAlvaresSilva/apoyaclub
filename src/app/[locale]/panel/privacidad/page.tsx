import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { EliminarCuentaForm } from "./components/EliminarCuentaForm";

/** Privacidad y datos del club (Fase 11): exportar y eliminar la cuenta. */
export default async function PrivacidadClubPage() {
  const t = await getTranslations("panel.privacidad");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("privacidadYDatos")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Qué datos guardamos de tu club, cómo descargarlos y cómo borrar la cuenta. Nada de esto depende de que estés al día con el pago.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="privacidad" />

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">{t("descargarMisDatos")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("descargaUnArchivoCon")}</p>
        {/* Descarga de un fichero servido por un Route Handler, no una
            navegación entre páginas: aquí <a> es lo correcto (con <Link>
            Next.js precargaría la exportación entera al pasar el ratón). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/panel/exportar"
          className="mt-4 inline-block rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Descargar mis datos (JSON)
        </a>
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">{t("eliminarMiCuenta")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("eliminaDeFormaPermanente")}</p>
        <div className="mt-4">
          <EliminarCuentaForm />
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Más información sobre cómo tratamos tus datos en nuestra{" "}
        <Link href="/privacidad" className="font-medium text-teal-700 hover:underline">{t("politicaDePrivacidad")}</Link>
        .
      </p>
    </div>
  );
}
