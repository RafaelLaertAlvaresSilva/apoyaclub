import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { calcularAlcance } from "@/lib/alcance";
import { LOCALE_CONFIG } from "@/config/locales";
import { reunirDatosDeAlcance } from "@/lib/alcance-datos";
import { formatearNumero } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { AvisoDeOrigen, Bloque, Cifra } from "./components/BloquesDeAlcance";

/**
 * El informe de alcance del club.
 *
 * Un club de barrio sabe que llega a mucha gente y no sabe decirlo. Lo
 * que hace casi todo el mundo es sumar: 120 jugadores + 150 familias +
 * 800 seguidores = "llegamos a 1.070 personas". El padre que está en el
 * partido es una de esas 150 familias y además sigue al club en
 * Instagram: se le ha contado tres veces, y la primera empresa que lo
 * note deja de creerse también lo que sí era cierto.
 *
 * Así que aquí no se suma nada. Cada cifra sale marcada con de dónde
 * viene, y la única cuenta que se hace va escrita entera debajo.
 *
 * Esta página es para el club. Las mismas cifras, calculadas por el
 * mismo sitio (`lib/alcance.ts`), son las que salen en la sección de
 * audiencia del dossier que verá la empresa.
 */
export default async function AlcancePage() {
  const t = await getTranslations("panel.alcance");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = (await getLocale()) as AppLocale;
  if (!user) return redirect({ href: "/login", locale });

  const datos = await reunirDatosDeAlcance(supabase, user.id);
  const informe = calcularAlcance(
    datos,
    await getTranslations("panel.alcance.informe"),
    LOCALE_CONFIG[locale].intlLocale,
  );

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("alcanceClub")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            {t("cuantaGenteLlegasDicho")}
          </p>
        </div>
      </div>


      {informe.titular && (
        <section className="rounded-2xl border border-teal-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-700">
            {t("siTuvierasDecirSola")}
          </p>
          <div className="mt-3 max-w-md">
            <Cifra cifra={informe.titular} locale={locale} grande />
          </div>
        </section>
      )}

      {informe.comparacion && (
        <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold text-zinc-900">{t("comparadoTemporadaPasada")}</h2>
          <p className="mt-2 text-sm text-zinc-700">
            {t.rich("comparacion", {
              antes: formatearNumero(informe.comparacion.mediaAnterior, locale),
              temporadaAntes: informe.comparacion.temporadaAnterior,
              ahora: formatearNumero(informe.comparacion.mediaActual, locale),
              temporadaAhora: informe.comparacion.temporadaActual,
              signo: informe.comparacion.diferencia >= 0 ? "+" : "−",
              diferencia: formatearNumero(Math.abs(informe.comparacion.diferencia), locale),
              porcentaje: Math.abs(informe.comparacion.porcentaje),
              fuerte: (trozo) => (
                <strong
                  className={informe.comparacion!.diferencia >= 0 ? "text-teal-700" : "text-zinc-900"}
                >
                  {trozo}
                </strong>
              ),
            })}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {t("estoHacePatrocinadorRenueve")}
          </p>
        </section>
      )}

      {informe.bloques.map((bloque) => (
        <Bloque key={bloque.id} bloque={bloque} locale={locale} />
      ))}

      {informe.hayCifras && (
        <div className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-5">
          <AvisoDeOrigen />
          <p className="mt-2 text-sm text-zinc-600">
            {t.rich("mismasCifras", {
              enlace: (trozo) => (
                <Link href="/panel/dossier" className="font-medium text-teal-700 underline">
                  {trozo}
                </Link>
              ),
            })}
          </p>
        </div>
      )}

      {informe.faltan.length > 0 && (
        <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {informe.hayCifras ? t("teFaltaParaSirve") : t("dondeEmpezar")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            {informe.hayCifras
              ? t("nadaEstoObligatorioCada") : t("fichaTodaviaNoTiene")}
          </p>

          <ul className="mt-4 space-y-3">
            {informe.faltan.map((falta) => (
              <li
                key={falta.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{falta.que}</p>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-600">{falta.porQue}</p>
                </div>
                <Link
                  href={falta.ruta}
                  className="shrink-0 rounded-lg bg-accion px-3 py-1.5 text-center text-sm font-medium text-sobre-color hover:bg-accion-fuerte"
                >
                  {falta.rutaEtiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
