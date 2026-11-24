import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { grafoDePreguntas } from "@/lib/datos-estructurados";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { formatoDeValor } from "@/lib/format";
import type { ClubDePatrocinio, Combinacion } from "@/lib/patrocinar";

/**
 * Lo que enseñan /patrocinar/<deporte> y /patrocinar/<deporte>/<zona>
 * (`lib/patrocinar.ts`): el título que busca la empresa en Google, los
 * clubes con lo que ofrecen, por qué patrocinar y enlaces a las páginas
 * de al lado (otras zonas del mismo deporte, otros deportes de la zona),
 * que es lo que hace que Google las encuentre todas.
 */
export async function PaginaDePatrocinio({
  locale,
  deporte,
  nombreDeporte,
  zona,
  nombreZona,
  clubes,
  otrasZonas,
  otrosDeportes,
  nombreDe,
  deporteEnBuscador,
}: {
  locale: AppLocale;
  deporte: string;
  /** En minúscula y en el idioma de la página: "fútbol". */
  nombreDeporte: string;
  zona: string | null;
  nombreZona: string | null;
  clubes: ClubDePatrocinio[];
  otrasZonas: Combinacion[];
  otrosDeportes: Combinacion[];
  /** El nombre de otro deporte, para los enlaces. */
  nombreDe: Record<string, string>;
  /** Como lo guarda la base de datos ("Fútbol"), para el filtro del buscador. */
  deporteEnBuscador: string;
}) {
  const t = await getTranslations("buscar.patrocinar");
  const buscarHref = {
    pathname: "/buscar",
    query: {
      deporte: deporteEnBuscador,
      ...(nombreZona ? { provincia: nombreZona } : {}),
      busca: "patrocinios",
    },
  };

  // Cómo se patrocina y tres preguntas de quien llega desde Google
  // (auditoría SEO, nov 2026): con uno o dos clubes la página se quedaba
  // en unas 300 palabras, poco para que Google la tome en serio. Las
  // preguntas van también marcadas para Google y las IA.
  const pasos = [1, 2, 3].map((n) => ({
    titulo: t(`como${n}Titulo`),
    texto: t(`como${n}Texto`),
  }));
  const preguntas = [1, 2, 3].map((n) => ({
    pregunta: t(`faq${n}P`, { deporte: nombreDeporte }),
    respuesta: t(`faq${n}R`),
  }));

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <DatosEstructurados datos={grafoDePreguntas(preguntas)} />
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            {nombreZona
              ? t("h1Zona", { deporte: nombreDeporte, zona: nombreZona })
              : t("h1Deporte", { deporte: nombreDeporte })}
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-600">{t("intro", { n: clubes.length })}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={buscarHref}
              className="rounded-lg bg-accion px-4 py-2 text-sm font-medium text-sobre-color hover:bg-accion-fuerte"
            >
              {t("verOportunidades")}
            </Link>
            <Link
              href="/registro-empresa"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t("publicar")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {clubes.map((club) => {
            const precio = formatoDeValor(locale, club.country);
            return (
              <li key={club.id} className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                {club.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo ya subido por el club
                  <img src={club.logoUrl} alt="" className="h-14 w-14 flex-none rounded-lg object-contain" />
                ) : (
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-700">
                    {club.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-zinc-900">
                    <Link href={`/club/${club.slug}`} className="hover:underline">
                      {club.name}
                    </Link>
                  </h2>
                  <p className="text-xs text-zinc-500">{[club.city, club.province].filter(Boolean).join(", ")}</p>
                  {club.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{club.description}</p>
                  )}
                  <p className="mt-2 text-sm font-medium text-teal-700">
                    {t("oportunidades", { n: club.oportunidades })}
                    {club.desde != null && ` · ${t("desde", { precio: precio.format(club.desde) })}`}
                  </p>
                  <Link
                    href={`/club/${club.slug}`}
                    className="mt-2 inline-block text-sm font-medium text-accion-tinta hover:underline"
                  >
                    {t("verClub")} →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <section className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-5">
          <h2 className="font-semibold text-teal-950">{t("porQueTitulo", { deporte: nombreDeporte })}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900">
            <li>{t("porQue1")}</li>
            <li>{t("porQue2")}</li>
            <li>{t("porQue3")}</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900">{t("comoTitulo", { deporte: nombreDeporte })}</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {pasos.map((paso, i) => (
              <li key={paso.titulo} className="rounded-xl border border-zinc-200 bg-white p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                  {i + 1}
                </span>
                <h3 className="mt-2 font-semibold text-zinc-900">{paso.titulo}</h3>
                <p className="mt-1 text-sm text-zinc-600">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900">{t("faqTitulo")}</h2>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {preguntas.map((p) => (
              <details key={p.pregunta} className="group p-4">
                <summary className="cursor-pointer font-medium text-zinc-900">{p.pregunta}</summary>
                <p className="mt-2 text-sm text-zinc-600">{p.respuesta}</p>
              </details>
            ))}
          </div>
        </section>

        {(otrasZonas.length > 0 || otrosDeportes.length > 0 || zona) && (
          <nav className="mt-8 grid gap-6 sm:grid-cols-2">
            {(otrasZonas.length > 0 || zona) && (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{t("otrasZonas", { deporte: nombreDeporte })}</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {zona && (
                    <li>
                      <Link
                        href={`/patrocinar/${deporte}`}
                        className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-700 hover:border-accion-tinta"
                      >
                        {t("todoElDeporte", { deporte: nombreDeporte })}
                      </Link>
                    </li>
                  )}
                  {otrasZonas.map((otra) => (
                    <li key={otra.zona}>
                      <Link
                        href={`/patrocinar/${deporte}/${otra.zona}`}
                        className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-700 hover:border-accion-tinta"
                      >
                        {otra.nombreZona} ({otra.clubes})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {otrosDeportes.length > 0 && nombreZona && (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{t("otrosDeportes", { zona: nombreZona })}</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {otrosDeportes.map((otro) => (
                    <li key={otro.deporte}>
                      <Link
                        href={`/patrocinar/${otro.deporte}/${otro.zona}`}
                        className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-700 hover:border-accion-tinta"
                      >
                        {nombreDe[otro.deporte] ?? otro.deporte} ({otro.clubes})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
