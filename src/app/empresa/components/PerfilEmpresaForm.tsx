"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput } from "@/app/panel/components/SeccionCard";
import { OBJETIVOS_OPORTUNIDAD } from "@/lib/opportunities";
import type { CompanyProfile } from "@/lib/types";
import { guardarPerfilEmpresa } from "../actions";

export function PerfilEmpresaForm({ perfil }: { perfil: CompanyProfile | null }) {
  const [estado, formAction] = useActionState(guardarPerfilEmpresa, null);

  return (
    <SeccionCard
      titulo="Perfil de empresa"
      descripcion="Cómo te presentas a los clubes cuando solicitas contacto. Todos los campos son opcionales, pero cuantos más rellenes, más fácil se lo pones al club para responderte."
    >
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre de la empresa">
            <input name="name" defaultValue={perfil?.name ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta="Sector">
            <input
              name="sector"
              defaultValue={perfil?.sector ?? ""}
              placeholder="Ej. alimentación, construcción, tecnología…"
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta="Localidad">
            <input name="city" defaultValue={perfil?.city ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta="Web">
            <input
              name="website"
              type="url"
              defaultValue={perfil?.website ?? ""}
              placeholder="https://"
              className={clasesInput}
            />
          </Campo>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">Presupuesto orientativo</p>
          <p className="mb-2 text-xs text-zinc-400">
            Un rango aproximado en euros, solo como referencia para el club al leer tu solicitud.
            Nunca es una oferta cerrada.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="budgetMin"
              type="number"
              min={0}
              step="0.01"
              defaultValue={perfil?.budgetMin ?? ""}
              placeholder="Desde (€)"
              className={clasesInput}
            />
            <input
              name="budgetMax"
              type="number"
              min={0}
              step="0.01"
              defaultValue={perfil?.budgetMax ?? ""}
              placeholder="Hasta (€)"
              className={clasesInput}
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">Objetivos de patrocinio</p>
          <p className="mb-2 text-xs text-zinc-400">
            A qué público u objetivo quieres llegar patrocinando un club.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
              <label key={objetivo.id} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="objectives"
                  value={objetivo.id}
                  defaultChecked={perfil?.objectives.includes(objetivo.id) ?? false}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                {objetivo.etiqueta}
              </label>
            ))}
          </div>
        </div>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar perfil</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
