import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { LOCALE_CONFIG } from "@/config/locales";
import type { AppLocale } from "@/i18n/routing";
import {
  CLASES_NIVEL_PATROCINIO,
  ETIQUETA_NIVEL_PATROCINIO,
  esPorPlazas,
  formatoValorOportunidad,
  plazasLibres,
} from "@/lib/opportunities";
import { agruparPatrocinadoresPorNivel } from "@/lib/club-mappers";
import { SITE_URL } from "@/lib/site";
import type { ClubTeam, SocialLinks } from "@/lib/types";
import { CompartirBoton } from "./components/CompartirBoton";
import { DatosDeContacto } from "./components/DatosDeContacto";
import { GuardarFavoritoBoton } from "./components/GuardarFavoritoBoton";
import { RegistrarVisita } from "./components/RegistrarVisita";
import { SolicitarContactoBoton } from "./components/SolicitarContactoBoton";
import { ETIQUETA_CATEGORIA_SERVICIO, obtenerServiciosDelClub } from "@/lib/service-needs";
import { createPublicClient } from "@/lib/supabase/public";
import { deportesDelClub, obtenerClubPublico, obtenerEmailContacto } from "./data";

export const revalidate = 60;

const ETIQUETA_NIVEL_EQUIPO: Record<ClubTeam["teamLevel"], string> = {
  primer_equipo: "Primer equipo",
  cantera: "Cantera",
};

const ETIQUETA_RED: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const formatoNumero = new Intl.NumberFormat("es-ES");

function recortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const cortado = texto.slice(0, maximo);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : maximo)}…`;
}

type ParametrosRuta = { params: Promise<{ locale: AppLocale; slug: string }> };

export async function generateMetadata({ params }: ParametrosRuta): Promise<Metadata> {
  const { locale, slug } = await params;
  const datos = await obtenerClubPublico(slug);
  const tMeta = await getTranslations("club.meta");

  if (!datos) {
    return { title: tMeta("noEncontrado") };
  }

  const { perfil, equipos } = datos;
  const deportes = deportesDelClub(equipos);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const resumen = [perfil.name, deportes.join(", "), ubicacion].filter(Boolean).join(" · ");
  const descripcion = perfil.description
    ? recortar(perfil.description, 160)
    : tMeta("descripcionPorDefecto", { resumen });
  const titulo = tMeta("titulo", { club: perfil.name });
  const ruta = `/${locale}/club/${perfil.slug}`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: ruta,
      siteName: "ApoyaClub",
      locale: LOCALE_CONFIG[locale].intlLocale.replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export default async function PaginaPublicaClub({ params }: ParametrosRuta) {
  const { locale, slug } = await params;
  const datos = await obtenerClubPublico(slug);
  const t = await getTranslations("club");

  if (!datos) notFound();

  const { perfil, equipos, patrocinadores, oportunidades } = datos;
  // Solo interesa SI hay contacto, para decidir si se pinta la sección.
  // El dato en sí lo pide el navegador al pulsar (ver DatosDeContacto).
  const hayContacto = (await obtenerEmailContacto(perfil.id)) !== null;
  // Servicios que el club busca (migración 0016): la puerta de entrada
  // de la empresa que no tiene presupuesto de patrocinio pero sí un
  // servicio que ofrecer.
  const servicios = await obtenerServiciosDelClub(createPublicClient(), perfil.id);

  const deportes = deportesDelClub(equipos);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const urlPublica = `${SITE_URL}/${locale}/club/${perfil.slug}`;

  const portada = perfil.photoUrls[0] ?? null;
  const galeria = perfil.photoUrls.slice(1);

  const redesSociales = (Object.entries(perfil.socialLinks) as [keyof SocialLinks, string | undefined][])
    .filter((entrada): entrada is [keyof SocialLinks, string] => !!entrada[1]);

  const mostrarEnlaces = !!perfil.website || !!perfil.videoUrl || redesSociales.length > 0;
  const mostrarQuienesSomos = !!perfil.description || galeria.length > 0;
  const mostrarCantera =
    perfil.youthTeamsCount != null || perfil.youthPlayersCount != null || perfil.youthFamiliesCount != null;
  const mostrarPalmares = !!perfil.topCategory || !!perfil.competitions || !!perfil.achievements;
  const mostrarHistoria = perfil.foundingYear != null || perfil.milestones.length > 0;

  const estadisticasAudiencia = [
    perfil.estimatedReach != null
      ? { etiqueta: t("secciones.alcanceEstimado"), valor: formatoNumero.format(perfil.estimatedReach) }
      : null,
    perfil.averageAttendance != null
      ? { etiqueta: t("secciones.asistenciaMedia"), valor: formatoNumero.format(perfil.averageAttendance) }
      : null,
    ...(Object.entries(perfil.followersByNetwork) as [keyof SocialLinks, number | undefined][])
      .filter((entrada): entrada is [keyof SocialLinks, number] => entrada[1] != null)
      .map(([red, valor]) => ({
        etiqueta: t("secciones.seguidoresEn", { red: ETIQUETA_RED[red] }),
        valor: formatoNumero.format(valor),
      })),
  ].filter((estadistica): estadistica is { etiqueta: string; valor: string } => estadistica !== null);

  const datosEstructurados = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: perfil.name,
    url: urlPublica,
    logo: perfil.logoUrl ?? undefined,
    image: portada ?? perfil.logoUrl ?? undefined,
    description: perfil.description ?? undefined,
    sport: deportes.length > 0 ? deportes.join(", ") : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: perfil.city,
      addressRegion: perfil.province ?? undefined,
      postalCode: perfil.postalCode ?? undefined,
      addressCountry: "ES",
    },
    sameAs: redesSociales.map(([, url]) => url),
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      <RegistrarVisita slug={perfil.slug} />

      <Header />

      <header className="relative">
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800 sm:h-72">
          {portada && (
            <Image
              src={portada}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        </div>

        <div className="mx-auto -mt-14 flex max-w-4xl flex-col gap-4 px-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-32 sm:w-32">
              {perfil.logoUrl ? (
                <Image
                  src={perfil.logoUrl}
                  alt={`Logo de ${perfil.name}`}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-teal-50 text-3xl font-bold text-teal-700">
                  {perfil.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{perfil.name}</h1>
                {perfil.verified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700"
                    title={t("portada.verificadoAyuda")}
                  >
                    <span aria-hidden="true">&#10003;</span> {t("portada.verificado")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600 sm:text-base">
                {[deportes.join(" · "), ubicacion].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <CompartirBoton url={urlPublica} titulo={t("portada.compartirTitulo", { club: perfil.name })} />
            <SolicitarContactoBoton clubId={perfil.id} clubName={perfil.name}>
              {t("portada.solicitarContacto")}
            </SolicitarContactoBoton>
            {hayContacto && (
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                {t("portada.contactar")}
              </a>
            )}
          </div>
        </div>

        {mostrarEnlaces && (
          <div className="mx-auto mt-4 max-w-4xl px-4">
            <div className="flex flex-wrap gap-2">
              {perfil.website && <EnlaceSecundario href={perfil.website}>Sitio web</EnlaceSecundario>}
              {perfil.videoUrl && <EnlaceSecundario href={perfil.videoUrl}>Vídeo de presentación</EnlaceSecundario>}
              {redesSociales.map(([red, url]) => (
                <EnlaceSecundario key={red} href={url}>
                  {ETIQUETA_RED[red]}
                </EnlaceSecundario>
              ))}
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 pt-8">
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {t("oportunidades.titulo")}
          </p>
          {oportunidades.length === 0 ? (
            <p className="mt-2 text-zinc-700">
              {t("oportunidades.vacio")}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {oportunidades.map((oportunidad) => (
                <div
                  key={oportunidad.id}
                  className="flex flex-col gap-2 rounded-xl border border-teal-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900">{oportunidad.title}</p>
                      {oportunidad.sponsorLevel !== "libre" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            CLASES_NIVEL_PATROCINIO[oportunidad.sponsorLevel]
                          }`}
                        >
                          {ETIQUETA_NIVEL_PATROCINIO[oportunidad.sponsorLevel]}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-nowrap text-lg font-bold text-teal-700">
                      {formatoValorOportunidad.format(oportunidad.value)}
                      {esPorPlazas(oportunidad) && (
                        <span className="ml-1 text-xs font-medium text-zinc-500">
                          {t("oportunidades.porEmpresa")}
                        </span>
                      )}
                    </p>
                  </div>
                  {oportunidad.description && (
                    <p className="text-sm text-zinc-600">{oportunidad.description}</p>
                  )}
                  {oportunidad.exclusivity && (
                    <p className="text-xs font-medium text-brand-teal-dark">
                      {t("oportunidades.exclusiva", { sector: oportunidad.exclusivity })}
                    </p>
                  )}
                  {esPorPlazas(oportunidad) && (
                    <p className="text-xs font-medium text-brand-teal-dark">
                      {t("oportunidades.plazas", {
                        libres: plazasLibres(oportunidad),
                        total: oportunidad.slotsTotal ?? 0,
                      })}
                    </p>
                  )}
                  {oportunidad.duration && (
                    <p className="text-xs font-medium text-zinc-500">{oportunidad.duration}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <SolicitarContactoBoton
                      clubId={perfil.id}
                      clubName={perfil.name}
                      opportunityId={oportunidad.id}
                      opportunityTitle={oportunidad.title}
                      variante="secundaria"
                    >
                      {t("oportunidades.solicitar")}
                    </SolicitarContactoBoton>
                    <GuardarFavoritoBoton opportunityId={oportunidad.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl px-4 pb-16">
        {mostrarQuienesSomos && (
          <Seccion titulo={t("secciones.quienesSomos")}>
            {perfil.description && (
              <p className="whitespace-pre-line text-zinc-700">{perfil.description}</p>
            )}
            {galeria.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {galeria.map((foto) => (
                  <div key={foto} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={foto}
                      alt={`Foto de ${perfil.name}`}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Seccion>
        )}

        {equipos.length > 0 && (
          <Seccion titulo={t("secciones.equipos")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {equipos.map((equipo) => (
                <li key={equipo.id} className="rounded-xl border border-zinc-200 p-4">
                  <p className="font-medium text-zinc-900">
                    {equipo.sport}
                    {equipo.category ? ` · ${equipo.category}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {ETIQUETA_NIVEL_EQUIPO[equipo.teamLevel]}
                    {equipo.gender ? ` · ${equipo.gender}` : ""}
                    {equipo.playerCount != null
                      ? ` · ${formatoNumero.format(equipo.playerCount)} jugadores`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {mostrarCantera && (
          <Seccion titulo={t("secciones.cantera")} descripcion={t("secciones.canteraDescripcion")}>
            <div className="flex flex-wrap gap-3">
              {perfil.youthTeamsCount != null && (
                <TarjetaEstadistica etiqueta={t("secciones.canteraEquipos")} valor={formatoNumero.format(perfil.youthTeamsCount)} />
              )}
              {perfil.youthPlayersCount != null && (
                <TarjetaEstadistica etiqueta={t("secciones.canteraJugadores")} valor={formatoNumero.format(perfil.youthPlayersCount)} />
              )}
              {perfil.youthFamiliesCount != null && (
                <TarjetaEstadistica etiqueta={t("secciones.canteraFamilias")} valor={formatoNumero.format(perfil.youthFamiliesCount)} />
              )}
            </div>
          </Seccion>
        )}

        {mostrarPalmares && (
          <Seccion titulo={t("secciones.palmares")}>
            <div className="space-y-4">
              {perfil.topCategory && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">{t("secciones.maximaCategoria")}</p>
                  <p className="text-zinc-900">{perfil.topCategory}</p>
                </div>
              )}
              {perfil.competitions && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">{t("secciones.competiciones")}</p>
                  <p className="whitespace-pre-line text-zinc-900">{perfil.competitions}</p>
                </div>
              )}
              {perfil.achievements && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">{t("secciones.logros")}</p>
                  <p className="whitespace-pre-line text-zinc-900">{perfil.achievements}</p>
                </div>
              )}
            </div>
          </Seccion>
        )}

        {mostrarHistoria && (
          <Seccion titulo={t("secciones.historia")}>
            {perfil.foundingYear != null && (
              <p className="text-zinc-700">
                {t("secciones.fundadoEn")}{" "}
                <span className="font-medium text-zinc-900">{perfil.foundingYear}</span>.
              </p>
            )}
            {perfil.milestones.length > 0 && (
              <ul className="mt-4 space-y-3 border-l-2 border-teal-200 pl-4">
                {perfil.milestones
                  .slice()
                  .sort((a, b) => a.year - b.year)
                  .map((hito, indice) => (
                    <li key={`${hito.year}-${indice}`}>
                      <span className="font-semibold text-teal-700">{hito.year}</span>{" "}
                      <span className="text-zinc-700">{hito.text}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Seccion>
        )}

        {estadisticasAudiencia.length > 0 && (
          <Seccion titulo={t("secciones.audiencia")}>
            <div className="flex flex-wrap gap-3">
              {estadisticasAudiencia.map((estadistica) => (
                <TarjetaEstadistica
                  key={estadistica.etiqueta}
                  etiqueta={estadistica.etiqueta}
                  valor={estadistica.valor}
                />
              ))}
            </div>
          </Seccion>
        )}

        {perfil.communityActions.length > 0 && (
          <Seccion titulo={t("secciones.comunidad")} descripcion={t("secciones.comunidadDescripcion")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {perfil.communityActions.map((accion, indice) => (
                <li key={`${accion.title}-${indice}`} className="rounded-xl border border-zinc-200 p-4">
                  <p className="font-medium text-zinc-900">{accion.title}</p>
                  {accion.description && (
                    <p className="mt-1 text-sm text-zinc-600">{accion.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {perfil.facilities && (
          <Seccion titulo={t("secciones.instalaciones")}>
            <p className="whitespace-pre-line text-zinc-700">{perfil.facilities}</p>
          </Seccion>
        )}

        {patrocinadores.length > 0 && (
          <Seccion titulo={t("secciones.patrocinadores")}>
            <div className="space-y-6">
              {agruparPatrocinadoresPorNivel(patrocinadores).map((grupo) => (
                <div key={grupo.etiqueta}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {grupo.etiqueta}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {grupo.patrocinadores.map((patrocinador) => (
                      <li
                        key={patrocinador.id}
                        className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4"
                      >
                        {patrocinador.logoUrl ? (
                          <Image
                            src={patrocinador.logoUrl}
                            alt={patrocinador.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-100 text-sm font-semibold text-zinc-500">
                            {patrocinador.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900">
                            {patrocinador.name}
                            {patrocinador.sinceYear && (
                              <span className="ml-2 text-xs font-normal text-zinc-500">
                                desde {patrocinador.sinceYear}
                              </span>
                            )}
                          </p>
                          {patrocinador.description && (
                            <p className="mt-1 text-sm text-zinc-600">{patrocinador.description}</p>
                          )}
                          {patrocinador.website && (
                            <a
                              href={patrocinador.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-teal-700 hover:underline"
                            >
                              {patrocinador.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Seccion>
        )}

        {servicios.length > 0 && (
          <Seccion titulo={t("servicios.titulo")} descripcion={t("servicios.descripcion")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {servicios.map((servicio) => (
                <li key={servicio.id} className="rounded-xl border border-zinc-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
                    {ETIQUETA_CATEGORIA_SERVICIO[servicio.category]}
                  </p>
                  <p className="mt-1 font-medium text-zinc-900">{servicio.title}</p>
                  {servicio.description && (
                    <p className="mt-1 text-sm text-zinc-600">{servicio.description}</p>
                  )}
                  <div className="mt-3">
                    <SolicitarContactoBoton
                      clubId={perfil.id}
                      clubName={perfil.name}
                      variante="secundaria"
                    >
                      {t("servicios.ofrecer")}
                    </SolicitarContactoBoton>
                  </div>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {hayContacto && (
          <Seccion id="contacto" titulo={t("secciones.contacto")}>
            <div className="rounded-xl border border-zinc-200 p-5">
              {/* Los datos no se escriben en el HTML: se piden al pulsar
                  (migración 0022). Así el correo del club no queda a la
                  vista de los robots que recolectan direcciones, y el
                  club puede ver cuántas empresas llegan hasta aquí. */}
              <DatosDeContacto
                slug={perfil.slug}
                textoBoton={t("secciones.verContacto")}
                textoEmail={t("secciones.escribirEmail")}
                textoLlamar={t("secciones.llamar")}
              />
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <SolicitarContactoBoton clubId={perfil.id} clubName={perfil.name} variante="secundaria">
                  {t("portada.solicitarContacto")}
                </SolicitarContactoBoton>
              </div>
            </div>
          </Seccion>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-500">
        {t("pie", { club: perfil.name })}
      </footer>
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  id,
  children,
}: {
  titulo: string;
  descripcion?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-zinc-100 py-8 first:border-t-0 first:pt-8">
      <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TarjetaEstadistica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-32 flex-1 rounded-xl border border-zinc-200 p-4 sm:flex-none">
      <p className="text-2xl font-bold text-zinc-900">{valor}</p>
      <p className="mt-1 text-sm text-zinc-500">{etiqueta}</p>
    </div>
  );
}

function EnlaceSecundario({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
    >
      {children} ↗
    </a>
  );
}
