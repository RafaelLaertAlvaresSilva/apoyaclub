import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { nombreDelDeporte } from "@/lib/deportes";
import { formatoDeValor, textoDelPrecio } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { beneficioEnTexto } from "@/lib/ficha-oportunidad";
import { esPorPlazas } from "@/lib/opportunities";
import { SITE_URL } from "@/lib/site";
import { CompartirBoton } from "./CompartirBoton";
import { FichaDeOportunidad } from "./FichaDeOportunidad";
import { FotosDeLaOportunidad } from "./FotosDeLaOportunidad";
import { ImprimirBoton } from "./ImprimirBoton";
import { PieDeLaFichaImpresa } from "./PieDeLaFichaImpresa";
import { SolicitarContactoBoton } from "./SolicitarContactoBoton";
import type { ClubPublico } from "../data";

/** Cuántas otras oportunidades del club se enseñan debajo. */
const OTRAS_A_LA_VISTA = 3;

/**
 * Una oportunidad, en su propia página (migración 0049). Sin la ruta
 * alrededor: la usan la página pública y la vista previa del club.
 *
 * Existe para poder compartirla suelta: el club le manda a la empresa
 * el enlace de ESTO y no el de su ficha entera, donde la empresa tenía
 * que buscar de qué le estaban hablando.
 */
export async function VistaDeOportunidad({
  locale,
  perfil,
  oportunidad,
  vistaPrevia = false,
  equipos = [],
  otras = [],
}: {
  locale: AppLocale;
  perfil: ClubPublico["perfil"];
  oportunidad: ClubPublico["oportunidades"][number];
  vistaPrevia?: boolean;
  /** Para el recuadro "Sobre el club" (pedido por Rafael el 7-11-2026). */
  equipos?: ClubPublico["equipos"];
  /** Las demás oportunidades del club, para "Más de este club". */
  otras?: ClubPublico["oportunidades"];
}) {
  const t = await getTranslations("club");
  const tp = await getTranslations("club.oportunidadPagina");
  const E = etiquetador(await getTranslations("common.etiquetas"));
  const precio = formatoDeValor(locale, perfil.country);
  const tPrecio = await getTranslations("common.precio");
  const tEtiquetas = await getTranslations("common.etiquetas");
  const deportes = [
    ...new Set(equipos.map((equipo) => nombreDelDeporte(equipo.sport, (clave) => tEtiquetas(clave as never)))),
  ];
  const lugar = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const masDelClub = otras.filter((otra) => otra.id !== oportunidad.id).slice(0, OTRAS_A_LA_VISTA);

  const esNecesidad = oportunidad.esNecesidad;
  const urlPublica = `${SITE_URL}/${locale}/club/${perfil.slug}/oportunidad/${oportunidad.id}`;
  // En la vista previa, la miga de pan vuelve a la vista previa: la
  // ficha pública de un club que no se ve daría "no encontrada".
  const base = vistaPrevia ? "/vista-previa" : `/club/${perfil.slug}`;
  const volverA = esNecesidad ? `${base}/necesidades` : `${base}/oportunidades`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 print:bg-white">
      <Header />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6 py-6 print:max-w-none print:p-0">
        {/* De dónde viene esto, siempre a la vista: quien llega por un
            enlace compartido no sabe de qué club le están hablando. */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 print:hidden">
          <Link
            href={base}
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
          {/* Sin precio, se dice: una empresa que no ve ninguna cifra no
              sabe si se ha olvidado o si se puede hablar. */}
          {!esNecesidad && !(oportunidad.value > 0) && (
            <p className="mt-4 text-lg font-semibold text-zinc-700">{tPrecio("aConvenir")}</p>
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

        {/* Sobre el club: quien llega por un enlace o desde el buscador
            no sabe quién hay detrás. Dónde está, qué deporte y cuántos
            equipos, que es lo primero que pregunta una empresa. */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 print:hidden">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{tp("sobreElClub")}</h2>
          <div className="mt-3 flex items-start gap-3">
            {perfil.logoUrl ? (
              <Image
                src={perfil.logoUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain p-0.5"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-700">
                {perfil.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">{perfil.name}</p>
              {lugar && <p className="text-sm text-zinc-600">{lugar}</p>}
              {(deportes.length > 0 || equipos.length > 0) && (
                <p className="mt-0.5 text-sm text-zinc-600">
                  {[deportes.join(", "), equipos.length > 0 ? tp("equipos", { n: equipos.length }) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {perfil.description && (
                <p className="mt-2 line-clamp-3 text-sm text-zinc-700">{perfil.description}</p>
              )}
              <Link href={base} className="mt-2 inline-block text-sm font-medium text-accion-tinta hover:underline">
                {tp("verFichaCompleta", { club: perfil.name })} →
              </Link>
            </div>
          </div>
        </section>

        {/* Más de este club: si esta no le encaja, a lo mejor otra sí,
            sin tener que volver al buscador. */}
        {masDelClub.length > 0 && (
          <section className="mt-6 print:hidden">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              {tp("masDelClub", { club: perfil.name })}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {masDelClub.map((otra) => (
                <li key={otra.id}>
                  <Link
                    href={`${base}/oportunidad/${otra.id}`}
                    className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 hover:border-accion-tinta"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-accion-tinta">
                      {otra.esNecesidad ? tp("loNecesitamos") : E.tipoOportunidad(otra.opportunityType)}
                    </span>
                    <span className="mt-1 font-medium text-zinc-900">{otra.title}</span>
                    <span className="mt-auto pt-2 text-sm font-semibold text-teal-700">
                      {textoDelPrecio(
                        { value: otra.value, esNecesidad: otra.esNecesidad },
                        precio,
                        { necesidad: tPrecio("necesidad"), aConvenir: tPrecio("aConvenir") },
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
