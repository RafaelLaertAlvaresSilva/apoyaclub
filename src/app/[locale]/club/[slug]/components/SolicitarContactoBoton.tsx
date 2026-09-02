"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CampoTrampa } from "@/components/CampoTrampa";
import { crearSolicitudContacto, type EstadoSolicitud } from "../contact-actions";
import { useSesionActual } from "../hooks/useSesionActual";

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

/**
 * Botón "Solicitar contacto" (Fase 8), usado tanto a nivel de club como
 * en cada oportunidad de la página pública del club. Solo tiene sentido
 * para una empresa con sesión iniciada (ver `useSesionActual`): para un
 * club se oculta, y para un visitante anónimo se convierte en un enlace
 * a iniciar sesión que vuelve a esta misma página después.
 */
export function SolicitarContactoBoton({
  clubId,
  clubName,
  opportunityId,
  opportunityTitle,
  variante = "primaria",
  children,
}: Props) {
  const sesion = useSesionActual();
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoSolicitud, FormData>(crearSolicitudContacto, null);

  useEffect(() => {
    if (estado && "ok" in estado && estado.ok) {
      const temporizador = setTimeout(() => setAbierto(false), 2500);
      return () => clearTimeout(temporizador);
    }
  }, [estado]);

  const clases = variante === "primaria" ? CLASES_PRIMARIA : CLASES_SECUNDARIA;

  if (sesion.cargando) {
    return (
      <span className={`${clases} opacity-50`} aria-hidden="true">
        {children}
      </span>
    );
  }

  // Un club no solicita contacto: solo tiene sentido para una empresa.
  if (sesion.rol === "club") return null;

  if (sesion.rol !== "empresa") {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={clases}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={clases}>
        {children}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Solicitar contacto</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {opportunityTitle ? `Sobre «${opportunityTitle}», con ${clubName}.` : `Con ${clubName}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="text-xl leading-none text-zinc-500 hover:text-zinc-600"
              >
                ×
              </button>
            </div>

            {estado && "ok" in estado && estado.ok ? (
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Solicitud enviada. {clubName} la recibirá en su panel y por email.
              </p>
            ) : (
              <form action={formAction} className="space-y-4">
                  <CampoTrampa />
                <input type="hidden" name="clubId" value={clubId} />
                {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}

                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-zinc-700">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={5}
                    placeholder="Cuéntale al club quién eres y qué tipo de colaboración te interesa…"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {estado && "error" in estado && estado.error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {estado.error}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    Cancelar
                  </button>
                  <BotonEnviarSolicitud />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BotonEnviarSolicitud() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando…" : "Enviar solicitud"}
    </button>
  );
}
