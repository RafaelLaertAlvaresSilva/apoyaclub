"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useActionState, useRef, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { SECCIONES_DOSSIER } from "@/lib/dossier";
import { patrocinadoresDelDossier } from "@/lib/dossier-patrocinadores";
import { formatoDeValor } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import type {
  ClubProfile,
  ClubSponsor,
  ClubTeam,
  DossierConfig,
  DossierSectionKey,
  Opportunity,
  SponsorTier,
} from "@/lib/types";
import { Campo, SeccionCard, clasesInput } from "../../components/SeccionCard";
import { guardarConfiguracionDossier, type EstadoDossier } from "../actions";

/** `<input type="date">` espera "AAAA-MM-DD"; las fechas de la base de
 * datos vienen con hora, así que solo se toma la parte de la fecha. */
function aFechaInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function DossierManager({
  perfil,
  patrocinadores,
  oportunidades,
  seccionesDisponibles,
  configuracion,
  seccionesPorDefecto,
}: {
  perfil: ClubProfile;
  equipos: ClubTeam[];
  patrocinadores: ClubSponsor[];
  oportunidades: Opportunity[];
  seccionesDisponibles: DossierSectionKey[];
  configuracion: DossierConfig | null;
  seccionesPorDefecto: DossierSectionKey[];
}) {
  const t = useTranslations("panel.dossier");
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, accion] = useActionState<EstadoDossier, FormData>(guardarConfiguracionDossier, null);
  const [descargando, setDescargando] = useState<"pdf" | "word" | null>(null);
  const locale = useLocale();
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  const seccionesIniciales = configuracion?.sections ?? seccionesPorDefecto;
  const oportunidadesIniciales = new Set(
    configuracion?.opportunityIds ?? oportunidades.map((oportunidad) => oportunidad.id),
  );

  const enlaceActual = estado?.ok
    ? estado.shareUrl
    : configuracion?.shareEnabled && configuracion.shareToken
      ? `${SITE_URL}/${locale}/dossier/${configuracion.shareToken}`
      : null;

  /**
   * Descarga el dossier en el formato que se pida. Los dos salen de la
   * misma selección de secciones y oportunidades que hay marcada en el
   * formulario en ese momento, sin necesidad de guardarla antes.
   */
  async function descargar(formato: "pdf" | "word") {
    if (!formRef.current) return;
    setDescargando(formato);
    setErrorDescarga(null);
    try {
      const datosFormulario = new FormData(formRef.current);
      const cuerpo = new URLSearchParams();
      for (const valor of datosFormulario.getAll("sections")) cuerpo.append("sections", String(valor));
      for (const valor of datosFormulario.getAll("opportunityIds"))
        cuerpo.append("opportunityIds", String(valor));
      if (datosFormulario.has("sponsorTiersEnviado")) {
        cuerpo.append("sponsorTiersEnviado", "1");
        for (const valor of datosFormulario.getAll("sponsorTiers")) cuerpo.append("sponsorTiers", String(valor));
      }

      const respuesta = await fetch(`/${locale}/panel/dossier/${formato}`, { method: "POST", body: cuerpo });
      if (!respuesta.ok) throw new Error("Fallo al generar el dossier");

      const blob = await respuesta.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `dossier-${perfil.slug}.${formato === "pdf" ? "pdf" : "docx"}`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorDescarga(
        formato === "pdf"
          ? t("noPodidoGenerarPdf") : t("noPodidoGenerarWord"),
      );
    } finally {
      setDescargando(null);
    }
  }

  async function copiarEnlace() {
    if (!enlaceActual) return;
    try {
      await navigator.clipboard.writeText(enlaceActual);
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2500);
    } catch {
      // Si el navegador no permite copiar, el enlace ya está visible en pantalla.
    }
  }

  return (
    <form ref={formRef} action={accion} className="flex flex-col gap-6">
      <SeccionCard
        titulo={t("seccionesAIncluir")}
        descripcion={t("laPortadaConTu")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {SECCIONES_DOSSIER.map((seccion) => {
            const disponible = seccionesDisponibles.includes(seccion.id);

            // Vacía: en vez de una casilla apagada que no lleva a
            // ningún sitio, un enlace al sitio donde se rellena. Antes
            // el club tenía que adivinar en qué pestaña estaba cada
            // cosa, y lo normal es que la sección se quedara vacía.
            if (!disponible) {
              return (
                <Link
                  key={seccion.id}
                  href={seccion.donde}
                  className="group flex items-start gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-3 text-sm transition-colors hover:border-accion-tinta hover:bg-teal-50"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 text-xs font-bold leading-none text-zinc-400 group-hover:border-accion-tinta group-hover:text-accion-tinta"
                  >
                    +
                  </span>
                  <span>
                    <span className="block font-medium text-zinc-500 group-hover:text-zinc-900">
                      {t(`secciones.${seccion.id}.etiqueta`)}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {t("sinDatos")}{" "}
                      <span className="font-medium text-accion-tinta underline">
                        {t("anadirlosAhora")}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            }

            return (
              <label
                key={seccion.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="sections"
                  value={seccion.id}
                  defaultChecked={seccionesIniciales.includes(seccion.id)}
                  className="mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
                />
                <span>
                  <span className="block font-medium text-zinc-900">{t(`secciones.${seccion.id}.etiqueta`)}</span>
                  <span className="block text-xs text-zinc-500">{t(`secciones.${seccion.id}.descripcion`)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </SeccionCard>

      {patrocinadores.length > 0 && (
        <PatrocinadoresDelDossier
          patrocinadores={patrocinadores}
          nivelesIniciales={configuracion?.sponsorTiers ?? null}
        />
      )}

      <SeccionCard
        titulo={t("oportunidadesAIncluir")}
        descripcion={t("ademasDeLasDisponibles")}
      >
        {oportunidades.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t.rich("sinOportunidades", {
              enlace: (trozo) => (
                <Link href="/panel/oportunidades" className="font-medium text-teal-700 hover:underline">
                  {trozo}
                </Link>
              ),
            })}
          </p>
        ) : (
          <div className="space-y-2">
            {oportunidades.map((oportunidad) => (
              <label
                key={oportunidad.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="opportunityIds"
                    value={oportunidad.id}
                    defaultChecked={oportunidadesIniciales.has(oportunidad.id)}
                    className="rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
                  />
                  <span className="font-medium text-zinc-900">{oportunidad.title}</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-teal-700">
                  {formatoDeValor(locale as AppLocale).format(oportunidad.value)}
                </span>
              </label>
            ))}
          </div>
        )}
      </SeccionCard>

      <SeccionCard titulo={t("descargar")} descripcion={t("generaElPdfAl")}>
        <div className="flex flex-col gap-3">
          <AvisoError mensaje={errorDescarga} />

          <div className="flex flex-col gap-2 sm:flex-row">
            <BotonDescarga
              onClick={() => descargar("pdf")}
              ocupado={descargando === "pdf"}
              bloqueado={descargando !== null}
              destacado
            >
              {t("descargarPdf")}
            </BotonDescarga>
            <BotonDescarga
              onClick={() => descargar("word")}
              ocupado={descargando === "word"}
              bloqueado={descargando !== null}
            >
              {t("descargarWord")}
            </BotonDescarga>
          </div>

          {/* Los dos llevan el mismo contenido: la diferencia es para qué
              sirve cada uno, y conviene decirlo aquí y no en un manual. */}
          <p className="text-xs leading-relaxed text-zinc-500">
            {t.rich("pdfYWord", {
              fuerte: (trozo) => <strong className="font-medium text-zinc-700">{trozo}</strong>,
            })}
          </p>
        </div>
      </SeccionCard>

      <SeccionCard
        titulo={t("compartirConUnEnlace")}
        descripcion={t("seAbreDirectamenteEn")}
      >
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              name="shareEnabled"
              defaultChecked={configuracion?.shareEnabled ?? false}
              className="rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
            />{t("activarEnlacePublico")}</label>

          <Campo etiqueta={t("caducidadOpcional")} ayuda={t("dejaloEnBlancoPara")}>
            <input
              type="date"
              name="shareExpiresAt"
              defaultValue={aFechaInput(configuracion?.shareExpiresAt ?? null)}
              className={clasesInput}
            />
          </Campo>

          <AvisoError mensaje={estado?.error} />
          {estado?.ok && <AvisoExito mensaje={t("seleccionGuardada")} />}

          {enlaceActual && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm">
              <span className="break-all text-teal-800">{enlaceActual}</span>
              <button
                type="button"
                onClick={copiarEnlace}
                className="ml-auto shrink-0 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                {enlaceCopiado ? t("copiado") : t("copiarEnlace")}
              </button>
            </div>
          )}

          <BotonEnviar>{t("guardarSeleccion")}</BotonEnviar>
        </div>
      </SeccionCard>
    </form>
  );
}

/** Los dos botones de descarga son iguales salvo el texto y el color. */
function BotonDescarga({
  onClick,
  ocupado,
  bloqueado,
  destacado,
  children,
}: {
  onClick: () => void;
  ocupado: boolean;
  bloqueado: boolean;
  destacado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={bloqueado}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        destacado
          ? "bg-accion text-sobre-color hover:bg-accion-fuerte" : "border border-teal-600 text-teal-700 hover:bg-teal-50"
      }`}
    >
      {ocupado && (
        <span
          className={`h-4 w-4 animate-spin rounded-full border-2 ${
            destacado ? "border-sobre-color/40 border-t-sobre-color" : "border-teal-600/40 border-t-teal-600"
          }`}
          aria-hidden="true"
        />
      )}
      {ocupado ? "Generando…" : children}
    </button>
  );
}

/**
 * Qué patrocinadores salen en el dossier, por nivel (migración 0056).
 *
 * Debajo de cada casilla salen los nombres tal y como irán: por orden
 * alfabético, y diciendo si llevan logo o solo el nombre. Así el club ve
 * de un vistazo cuántos son y cómo se van a ver antes de descargarlo, y
 * si algo no le cuadra tiene a mano dónde cambiarle el nivel a uno.
 */
function PatrocinadoresDelDossier({
  patrocinadores,
  nivelesIniciales,
}: {
  patrocinadores: ClubSponsor[];
  nivelesIniciales: SponsorTier[] | null;
}) {
  const tp = useTranslations("panel.dossier.patrocinadores");
  const locale = useLocale();
  const grupos = patrocinadoresDelDossier(patrocinadores, null, locale);

  // Un nivel "otro" puede tener varias etiquetas propias: una casilla
  // para todas ("Otros: Amigos del club, Proveedores").
  const niveles = Array.from(new Set(grupos.map((grupo) => grupo.nivel)));

  return (
    <SeccionCard titulo={tp("titulo")} descripcion={tp("descripcion")}>
      <input type="hidden" name="sponsorTiersEnviado" value="1" />
      <div className="flex flex-col gap-3">
        {niveles.map((nivel) => {
          const delNivel = grupos.filter((grupo) => grupo.nivel === nivel);
          const total = delNivel.reduce((suma, grupo) => suma + grupo.patrocinadores.length, 0);
          const nombreNivel =
            nivel === "otro"
              ? `${tp("niveles.otro")}: ${delNivel.map((grupo) => grupo.etiqueta).join(", ")}`
              : tp(`niveles.${nivel}`);

          return (
            <label key={nivel} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm">
              <input
                type="checkbox"
                name="sponsorTiers"
                value={nivel}
                defaultChecked={nivelesIniciales ? nivelesIniciales.includes(nivel) : true}
                className="mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-zinc-900">{nombreNivel}</span>
                  <span className="text-xs text-zinc-500">
                    {tp("cuantos", { n: total })} · {delNivel.every((grupo) => grupo.conLogo) ? tp("conLogo") : tp("soloNombre")}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {delNivel.flatMap((grupo) =>
                    grupo.patrocinadores.map((patrocinador) => (
                      <span
                        key={patrocinador.id}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
                      >
                        {patrocinador.name}
                      </span>
                    )),
                  )}
                </span>
              </span>
            </label>
          );
        })}
        <p className="text-xs leading-relaxed text-zinc-500">
          {tp.rich("ayuda", {
            enlace: (trozo) => (
              <Link href="/panel/patrocinadores" className="font-medium text-teal-700 hover:underline">
                {trozo}
              </Link>
            ),
          })}
        </p>
      </div>
    </SeccionCard>
  );
}
