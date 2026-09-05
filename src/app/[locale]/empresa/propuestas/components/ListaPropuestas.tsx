"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { AvisoError } from "@/components/AvisoError";
import type { PropuestaConClub } from "@/lib/propuestas";
import type { ProposalStatus } from "@/lib/types";
import { cambiarEstadoPropuesta } from "../actions";

const ETIQUETA_ESTADO: Record<ProposalStatus, string> = {
  new: "Sin abrir",
  seen: "Leída",
  in_conversation: "Hablando con ellos",
  discarded: "Descartada",
};

const CLASES_ESTADO: Record<ProposalStatus, string> = {
  new: "bg-red-50 text-red-700 border-red-200",
  seen: "bg-zinc-50 text-zinc-600 border-zinc-200",
  in_conversation: "bg-teal-50 text-teal-700 border-teal-200",
  discarded: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

/**
 * Las propuestas que le han llegado a la empresa.
 *
 * No hay chat: ApoyaClub pone en contacto y se aparta. Esto es una
 * bandeja para que no se pierda ninguna y para saber por cuál se iba.
 */
export function ListaPropuestas({ propuestas }: { propuestas: PropuestaConClub[] }) {
  if (propuestas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-900">Todavía no te ha escrito ningún club</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
          Comprueba que tienes activada la casilla de aparecer en el directorio, y que has
          rellenado tu provincia y tu presentación: es por lo que te encuentran.
        </p>
        <Link
          href="/empresa"
          className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          Revisar mi perfil
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {propuestas.map((propuesta) => (
        <Propuesta key={propuesta.id} propuesta={propuesta} />
      ))}
    </ul>
  );
}

function Propuesta({ propuesta }: { propuesta: PropuestaConClub }) {
  const [estado, cambiar] = useActionState(cambiarEstadoPropuesta, null);

  return (
    <li
      className={`rounded-xl border bg-white p-5 ${
        propuesta.status === "new" ? "border-red-200" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {propuesta.clubLogo ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1">
              <Image
                src={propuesta.clubLogo}
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-700">
              {propuesta.clubNombre.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <p className="font-semibold text-zinc-900">{propuesta.clubNombre}</p>
            <p className="text-sm text-zinc-500">
              {[propuesta.clubCiudad, new Date(propuesta.createdAt).toLocaleDateString("es-ES")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${CLASES_ESTADO[propuesta.status]}`}
        >
          {ETIQUETA_ESTADO[propuesta.status]}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-line rounded-lg bg-zinc-50 p-4 text-sm text-zinc-800">
        {propuesta.message}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
        {propuesta.clubSlug && (
          <Link
            href={`/club/${propuesta.clubSlug}`}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            Ver el club
          </Link>
        )}

        {propuesta.status !== "in_conversation" && (
          <Boton accion={cambiar} id={propuesta.id} estado="in_conversation">
            Estoy hablando con ellos
          </Boton>
        )}
        {propuesta.status === "new" && (
          <Boton accion={cambiar} id={propuesta.id} estado="seen">
            Marcar como leída
          </Boton>
        )}
        {propuesta.status !== "discarded" && (
          <Boton accion={cambiar} id={propuesta.id} estado="discarded">
            Descartar
          </Boton>
        )}
      </div>

      {estado?.error && (
        <div className="mt-3">
          <AvisoError mensaje={estado.error} />
        </div>
      )}
    </li>
  );
}

function Boton({
  accion,
  id,
  estado,
  children,
}: {
  accion: (formData: FormData) => void;
  id: string;
  estado: ProposalStatus;
  children: React.ReactNode;
}) {
  return (
    <form action={accion}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
      >
        {children}
      </button>
    </form>
  );
}
