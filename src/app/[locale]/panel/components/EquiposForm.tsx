"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import { BotonEnviar } from "@/components/BotonEnviar";
import { etiquetaEquipo } from "@/lib/opportunities";
import type { ClubTeam } from "@/lib/types";
import { actualizarEquipo, agregarEquipo, eliminarEquipo, guardarFotoEquipo } from "../actions";
import { AvisoDerechosDeImagen } from "./AvisoDerechosDeImagen";
import { ImageUploader } from "./ImageUploader";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

/** Los valores que se guardan tal cual (en español) en `club_teams.gender`. */
const SEXOS = ["Masculino", "Femenino", "Mixto"];

export function EquiposForm({ equipos, userId }: { equipos: ClubTeam[]; userId: string }) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(agregarEquipo, null);

  return (
    <SeccionCard
      titulo={t("equipos")}
      descripcion={t("anadeCadaEquipoDel")}
    >
      <div className="mb-4">
        <AvisoDerechosDeImagen />
      </div>

      {equipos.length > 0 && (
        <ul className="mb-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {equipos.map((equipo) => (
            <FilaEquipo key={equipo.id} equipo={equipo} userId={userId} etiquetaEliminar={t("eliminar")} />
          ))}
        </ul>
      )}

      {/* La key cambia cuando se añade un equipo (revalidatePath refresca
          `equipos`), lo que remonta el formulario y limpia sus campos. */}
      <form key={equipos.length} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("deporte")}>
            <input name="sport" required placeholder={t("futbolBaloncesto")} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("categoria")}>
            <input name="category" placeholder={t("cadeteSenior")} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("genero")}>
            <SelectorDeSexo nombre="gender" />
          </Campo>
          <Campo etiqueta={t("numeroDeJugadores")}>
            <input name="playerCount" type="number" min={0} className={clasesInput} />
          </Campo>
        </div>

        <Campo etiqueta={t("tipoDeEquipo")}>
          <select name="teamLevel" defaultValue="primer_equipo" className={clasesInput}>
            <option value="primer_equipo">{t("primerEquipo")}</option>
            <option value="cantera">{t("cantera")}</option>
          </select>
        </Campo>

        {/* Lo que de verdad le dice algo a una empresa. "Cadete" no
            significa nada fuera del mundillo; "Primera Autonómica,
            campeón provincial 2025" sí. */}
        <Campo etiqueta={t("enQueCompite")} ayuda={t("enQueCompiteAyuda")}>
          <input name="competitionLevel" maxLength={200} className={clasesInput} />
        </Campo>

        <Campo etiqueta={t("logrosEquipo")} ayuda={t("logrosEquipoAyuda")}>
          <textarea name="achievements" maxLength={1000} className={clasesTextarea} />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? t("equipoAnadido") : null} />

        <BotonEnviar>{t("anadirEquipo")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}

/**
 * Un equipo de la lista, con su foto.
 *
 * La foto se guarda al subirla, sin pasar por el botón de guardar del
 * formulario de abajo: ese es para dar de alta un equipo nuevo, y
 * mezclar las dos cosas haría que subir una foto borrase lo que el club
 * estuviera escribiendo.
 */
function FilaEquipo({
  equipo,
  userId,
  etiquetaEliminar,
}: {
  equipo: ClubTeam;
  userId: string;
  etiquetaEliminar: string;
}) {
  const t = useTranslations("panel.perfil");
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [, iniciarTransicion] = useTransition();

  function guardar(url: string | null) {
    iniciarTransicion(async () => {
      const resultado = await guardarFotoEquipo(equipo.id, url);
      setErrorFoto(resultado && "error" in resultado ? (resultado.error ?? null) : null);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
      {equipo.photoUrl ? (
        <Image
          src={equipo.photoUrl}
          alt={t("fotoDe", { deporte: equipo.sport })}
          width={96}
          height={64}
          className="h-16 w-24 shrink-0 rounded-lg border border-zinc-200 object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          {t("sinFoto")}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900">
          {equipo.sport}
          {equipo.category ? ` · ${equipo.category}` : ""}
        </p>
        <p className="text-zinc-500">
          {equipo.teamLevel === "cantera" ? t("cantera") : t("primerEquipo")}
          {equipo.gender ? ` · ${SEXOS.includes(equipo.gender) ? t(`sexo.${equipo.gender}`) : equipo.gender}` : ""}
          {equipo.playerCount != null ? ` · ${t("jugadoresN", { n: equipo.playerCount })}` : ""}
        </p>
        {equipo.competitionLevel && (
          <p className="mt-0.5 text-zinc-600">{equipo.competitionLevel}</p>
        )}
        {equipo.achievements && (
          <p className="mt-0.5 whitespace-pre-line text-xs text-zinc-500">{equipo.achievements}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditando((abierto) => !abierto)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
          >
            {editando ? t("cerrar") : t("editarDatos")}
          </button>
          <ImageUploader
            userId={userId}
            carpeta="equipos"
            label={equipo.photoUrl ? t("cambiarFoto") : t("subirFoto")}
            onSubido={async (url) => guardar(url)}
          />
          {equipo.photoUrl && (
            <button
              type="button"
              onClick={() => guardar(null)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              {t("quitarFoto")}
            </button>
          )}
        </div>

        {errorFoto && <p className="mt-2 text-xs text-red-700">{errorFoto}</p>}

        {editando && <EditorDeEquipo equipo={equipo} />}
      </div>

      <AccionConConfirmacion
        accion={eliminarEquipo}
        id={equipo.id}
        nombre={etiquetaEquipo(equipo) ?? equipo.sport}
        etiqueta={etiquetaEliminar}
        clases="text-sm font-medium text-red-600 hover:underline"
      />
    </li>
  );
}


/**
 * Las tres opciones normales, en un desplegable en vez de texto libre.
 *
 * Antes era una casilla abierta y salían "Masculino", "masculino", "M" y
 * "Masc." para lo mismo, así que separar la información de los equipos
 * masculinos y los femeninos —que es justo lo que una empresa quiere
 * mirar— no había manera. Lo que ya estuviera escrito se respeta: sale
 * como una opción más.
 */
function SelectorDeSexo({ nombre, valor }: { nombre: string; valor?: string | null }) {
  const t = useTranslations("panel.perfil");
  const normales = SEXOS;
  const guardado = valor ?? "";
  const conocido = guardado === "" || normales.includes(guardado);

  return (
    <select name={nombre} defaultValue={guardado} className={clasesInput}>
      <option value="">{t("sinEspecificar")}</option>
      {normales.map((opcion) => (
        <option key={opcion} value={opcion}>
          {t(`sexo.${opcion}`)}
        </option>
      ))}
      {!conocido && <option value={guardado}>{guardado}</option>}
    </select>
  );
}

/** Los datos de un equipo ya creado, para poder corregirlos sin
 * borrarlo y volver a crearlo (que se llevaba por delante la foto y las
 * oportunidades asociadas). */
function EditorDeEquipo({ equipo }: { equipo: ClubTeam }) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(actualizarEquipo, null);

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-teal-200 bg-teal-50/40 p-3">
      <input type="hidden" name="id" value={equipo.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta={t("deporte")}>
          <input name="sport" required defaultValue={equipo.sport} className={clasesInput} />
        </Campo>
        <Campo etiqueta={t("categoria")}>
          <input name="category" defaultValue={equipo.category ?? ""} className={clasesInput} />
        </Campo>
        <Campo etiqueta={t("genero")}>
          <SelectorDeSexo nombre="gender" valor={equipo.gender} />
        </Campo>
        <Campo etiqueta={t("numeroDeJugadores")}>
          <input
            name="playerCount"
            type="number"
            min={0}
            defaultValue={equipo.playerCount ?? ""}
            className={clasesInput}
          />
        </Campo>
      </div>

      <Campo etiqueta={t("tipoDeEquipo")}>
        <select name="teamLevel" defaultValue={equipo.teamLevel} className={clasesInput}>
          <option value="primer_equipo">{t("primerEquipo")}</option>
          <option value="cantera">{t("cantera")}</option>
        </select>
      </Campo>

      <Campo etiqueta={t("enQueCompite")} ayuda={t("enQueCompiteAyudaCorta")}>
        <input
          name="competitionLevel"
          maxLength={200}
          defaultValue={equipo.competitionLevel ?? ""}
          className={clasesInput}
        />
      </Campo>

      <Campo etiqueta={t("logrosEquipo")}>
        <textarea
          name="achievements"
          maxLength={1000}
          defaultValue={equipo.achievements ?? ""}
          className={clasesTextarea}
        />
      </Campo>

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? t("guardado") : null} />

      <BotonEnviar>{t("guardarCambiosEquipo")}</BotonEnviar>
    </form>
  );
}
