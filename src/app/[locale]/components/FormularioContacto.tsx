"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { enviarConsultaContacto, type EstadoContacto } from "../contact-actions";

/** Formulario de contacto de la landing (Fase 13). Ver `contact-actions.ts`. */
export function FormularioContacto() {
  const [estado, formAction] = useActionState<EstadoContacto, FormData>(enviarConsultaContacto, null);

  if (estado && "ok" in estado && estado.ok) {
    return <AvisoExito mensaje="Gracias, hemos recibido tu mensaje. Te responderemos por email en breve." />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

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
          placeholder="Cuéntanos si escribes como club, como empresa, o cualquier otra duda…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />

      <BotonEnviar>Enviar mensaje</BotonEnviar>
    </form>
  );
}
