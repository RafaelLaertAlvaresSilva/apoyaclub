"use client";

import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { enviarPropuesta } from "../../actions";

/**
 * El formulario con el que un club le escribe a una empresa del
 * directorio.
 *
 * Solo se enseña a los clubes con sesión iniciada. A todo lo demás
 * —visitantes, empresas— se le enseña lo que hay que hacer para poder
 * escribir, que es más útil que un formulario que va a fallar.
 */
export function ProponerPatrocinio({
  companyId,
  slug,
  nombreEmpresa,
  yaEscrita,
}: {
  companyId: string;
  slug: string;
  nombreEmpresa: string;
  yaEscrita: boolean;
}) {
  const [estado, formAction] = useActionState(enviarPropuesta, null);

  if (yaEscrita || estado?.ok) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <p className="font-medium text-teal-900">Ya le has escrito a {nombreEmpresa}</p>
        <p className="mt-1 text-sm text-teal-800">
          Tu propuesta está en su bandeja. Solo se puede mandar una por empresa: si insistieras, lo
          único que conseguirías es que se diera de baja del directorio.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-zinc-200 bg-white p-5">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="slug" value={slug} />

      <h2 className="text-base font-semibold text-zinc-900">Escríbele a {nombreEmpresa}</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Cuéntale quién sois, a cuánta gente llegáis y qué le ofrecéis en concreto. Una propuesta
        con una cifra y una fecha se responde; una carta genérica, no.
      </p>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Tu mensaje</span>
        <textarea
          name="mensaje"
          required
          minLength={20}
          maxLength={2000}
          rows={6}
          placeholder="Somos el Club Balonmano Turia, ocho equipos y 120 jugadores en el barrio. Buscamos un patrocinador para las camisetas de la temporada: 1.200 € e incluye el logo en el pecho, dos publicaciones al mes en Instagram y una visita de los jugadores a tu tienda."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </label>

      <div className="mt-3">
        <AvisoError mensaje={estado?.error} />
      </div>

      <div className="mt-3">
        <BotonEnviar>Enviar propuesta</BotonEnviar>
      </div>
    </form>
  );
}
