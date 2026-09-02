"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useActionState, useRef, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { SECCIONES_DOSSIER } from "@/lib/dossier";
import { formatoValorOportunidad } from "@/lib/opportunities";
import { SITE_URL } from "@/lib/site";
import type {
  ClubProfile,
  ClubSponsor,
  ClubTeam,
  DossierConfig,
  DossierSectionKey,
  Opportunity,
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
  const [descargando, setDescargando] = useState(false);
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

  async function descargarPdf() {
    if (!formRef.current) return;
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const datosFormulario = new FormData(formRef.current);
      const cuerpo = new URLSearchParams();
      for (const valor of datosFormulario.getAll("sections")) cuerpo.append("sections", String(valor));
      for (const valor of datosFormulario.getAll("opportunityIds"))
        cuerpo.append("opportunityIds", String(valor));

      const respuesta = await fetch("/panel/dossier/pdf", { method: "POST", body: cuerpo });
      if (!respuesta.ok) throw new Error("Fallo al generar el PDF");

      const blob = await respuesta.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `dossier-${perfil.slug}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorDescarga("No se ha podido generar el PDF. Inténtalo de nuevo.");
    } finally {
      setDescargando(false);
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
            return (
              <label
                key={seccion.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  disponible ? "border-zinc-200" : "cursor-not-allowed border-zinc-100 opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  name="sections"
                  value={seccion.id}
                  disabled={!disponible}
                  defaultChecked={disponible && seccionesIniciales.includes(seccion.id)}
                  className="mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  <span className="block font-medium text-zinc-900">{seccion.etiqueta}</span>
                  <span className="block text-xs text-zinc-500">
                    {disponible ? seccion.descripcion : "Todavía no has añadido datos para esta sección."}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </SeccionCard>

      <SeccionCard
        titulo={t("oportunidadesAIncluir")}
        descripcion={t("ademasDeLasDisponibles")}
      >
        {oportunidades.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Todavía no tienes oportunidades publicadas. Puedes crearlas en{" "}
            <Link href="/panel/oportunidades" className="font-medium text-teal-700 hover:underline">{t("oportunidades")}</Link>
            .
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
                    className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-medium text-zinc-900">{oportunidad.title}</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-teal-700">
                  {formatoValorOportunidad.format(oportunidad.value)}
                </span>
              </label>
            ))}
          </div>
        )}
      </SeccionCard>

      <SeccionCard titulo={t("descargar")} descripcion={t("generaElPdfAl")}>
        <div className="flex flex-col gap-3">
          <AvisoError mensaje={errorDescarga} />
          <button
            type="button"
            onClick={descargarPdf}
            disabled={descargando}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-600 px-4 py-2.5 font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {descargando && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600/40 border-t-teal-600"
                aria-hidden="true"
              />
            )}
            {descargando ? "Generando…" : "Descargar PDF"}
          </button>
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
              className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />{t("activarEnlacePublico")}</label>

          <Campo etiqueta="Caducidad (opcional)" ayuda={t("dejaloEnBlancoPara")}>
            <input
              type="date"
              name="shareExpiresAt"
              defaultValue={aFechaInput(configuracion?.shareExpiresAt ?? null)}
              className={clasesInput}
            />
          </Campo>

          <AvisoError mensaje={estado?.error} />
          {estado?.ok && <AvisoExito mensaje="Selección guardada." />}

          {enlaceActual && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm">
              <span className="break-all text-teal-800">{enlaceActual}</span>
              <button
                type="button"
                onClick={copiarEnlace}
                className="ml-auto shrink-0 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                {enlaceCopiado ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </div>
          )}

          <BotonEnviar>{t("guardarSeleccion")}</BotonEnviar>
        </div>
      </SeccionCard>
    </form>
  );
}
