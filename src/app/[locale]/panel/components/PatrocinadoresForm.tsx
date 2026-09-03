"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { agruparPatrocinadoresPorNivel } from "@/lib/club-mappers";
import { NIVELES_PATROCINADOR, type ClubSponsor, type SponsorTier } from "@/lib/types";
import {
  agregarPatrocinador,
  editarPatrocinador,
  eliminarPatrocinador,
  moverPatrocinador,
  type EstadoGuardado,
} from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";

/** Nombre visible de cada categoría en los desplegables del formulario. */
const NOMBRE_NIVEL: Record<SponsorTier, string> = {
  principal: "Patrocinador principal",
  oficial: "Patrocinador oficial",
  colaborador: "Colaborador",
  otro: "Otra categoría (la escribes tú)",
};

/**
 * Patrocinadores actuales del club (migración 0019).
 *
 * No es una lista de logos decorativa: es la prueba de que a este club ya
 * lo patrocinan empresas de verdad, que es lo primero que mira una
 * empresa nueva. Por eso cada patrocinador lleva categoría, un texto y un
 * orden que decide el club, y se pueden añadir todos los que quiera.
 */
export function PatrocinadoresForm({
  userId,
  patrocinadores,
}: {
  userId: string;
  patrocinadores: ClubSponsor[];
}) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(agregarPatrocinador, null);
  const grupos = agruparPatrocinadoresPorNivel(patrocinadores);
  const ordenados = grupos.flatMap((grupo) => grupo.patrocinadores);

  return (
    <SeccionCard
      titulo={t("patrocinadoresActuales")}
      descripcion="Las empresas que ya colaboran contigo. Enseñarlas es lo que convence a las que todavía no: añade todas las que tengas, clasifícalas y cuenta en dos líneas qué aportan."
    >
      {grupos.length > 0 && (
        <div className="mb-6 space-y-5">
          {grupos.map((grupo) => (
            <div key={grupo.etiqueta}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {grupo.etiqueta}
              </h3>
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {grupo.patrocinadores.map((patrocinador) => (
                  <FilaPatrocinador
                    key={patrocinador.id}
                    userId={userId}
                    patrocinador={patrocinador}
                    esPrimero={ordenados[0]?.id === patrocinador.id}
                    esUltimo={ordenados[ordenados.length - 1]?.id === patrocinador.id}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* La key cambia cuando se añade un patrocinador (revalidatePath
          refresca `patrocinadores`), lo que remonta el formulario y limpia
          tanto sus campos como el logo ya subido. */}
      <FormularioNuevoPatrocinador
        key={patrocinadores.length}
        userId={userId}
        formAction={formAction}
        estado={estado}
      />
    </SeccionCard>
  );
}

/** Una fila de la lista, que se despliega para editar. */
function FilaPatrocinador({
  userId,
  patrocinador,
  esPrimero,
  esUltimo,
}: {
  userId: string;
  patrocinador: ClubSponsor;
  esPrimero: boolean;
  esUltimo: boolean;
}) {
  const t = useTranslations("panel.perfil2");
  const [editando, setEditando] = useState(false);

  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {patrocinador.logoUrl ? (
            <Image
              src={patrocinador.logoUrl}
              alt={patrocinador.name}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded bg-white object-contain"
              unoptimized
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs font-semibold text-zinc-500">
              {patrocinador.name.charAt(0).toUpperCase()}
            </span>
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
              <p className="mt-0.5 text-zinc-600">{patrocinador.description}</p>
            )}
            {patrocinador.website && <p className="text-zinc-500">{patrocinador.website}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <BotonMover id={patrocinador.id} direccion="arriba" desactivado={esPrimero} />
          <BotonMover id={patrocinador.id} direccion="abajo" desactivado={esUltimo} />
          <button
            type="button"
            onClick={() => setEditando((valor) => !valor)}
            className="rounded px-2 py-1 text-sm font-medium text-teal-700 hover:bg-teal-50"
            aria-expanded={editando}
          >
            {editando ? "Cerrar" : "Editar"}
          </button>
          <form action={eliminarPatrocinador}>
            <input type="hidden" name="id" value={patrocinador.id} />
            <button
              type="submit"
              className="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {t("eliminar")}
            </button>
          </form>
        </div>
      </div>

      {editando && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <FormularioEditarPatrocinador userId={userId} patrocinador={patrocinador} />
        </div>
      )}
    </li>
  );
}

function BotonMover({
  id,
  direccion,
  desactivado,
}: {
  id: string;
  direccion: "arriba" | "abajo";
  desactivado: boolean;
}) {
  return (
    <form action={moverPatrocinador}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direccion" value={direccion} />
      <button
        type="submit"
        disabled={desactivado}
        aria-label={direccion === "arriba" ? "Subir en la lista" : "Bajar en la lista"}
        className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {direccion === "arriba" ? "↑" : "↓"}
      </button>
    </form>
  );
}

/** Campos comunes al alta y a la edición, para no escribirlos dos veces. */
function CamposPatrocinador({
  userId,
  patrocinador,
  logoUrl,
  setLogoUrl,
}: {
  userId: string;
  patrocinador?: ClubSponsor;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
}) {
  const t = useTranslations("panel.perfil2");
  const [tier, setTier] = useState<SponsorTier>(patrocinador?.tier ?? "colaborador");
  const logoActual = logoUrl || patrocinador?.logoUrl || "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta={t("nombre")}>
          <input name="name" required defaultValue={patrocinador?.name} className={clasesInput} />
        </Campo>
        <Campo etiqueta={t("web")}>
          <input
            name="website"
            type="url"
            placeholder="https://"
            defaultValue={patrocinador?.website ?? ""}
            className={clasesInput}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Categoría"
          ayuda="Cómo aparece agrupado en tu página pública."
        >
          <select
            name="tier"
            value={tier}
            onChange={(evento) => setTier(evento.target.value as SponsorTier)}
            className={clasesInput}
          >
            {NIVELES_PATROCINADOR.map((nivel) => (
              <option key={nivel} value={nivel}>
                {NOMBRE_NIVEL[nivel]}
              </option>
            ))}
          </select>
        </Campo>

        {tier === "otro" ? (
          <Campo
            etiqueta="Nombre de la categoría"
            ayuda="Por ejemplo: Patrocinador técnico, Proveedor oficial."
          >
            <input
              name="tierLabel"
              required
              maxLength={40}
              defaultValue={patrocinador?.tierLabel ?? ""}
              className={clasesInput}
            />
          </Campo>
        ) : (
          <Campo etiqueta="Patrocina desde (año)" ayuda="Opcional.">
            <input
              name="sinceYear"
              type="number"
              min={1900}
              max={2100}
              defaultValue={patrocinador?.sinceYear ?? ""}
              className={clasesInput}
            />
          </Campo>
        )}
      </div>

      {tier === "otro" && (
        <Campo etiqueta="Patrocina desde (año)" ayuda="Opcional.">
          <input
            name="sinceYear"
            type="number"
            min={1900}
            max={2100}
            defaultValue={patrocinador?.sinceYear ?? ""}
            className={clasesInput}
          />
        </Campo>
      )}

      <Campo
        etiqueta="Qué aporta"
        ayuda="Dos líneas: qué patrocina, desde cuándo o por qué colabora. Máximo 400 caracteres."
      >
        <textarea
          name="description"
          maxLength={400}
          defaultValue={patrocinador?.description ?? ""}
          className={clasesTextarea}
        />
      </Campo>

      <Campo etiqueta="Logo">
        <div className="flex items-center gap-3">
          {logoActual && (
            <Image
              src={logoActual}
              alt="Logo del patrocinador"
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-white object-contain"
              unoptimized
            />
          )}
          <ImageUploader
            userId={userId}
            carpeta="patrocinadores"
            label={logoActual ? "Cambiar logo" : "Subir logo"}
            onSubido={(url) => setLogoUrl(url)}
          />
        </div>
      </Campo>
      <input type="hidden" name="logoUrl" value={logoUrl} />
    </>
  );
}

function FormularioNuevoPatrocinador({
  userId,
  formAction,
  estado,
}: {
  userId: string;
  formAction: (formData: FormData) => void;
  estado: EstadoGuardado;
}) {
  const t = useTranslations("panel.perfil2");
  const [logoUrl, setLogoUrl] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <CamposPatrocinador userId={userId} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Patrocinador añadido." : null} />

      <BotonEnviar>{t("anadirPatrocinador")}</BotonEnviar>
    </form>
  );
}

function FormularioEditarPatrocinador({
  userId,
  patrocinador,
}: {
  userId: string;
  patrocinador: ClubSponsor;
}) {
  const [estado, formAction] = useActionState(editarPatrocinador, null);
  const [logoUrl, setLogoUrl] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={patrocinador.id} />
      <CamposPatrocinador
        userId={userId}
        patrocinador={patrocinador}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
      />

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Cambios guardados." : null} />

      <BotonEnviar>Guardar cambios</BotonEnviar>
    </form>
  );
}
