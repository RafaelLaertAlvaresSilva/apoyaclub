import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { permanentRedirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { GUIAS, NOMBRE_CATEGORIA, hayGuiasEn, type CategoriaDeGuia } from "@/lib/guias";
import { FondoDeHeroe } from "../components/secciones";
import { TarjetaDeGuia } from "./components/TarjetaDeGuia";

/**
 * El índice de las guías: la más reciente en grande y el resto por tema.
 *
 * "Próximamente" enseña los temas que vienen, para que quien llega vea
 * que la sección está viva y tenga un motivo para volver. Cuando una
 * guía se publica, se quita de esa lista.
 */
export const metadata: Metadata = {
  title: { absolute: "Guías de patrocinio deportivo para clubes y empresas | ApoyaClub" },
  description:
    "Guías prácticas para conseguir patrocinadores para tu club deportivo y para que las empresas patrocinen al club de su zona: pasos, ejemplos, ideas y errores que evitar.",
};

const PROXIMAMENTE: { categoria: CategoriaDeGuia; titulo: string }[] = [
  { categoria: "ideas", titulo: "Más de 50 ideas de patrocinio para clubes deportivos" },
  { categoria: "clubes", titulo: "Cómo hacer un dossier de patrocinio deportivo (con ejemplo)" },
  { categoria: "empresas", titulo: "Por qué patrocinar al club deportivo de tu barrio" },
  { categoria: "clubes", titulo: "Cómo pedir patrocinio por correo: modelos para copiar" },
];

export default async function IndiceDeGuias() {
  const locale = await getLocale();
  if (!hayGuiasEn(locale)) permanentRedirect("/es/guias");

  const [destacada, ...resto] = GUIAS;
  const categorias = Object.keys(NOMBRE_CATEGORIA) as CategoriaDeGuia[];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <main id="contenido" className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <FondoDeHeroe archivo="/fondo-clubes.webp" tono="claro" velo="fuerte" />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold uppercase tracking-wide text-accion-tinta">
              Guías de ApoyaClub
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-titular sm:text-5xl">
              Patrocinio deportivo, explicado paso a paso
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-700">
              Guías prácticas para que los clubes consigan y cuiden a sus patrocinadores, y para que las empresas
              descubran lo que el club de su zona puede hacer por ellas. Con ejemplos reales y sin rodeos.
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
              {categorias.map((c) => (
                <li key={c} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                  {NOMBRE_CATEGORIA[c]}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            {destacada && <TarjetaDeGuia guia={destacada} destacada />}

            {resto.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {resto.map((g) => (
                  <TarjetaDeGuia key={g.slug} guia={g} />
                ))}
              </div>
            )}

            <div className="mt-16">
              <h2 className="text-2xl font-extrabold tracking-tight text-titular">Próximamente</h2>
              <p className="mt-2 text-zinc-600">Publicamos una guía nueva cada semana.</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {PROXIMAMENTE.map((p) => (
                  <li key={p.titulo} className="flex items-start gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5">
                    <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                      ✍️
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {NOMBRE_CATEGORIA[p.categoria]}
                      </span>
                      <span className="mt-1 block font-semibold leading-snug text-zinc-700">{p.titulo}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-brand-navy-dark px-4 py-16 text-center text-sobre-color sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">¿Llevas un club deportivo?</h2>
            <p className="mt-4 text-lg leading-relaxed text-sobre-color/75">
              ApoyaClub te ayuda a poner en práctica estas guías: página del club, oportunidades de patrocinio, un dossier
              para cada empresa y el seguimiento de cada patrocinador.
            </p>
            <Link
              href="/6mesesgratis?a=GUIA"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accion px-8 text-lg font-bold text-sobre-color hover:bg-accion-fuerte"
            >
              Empieza con 6 meses gratis
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
