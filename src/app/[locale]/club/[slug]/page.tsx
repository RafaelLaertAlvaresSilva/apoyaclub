import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { LOCALE_CONFIG } from "@/config/locales";
import type { AppLocale } from "@/i18n/routing";
import { formatoValorOportunidad } from "@/lib/opportunities";
import { SITE_URL } from "@/lib/site";
import type { ClubTeam, SocialLinks } from "@/lib/types";
import { CompartirBoton } from "./components/CompartirBoton";
import { GuardarFavoritoBoton } from "./components/GuardarFavoritoBoton";
import { SolicitarContactoBoton } from "./components/SolicitarContactoBoton";
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

  if (!datos) {
    return { title: "Club no encontrado — ApoyaClub" };
  }

  const { perfil, equipos } = datos;
  const deportes = deportesDelClub(equipos);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const resumen = [perfil.name, deportes.join(", "), ubicacion].filter(Boolean).join(" · ");
  const descripcion = perfil.description
    ? recortar(perfil.description, 160)
    : `${resumen}. Descubre cómo patrocinar a este club en ApoyaClub.`;
  const titulo = `${perfil.name} — ApoyaClub`;
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

  if (!datos) notFound();

  const { perfil, equipos, patrocinadores, oportunidades } = datos;
  const emailContacto = await obtenerEmailContacto(perfil.id);

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
      ? { etiqueta: "Alcance estimado", valor: formatoNumero.format(perfil.estimatedReach) }
      : null,
    perfil.averageAttendance != null
      ? { etiqueta: "Asistencia media", valor: formatoNumero.format(perfil.averageAttendance) }
      : null,
    ...(Object.entries(perfil.followersByNetwork) as [keyof SocialLinks, number | undefined][])
      .filter((entrada): entrada is [keyof SocialLinks, number] => entrada[1] != null)
      .map(([red, valor]) => ({ etiqueta: `Seguidores en ${ETIQUETA_RED[red]}`, valor: formatoNumero.format(valor) })),
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
                    title="Club verificado por el equipo de ApoyaClub"
                  >
                    <span aria-hidden="true">&#10003;</span> Verificado
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600 sm:text-base">
                {[deportes.join(" · "), ubicacion].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <CompartirBoton url={urlPublica} titulo={`${perfil.name} — ApoyaClub`} />
            <SolicitarContactoBoton clubId={perfil.id} clubName={perfil.name}>
              Solicitar contacto
            </SolicitarContactoBoton>
            {emailContacto && (
              <a
                href={`mailto:${emailContacto}`}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                Contactar
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
            Oportunidades disponibles
          </p>
          {oportunidades.length === 0 ? (
            <p className="mt-2 text-zinc-700">
              Este club todavía no ha publicado oportunidades de patrocinio. Vuelve pronto o
              contacta directamente con el club para proponer una colaboración.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {oportunidades.map((oportunidad) => (
                <div
                  key={oportunidad.id}
                  className="flex flex-col gap-2 rounded-xl border border-teal-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-zinc-900">{oportunidad.title}</p>
                    <p className="whitespace-nowrap text-lg font-bold text-teal-700">
                      {formatoValorOportunidad.format(oportunidad.value)}
                    </p>
                  </div>
                  {oportunidad.description && (
                    <p className="text-sm text-zinc-600">{oportunidad.description}</p>
                  )}
                  {oportunidad.duration && (
                    <p className="text-xs font-medium text-zinc-400">{oportunidad.duration}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <SolicitarContactoBoton
                      clubId={perfil.id}
                      clubName={perfil.name}
                      opportunityId={oportunidad.id}
                      opportunityTitle={oportunidad.title}
                      variante="secundaria"
                    >
                      Solicitar
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
          <Seccion titulo="Quiénes somos">
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
          <Seccion titulo="Equipos">
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
          <Seccion titulo="Cantera" descripcion="Datos agregados de las categorías inferiores del club.">
            <div className="flex flex-wrap gap-3">
              {perfil.youthTeamsCount != null && (
                <TarjetaEstadistica etiqueta="Equipos" valor={formatoNumero.format(perfil.youthTeamsCount)} />
              )}
              {perfil.youthPlayersCount != null && (
                <TarjetaEstadistica etiqueta="Jugadores" valor={formatoNumero.format(perfil.youthPlayersCount)} />
              )}
              {perfil.youthFamiliesCount != null && (
                <TarjetaEstadistica etiqueta="Familias" valor={formatoNumero.format(perfil.youthFamiliesCount)} />
              )}
            </div>
          </Seccion>
        )}

        {mostrarPalmares && (
          <Seccion titulo="Palmarés">
            <div className="space-y-4">
              {perfil.topCategory && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">Máxima categoría</p>
                  <p className="text-zinc-900">{perfil.topCategory}</p>
                </div>
              )}
              {perfil.competitions && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">Competiciones</p>
                  <p className="whitespace-pre-line text-zinc-900">{perfil.competitions}</p>
                </div>
              )}
              {perfil.achievements && (
                <div>
                  <p className="text-sm font-medium text-zinc-500">Logros</p>
                  <p className="whitespace-pre-line text-zinc-900">{perfil.achievements}</p>
                </div>
              )}
            </div>
          </Seccion>
        )}

        {mostrarHistoria && (
          <Seccion titulo="Nuestra historia">
            {perfil.foundingYear != null && (
              <p className="text-zinc-700">
                Fundado en <span className="font-medium text-zinc-900">{perfil.foundingYear}</span>.
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
          <Seccion titulo="Audiencia en cifras">
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
          <Seccion titulo="Comunidad" descripcion="Acciones sociales, educativas o benéficas del club.">
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
          <Seccion titulo="Instalaciones">
            <p className="whitespace-pre-line text-zinc-700">{perfil.facilities}</p>
          </Seccion>
        )}

        {patrocinadores.length > 0 && (
          <Seccion titulo="Patrocinadores actuales">
            <ul className="grid gap-3 sm:grid-cols-2">
              {patrocinadores.map((patrocinador) => (
                <li
                  key={patrocinador.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4"
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
                  <div>
                    <p className="font-medium text-zinc-900">{patrocinador.name}</p>
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
          </Seccion>
        )}

        {emailContacto && (
          <Seccion id="contacto" titulo="Contacto">
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-600">
                {perfil.contactName && (
                  <p className="font-medium text-zinc-900">{perfil.contactName}</p>
                )}
                <p>{emailContacto}</p>
                {perfil.contactPhone && <p>{perfil.contactPhone}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${emailContacto}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Escribir email
                </a>
                <SolicitarContactoBoton clubId={perfil.id} clubName={perfil.name} variante="secundaria">
                  Solicitar contacto
                </SolicitarContactoBoton>
                {perfil.contactPhone && (
                  <a
                    href={`tel:${perfil.contactPhone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    Llamar
                  </a>
                )}
              </div>
            </div>
          </Seccion>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
        Página de {perfil.name} en ApoyaClub — la plataforma que conecta clubes deportivos con
        empresas patrocinadoras.
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
