"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState } from "react";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { agruparPatrocinadoresPorNivel } from "@/lib/club-mappers";
import { NIVELES_PATROCINADOR, type ClubSponsor, type SponsorTier } from "@/lib/types";
import {
  agregarPatrocinador,
  avisarPatrocinador,
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
      {/* La cabecera —logo, nombre y botones— en una fila que puede
          partirse, y la descripción entera debajo.
          *
          * Antes iba todo en una sola fila: los cuatro botones son
          * intocables (`shrink-0`) y en un teléfono se comen unos 220
          * de los 330 px que hay. A la descripción le quedaban sesenta
          * y pico, y salía a palabra por línea. Se leía en vertical,
          * que es justo lo que no hace nadie. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {/* El ancho mínimo es lo que hace que la fila se parta. Sin él,
            `flex-1` deja que este bloque se encoja hasta cero: los
            botones seguirían en su sitio y el que saldría a palabra por
            línea sería el nombre. El problema cambiaría de sitio, no se
            arreglaría. */}
        <div className="flex min-w-[10rem] flex-1 items-start gap-3">
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
          <AccionConConfirmacion
            accion={eliminarPatrocinador}
            id={patrocinador.id}
            nombre={patrocinador.name}
            etiqueta={t("eliminar")}
            clases="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
          />
        </div>
      </div>

      {/* A todo el ancho. `whitespace-pre-line` porque el campo es un
          textarea: si el club escribe dos líneas, se ven dos líneas.
          Y `break-words` para que una palabra larga o una dirección
          pegada no se salgan de la tarjeta. */}
      {patrocinador.description && (
        <p className="mt-2 whitespace-pre-line break-words text-zinc-600">
          {patrocinador.description}
        </p>
      )}

      {patrocinador.website && (
        <p className="mt-1 break-words text-zinc-500">{patrocinador.website}</p>
      )}

      {editando && (
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
          <FormularioEditarPatrocinador userId={userId} patrocinador={patrocinador} />
          <AvisoAlPatrocinador patrocinador={patrocinador} />
        </div>
      )}
    </li>
  );
}

/**
 * Mandar a la empresa el agradecimiento del club con el enlace a su
 * página (migración 0027).
 *
 * El correo sale a nombre del club, no de ApoyaClub, y solo se manda una
 * vez. La casilla no es un trámite: escribir a una empresa que no ha
 * dado su dirección a nadie es spam en el sentido legal, y lo que
 * sostiene este envío es que el club sí tiene relación con ella.
 */
function AvisoAlPatrocinador({ patrocinador }: { patrocinador: ClubSponsor }) {
  const [estado, formAction] = useActionState(avisarPatrocinador, null);

  if (patrocinador.notifiedAt) {
    return (
      <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Avisada el{" "}
        {new Date(patrocinador.notifiedAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        . Solo se escribe una vez a cada empresa.
      </p>
    );
  }

  if (!patrocinador.contactEmail) {
    return (
      <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Añade el correo de la empresa aquí arriba y podrás mandarle un agradecimiento con el
        enlace a tu página.
      </p>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-teal-200 bg-teal-50 p-4">
      <input type="hidden" name="id" value={patrocinador.id} />

      <p className="text-sm font-medium text-zinc-900">Avisar a {patrocinador.name}</p>
      <p className="mt-1 text-xs text-zinc-600">
        Le llegará un correo <strong>a nombre de tu club</strong> dándole las gracias por
        apoyaros, con el enlace a tu página para que vea cómo aparece. Se manda una sola vez.
      </p>

      <label className="mt-3 flex items-start gap-2 text-xs text-zinc-700">
        <input
          type="checkbox"
          name="confirmaRelacion"
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
        />
        <span>
          Confirmo que esta empresa colabora con mi club y que tengo relación con esa dirección
          de correo.
        </span>
      </label>

      <div className="mt-3">
        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito
          mensaje={estado && "ok" in estado && estado.ok ? "Aviso enviado." : null}
        />
      </div>

      <BotonEnviar>Enviar agradecimiento</BotonEnviar>
    </form>
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

      <Campo
        etiqueta="Correo de la empresa (opcional)"
        ayuda="Solo lo ves tú: nunca se publica. Sirve para mandarles el agradecimiento con el enlace a tu página."
      >
        <input
          name="contactEmail"
          type="email"
          placeholder="contacto@empresa.es"
          defaultValue={patrocinador?.contactEmail ?? ""}
          className={clasesInput}
        />
      </Campo>

      {/* Se manda salvo que el club diga que no. Es lo que la mayoría
          quiere y lo que le conviene al patrocinador, pero el correo
          sale A NOMBRE DEL CLUB, así que tiene que poder decidirlo él y
          saber qué va a pasar antes de guardar. Por eso la frase va
          delante de la casilla y no dentro: el que no lee casillas sí
          lee la línea en negrita.

          Si a esa empresa ya se le escribió, no se enseña nada: no se
          manda un segundo correo en ningún caso. */}
      {!patrocinador?.notifiedAt && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm text-zinc-800">
            Al guardar, si has puesto un correo, se le enviará{" "}
            <strong className="font-semibold">a nombre de tu club</strong> un agradecimiento por
            apoyaros con el enlace a tu página. Se manda una sola vez.
          </p>

          <label className="mt-3 flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="noAvisar"
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
            />
            <span>
              No enviar el correo a esta empresa
              <span className="mt-0.5 block text-xs text-zinc-600">
                Márcalo si prefieres avisarles tú, o si todavía no has hablado con ellos. Podrás
                mandárselo más tarde desde su ficha.
              </span>
            </span>
          </label>
        </div>
      )}

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
      <AvisoExito
        mensaje={
          estado && "ok" in estado && estado.ok ? (estado.nota ?? "Patrocinador añadido.") : null
        }
      />

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
      <AvisoExito
        mensaje={
          estado && "ok" in estado && estado.ok ? (estado.nota ?? "Cambios guardados.") : null
        }
      />

      <BotonEnviar>Guardar cambios</BotonEnviar>
    </form>
  );
}
