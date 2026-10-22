import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AvisoExito } from "@/components/AvisoError";
import { leerVisibilidadDelClub } from "@/lib/modo-pruebas";
import { createClient } from "@/lib/supabase/server";
import { cambiarVisibilidadClub } from "./actions";
import { EliminarCuentaForm } from "./components/EliminarCuentaForm";

/**
 * Visibilidad, privacidad y datos del club: si se le ve en la web
 * (migración 0055), exportar sus datos y eliminar la cuenta (Fase 11).
 */
export default async function PrivacidadClubPage({
  searchParams,
}: {
  searchParams: Promise<{ visibilidad?: string }>;
}) {
  const { visibilidad } = await searchParams;
  const t = await getTranslations("panel.privacidad");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const { modoPruebas, ocultoPorElClub } = await leerVisibilidadDelClub(supabase, user.id);

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("privacidadYDatos")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            {t("datosGuardamosClubComo")}
          </p>
        </div>
      </div>

      {visibilidad === "guardada" && <AvisoExito mensaje={t("cambioGuardado")} />}

      {/* Si se le ve en la web. Es un solo botón que dice lo que va a
          hacer, no un interruptor: un interruptor no deja claro si
          está diciendo cómo está o cómo se va a quedar. */}
      <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-zinc-900">{t("visibilidad")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">{t("visibilidadTexto")}</p>
        <p
          className={`mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium ${
            ocultoPorElClub ? "bg-zinc-100 text-zinc-700" : "bg-teal-100 text-teal-800"
          }`}
        >
          {ocultoPorElClub ? t("estadoOculto") : t("estadoVisible")}
        </p>
        {modoPruebas && <p className="mt-3 max-w-2xl text-sm text-amber-800">{t("estadoModoPruebas")}</p>}
        <form action={cambiarVisibilidadClub} className="mt-4">
          <input type="hidden" name="ocultar" value={ocultoPorElClub ? "no" : "si"} />
          <button
            type="submit"
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              ocultoPorElClub
                ? "bg-accion text-sobre-color hover:opacity-90"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {ocultoPorElClub ? t("mostrarClub") : t("ocultarClub")}
          </button>
        </form>
      </section>

      <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-6">
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
          {t("descargarDatos")}
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
        {t.rich("masInformacion", {
          enlace: (trozo) => (
            <Link href="/privacidad" className="font-medium text-teal-700 hover:underline">
              {trozo}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
