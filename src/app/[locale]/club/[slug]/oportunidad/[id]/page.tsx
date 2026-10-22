import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { formatoDeValor } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { beneficioEnTexto } from "@/lib/ficha-oportunidad";
import { esPorPlazas } from "@/lib/opportunities";
import { SITE_URL } from "@/lib/site";
import { CompartirBoton } from "../../components/CompartirBoton";
import { FichaDeOportunidad } from "../../components/FichaDeOportunidad";
import { FotosDeLaOportunidad } from "../../components/FotosDeLaOportunidad";
import { ImprimirBoton } from "../../components/ImprimirBoton";
import { PieDeLaFichaImpresa } from "../../components/PieDeLaFichaImpresa";
import { SolicitarContactoBoton } from "../../components/SolicitarContactoBoton";
import { obtenerClubPublico } from "../../data";

export const revalidate = 60;

/** La oportunidad dentro de su club, o null. Se busca a través del club
 * y no por su id suelto: así hereda las condiciones de visibilidad de
 * la ficha pública, y una oportunidad de un club sin publicar no se ve
 * por tener su enlace. */
async function buscar(slug: string, id: string) {
  const datos = await obtenerClubPublico(slug);
  if (!datos) return null;

  const oportunidad = datos.oportunidades.find((una) => una.id === id);
  return oportunidad ? { ...datos, oportunidad } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const encontrado = await buscar(slug, id);

  const tp = await getTranslations("club.oportunidadPagina");
  if (!encontrado) return { title: `${tp("noEncontrada")}` };

  const { perfil, oportunidad } = encontrado;

  // Lo primero que se lee al compartirlo por WhatsApp. Si hay ficha, lo
  // que recibe la empresa cuenta mucho más que la descripción.
  const resumen =
    oportunidad.beneficios.length > 0
      ? oportunidad.beneficios.map(beneficioEnTexto).join(" · ")
      : (oportunidad.description ??
        tp("resumenPorDefecto", { club: perfil.name }));

  return {
    title: `${oportunidad.title} — ${perfil.name}`,
    description: resumen.slice(0, 300),
    openGraph: {
      title: `${oportunidad.title} — ${perfil.name}`,
      description: resumen.slice(0, 300),
      type: "website",
    },
  };
}

/**
 * Una oportunidad, en su propia página (migración 0049).
 *
 * Existe para poder compartirla suelta: el club le manda a la empresa
 * el enlace de ESTO y no el de su ficha entera, donde la empresa tenía
 * que buscar de qué le estaban hablando.
 */
export default async function PaginaOportunidad({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const encontrado = await buscar(slug, id);

  if (!encontrado) notFound();

  const { perfil, oportunidad } = encontrado;
  const t = await getTranslations("club");
  const tp = await getTranslations("club.oportunidadPagina");
  const E = etiquetador(await getTranslations("common.etiquetas"));
  const locale = (await getLocale()) as AppLocale;
  const precio = formatoDeValor(locale);

  const esNecesidad = oportunidad.esNecesidad;
  const urlPublica = `${SITE_URL}/${locale}/club/${perfil.slug}/oportunidad/${oportunidad.id}`;
  const volverA = esNecesidad
    ? `/club/${perfil.slug}/necesidades`
    : `/club/${perfil.slug}/oportunidades`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 print:bg-white">
      <Header />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6 py-6 print:max-w-none print:p-0">
        {/* De dónde viene esto, siempre a la vista: quien llega por un
            enlace compartido no sabe de qué club le están hablando. */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 print:hidden">
          <Link
            href={`/club/${perfil.slug}`}
            className="font-medium text-accion-tinta hover:underline"
          >
            {perfil.name}
          </Link>
          <span aria-hidden="true">›</span>
          <Link href={volverA} className="hover:underline">
            {esNecesidad ? tp("loQueNecesitamos") : tp("oportunidades")}
          </Link>
        </nav>

        {/* EN PAPEL, la ficha sola: sin cabecera, sin pie, sin botones y
            sin el marco de la tarjeta, que impreso solo gasta tinta. Lo
            que se oculta lleva `print:hidden`; lo único que se añade es
            el pie con el QR. */}
        <article className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 print:mt-0 print:rounded-none print:border-0 print:p-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {/* En pantalla el club se lee en la miga de pan; en papel
                  esa línea no sale, y una hoja sin el nombre del club no
                  dice de quién es la oferta. */}
              <p className="mb-1 hidden text-sm font-semibold text-zinc-700 print:block">
                {perfil.name}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
                {esNecesidad
                  ? `${tp("loNecesitamos")}${oportunidad.categoriaNecesidad ? ` · ${E.categoriaNecesidad(oportunidad.categoriaNecesidad)}` : ""}`
                  : `${E.tipoOportunidad(oportunidad.opportunityType)}${
                      oportunidad.sponsorLevel !== "libre"
                        ? ` · ${E.nivelPatrocinio(oportunidad.sponsorLevel)}`
                        : ""
                    }`}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
                {oportunidad.title}
              </h1>
            </div>

            {perfil.logoUrl && (
              <Image
                src={perfil.logoUrl}
                alt={perfil.name}
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-xl border border-zinc-200 bg-white object-contain p-1"
              />
            )}
          </div>

          {/* Las fotos van justo debajo del titular y ANTES del texto:
              quien abre esto quiere ver qué le ofrecen, y una foto se
              entiende en medio segundo. */}
          <FotosDeLaOportunidad
            fotos={oportunidad.fotos}
            titulo={oportunidad.title}
          />

          {oportunidad.description && (
            <p className="mt-4 whitespace-pre-line text-zinc-700">
              {oportunidad.description}
            </p>
          )}

          {/* El precio solo en lo que se vende. En una necesidad, lo que
              se ofrece ES el servicio y ponerle precio confunde. */}
          {!esNecesidad && oportunidad.value > 0 && (
            <p className="mt-4 text-2xl font-bold text-zinc-900">
              {precio.format(oportunidad.value)}
              {esPorPlazas(oportunidad) && (
                <span className="ml-1 text-sm font-medium text-zinc-500">
                  {t("oportunidades.porEmpresa")}
                </span>
              )}
            </p>
          )}

          {esPorPlazas(oportunidad) && (
            <div className="mt-4">
              <BarraDePlazas
                slotsTotal={oportunidad.slotsTotal}
                slotsTaken={oportunidad.slotsTaken}
                etiqueta={esNecesidad ? "colaboradores" : "plazas"}
              />
            </div>
          )}

          <div className="mt-6">
            <FichaDeOportunidad
              beneficios={oportunidad.beneficios}
              acciones={oportunidad.acciones}
              condiciones={{
                duracion: oportunidad.duration,
                frecuencia: oportunidad.frecuencia,
                desde: oportunidad.desde,
                hasta: oportunidad.hasta,
                exclusividad: oportunidad.exclusivity,
                requisitos: oportunidad.requisitos,
              }}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-6 print:hidden">
            <SolicitarContactoBoton
              clubId={perfil.id}
              clubName={perfil.name}
              opportunityId={oportunidad.id}
              opportunityTitle={oportunidad.title}
              variante="primaria"
            >
              {t("oportunidades.solicitar")}
            </SolicitarContactoBoton>

            <CompartirBoton
              url={urlPublica}
              titulo={`${oportunidad.title} — ${perfil.name}`}
            />

            <ImprimirBoton />
          </div>

          <PieDeLaFichaImpresa url={urlPublica} nombreClub={perfil.name} />
        </article>

        <p className="mt-6 text-center text-sm text-zinc-500 print:hidden">
          <Link
            href={`/club/${perfil.slug}`}
            className="font-medium text-accion-tinta hover:underline"
          >
            {tp("verFichaCompleta", { club: perfil.name })}
          </Link>
        </p>
      </div>
    </div>
  );
}
