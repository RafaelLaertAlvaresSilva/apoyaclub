"use client";

import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Link } from "@/i18n/navigation";
import { darseDeBajaDeAvisos, type EstadoBaja } from "./actions";

/**
 * La baja se confirma con un botón, no con el propio enlace.
 *
 * Los antivirus y los filtros de correo abren los enlaces de los
 * mensajes antes que el destinatario, para comprobar a dónde llevan. Si
 * la baja se hiciera al abrir el enlace, esos filtros darían de baja a
 * medio mundo sin que nadie hubiera pulsado nada.
 */
export function BajaForm({ token }: { token: string }) {
  const [estado, formAction] = useActionState<EstadoBaja, FormData>(
    async (_previo, formData) => darseDeBajaDeAvisos(formData),
    null,
  );

  if (estado && "ok" in estado) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="font-medium text-zinc-900">Hecho. No te mandaremos más avisos.</p>
        <p className="mt-2 text-sm text-zinc-600">
          Tus ofertas siguen publicadas y los clubes pueden seguir escribiéndote. Si algún día
          quieres volver a recibirlos, la casilla está en tu panel.
        </p>
        <Link
          href="/empresa"
          className="mt-4 inline-block rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
        >
          Ir a mi panel
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-zinc-200 bg-white p-6">
      <input type="hidden" name="token" value={token} />

      <p className="text-zinc-700">
        Dejarás de recibir los correos que te avisan cuando un club busca algo que tu empresa
        ofrece.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Tus ofertas siguen publicadas y los clubes pueden seguir escribiéndote. Esto solo apaga los
        correos.
      </p>

      <div className="mt-4">
        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      </div>

      <div className="mt-4">
        <BotonEnviar>Sí, dejar de recibir avisos</BotonEnviar>
      </div>
    </form>
  );
}
