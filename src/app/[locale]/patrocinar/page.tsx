import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { datosDePatrocinio } from "./datos";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("buscar.patrocinar");
  const { locale } = await datosDePatrocinio();
  return { title: t("indiceTitulo"), description: t("indiceMeta"), alternates: { canonical: `/${locale}/patrocinar` } };
}

/** Todas las páginas de /patrocinar del país de la web: por deporte y, dentro, por zona. */
export default async function PaginaPatrocinar() {
  const t = await getTranslations("buscar.patrocinar");
  const { todas, nombreDe } = await datosDePatrocinio();
  const deportes = todas.filter((una) => !una.zona && nombreDe[una.deporte]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">{t("indiceTitulo")}</h1>
          <p className="mt-2 max-w-3xl text-zinc-600">{t("indiceTexto")}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {deportes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
            {t("sinClubes")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {deportes.map((deporte) => (
              <section key={deporte.deporte} className="rounded-xl border border-zinc-200 bg-white p-4">
                <h2 className="font-semibold text-zinc-900">
                  <Link href={`/patrocinar/${deporte.deporte}`} className="hover:underline">
                    {t("h1Deporte", { deporte: nombreDe[deporte.deporte] })}
                  </Link>{" "}
                  <span className="text-sm font-normal text-zinc-500">({t("clubes", { n: deporte.clubes })})</span>
                </h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {todas
                    .filter((una) => una.deporte === deporte.deporte && una.zona)
                    .map((una) => (
                      <li key={una.zona}>
                        <Link
                          href={`/patrocinar/${una.deporte}/${una.zona}`}
                          className="inline-block rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:border-accion-tinta"
                        >
                          {una.nombreZona} ({una.clubes})
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
