"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ContactoEmpresa } from "@/lib/empresas";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "../../panel/components/SeccionCard";
import { CamposDeContacto } from "../components/CamposDeContacto";
import { guardarFichaEmpresa } from "../actions";

export type DatosFicha = {
  nombre: string;
  sector: string;
  localidad: string;
  provincia: string;
  web: string;
  descripcion: string;
  enElDirectorio: boolean;
  quiereAvisos: boolean;
  contacto: ContactoEmpresa;
};

/**
 * La ficha que ve un club.
 *
 * Todo opcional menos el nombre. La empresa se registró para ofrecer
 * algo, no para rellenar un perfil: exigirle sector, provincia y
 * descripción antes de dejarla hacer nada es la forma más rápida de que
 * cierre la pestaña.
 */
export function FichaForm({ datos }: { datos: DatosFicha }) {
  const [estado, formAction] = useActionState(guardarFichaEmpresa, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SeccionCard titulo="Tu empresa" descripcion="Lo que ve un club antes de escribirte.">
        <div className="flex flex-col gap-4">
          <Campo etiqueta="Nombre *">
            <input
              name="nombre"
              required
              maxLength={150}
              defaultValue={datos.nombre}
              className={clasesInput}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Sector" ayuda="A qué os dedicáis, en dos palabras.">
              <input
                name="sector"
                maxLength={100}
                defaultValue={datos.sector}
                placeholder="Clínica de fisioterapia"
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta="Web">
              <input
                name="web"
                type="url"
                maxLength={200}
                defaultValue={datos.web}
                placeholder="https://…"
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta="Localidad">
              <input
                name="localidad"
                maxLength={100}
                defaultValue={datos.localidad}
                placeholder="Benidorm"
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta="Provincia">
              <input
                name="provincia"
                maxLength={80}
                defaultValue={datos.provincia}
                placeholder="Alicante"
                className={clasesInput}
              />
            </Campo>
          </div>

          <Campo
            etiqueta="Presentación"
            ayuda="Máximo 600 caracteres. Quién sois y por qué os interesa el deporte de base."
          >
            <textarea
              name="descripcion"
              maxLength={600}
              defaultValue={datos.descripcion}
              className={clasesTextarea}
            />
          </Campo>
        </div>
      </SeccionCard>

      <SeccionCard
        titulo="Contacto"
        descripcion="Cómo te escriben los clubes. Es lo mismo que pide el formulario de publicar."
      >
        <CamposDeContacto contacto={datos.contacto} />
      </SeccionCard>

      <SeccionCard
        titulo="Salir en el directorio"
        descripcion="El listado público de empresas que los clubes miran para saber a quién escribir."
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="enElDirectorio"
            defaultChecked={datos.enElDirectorio}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
          />
          <span>
            <span className="block font-medium text-zinc-900">
              Quiero aparecer y que los clubes me escriban
            </span>
            <span className="mt-1 block text-zinc-500">
              Si publicas una oferta esto se enciende solo: una oferta que no se ve no sirve de
              nada. Apagándolo dejas de salir, y tus ofertas dejan de verse con él.
            </span>
          </span>
        </label>
      </SeccionCard>

      <SeccionCard
        titulo="Avisos por correo"
        descripcion="Lo que hace que no tengas que estar entrando a mirar."
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="quiereAvisos"
            defaultChecked={datos.quiereAvisos}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
          />
          <span>
            <span className="block font-medium text-zinc-900">
              Avísame cuando un club busque algo que ofrezco
            </span>
            <span className="mt-1 block text-zinc-500">
              Un correo, como mucho al día, solo con lo que encaja con tus categorías. Si has
              puesto provincia, solo de clubes de tu provincia.
            </span>
          </span>
        </label>
      </SeccionCard>

      <AvisoError mensaje={estado?.error} />
      <AvisoExito mensaje={estado?.ok ? "Guardado." : null} />

      <BotonEnviar>Guardar ficha</BotonEnviar>
    </form>
  );
}
