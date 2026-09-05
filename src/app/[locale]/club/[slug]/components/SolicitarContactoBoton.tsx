"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CampoTrampa } from "@/components/CampoTrampa";
import { crearSolicitudContacto, type EstadoSolicitud } from "../contact-actions";

type Props = {
  clubId: string;
  clubName: string;
  opportunityId?: string;
  opportunityTitle?: string;
  variante?: "primaria" | "secundaria";
  children: React.ReactNode;
};

const CLASES_PRIMARIA =
  "inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800";
const CLASES_SECUNDARIA =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100";

const clasesCampo =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

/**
 * "Escribir al club": el formulario con el que una empresa contacta,
 * desde la ficha del club o desde una oportunidad concreta.
 *
 * Ya no hace falta cuenta (migración 0034). Antes había que registrarse
 * como empresa, y eso era una puerta cerrada delante de lo único que
 * esta plataforma tiene que conseguir: que la empresa escriba. Quien
 * entra en la ficha de un club a las once de la noche no se abre una
 * cuenta, se va.
 *
 * Lo que se le pide es lo mínimo para que el club pueda contestarle:
 * nombre, correo y el mensaje. La empresa y el teléfono son opcionales.
 */
export function SolicitarContactoBoton({
  clubId,
  clubName,
  opportunityId,
  opportunityTitle,
  variante = "primaria",
  children,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoSolicitud, FormData>(
    crearSolicitudContacto,
    null,
  );

  useEffect(() => {
    if (estado && "ok" in estado && estado.ok) {
      const temporizador = setTimeout(() => setAbierto(false), 3000);
      return () => clearTimeout(temporizador);
    }
  }, [estado]);

  const clases = variante === "primaria" ? CLASES_PRIMARIA : CLASES_SECUNDARIA;
  const enviado = !!estado && "ok" in estado && !!estado.ok;

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={clases}>
        {children}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            {enviado ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-zinc-900">Mensaje enviado</p>
                <p className="mt-2 text-sm text-zinc-600">
                  {clubName} lo recibe ahora mismo y te contestará al correo que has puesto.
                </p>
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="clubId" value={clubId} />
                {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}
                <CampoTrampa />

                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Escribir a {clubName}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {opportunityTitle
                      ? `Sobre "${opportunityTitle}".`
                      : "Cuéntales quién eres y qué te interesa."}{" "}
                    No hace falta registrarse.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-zinc-700">Tu nombre</span>
                    <input name="nombre" required minLength={2} maxLength={120} className={clasesCampo} />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-zinc-700">
                      Empresa <span className="font-normal text-zinc-400">(opcional)</span>
                    </span>
                    <input name="empresa" maxLength={120} className={clasesCampo} />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-zinc-700">Tu correo</span>
                    <input name="correo" type="email" required maxLength={200} className={clasesCampo} />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-zinc-700">
                      Teléfono <span className="font-normal text-zinc-400">(opcional)</span>
                    </span>
                    <input name="telefono" type="tel" maxLength={40} className={clasesCampo} />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">Mensaje</span>
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    placeholder="Hola, tenemos una tienda en el barrio y nos interesa lo del patrocinio de las camisetas. ¿Podemos hablar?"
                    className={clasesCampo}
                  />
                </label>

                {estado && "error" in estado && estado.error && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {estado.error}
                  </p>
                )}

                <p className="text-xs text-zinc-500">
                  Tu nombre y tu correo se los mandamos al club para que pueda contestarte. Nada
                  más.
                </p>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancelar
                  </button>
                  <BotonDeEnvio />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BotonDeEnvio() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
    >
      {pending ? "Enviando…" : "Enviar mensaje"}
    </button>
  );
}
