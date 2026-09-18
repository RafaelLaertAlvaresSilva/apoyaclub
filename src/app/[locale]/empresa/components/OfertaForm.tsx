"use client";

import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CATEGORIAS_NECESIDAD } from "@/lib/opportunities";
import {
  TIPOS_DE_OFERTA,
  type ContactoEmpresa,
  type OfertaDeEmpresa,
  type TipoDeOferta,
} from "@/lib/empresas";
import { Campo, clasesInput, clasesTextarea } from "../../panel/components/SeccionCard";
import { crearOferta, editarOferta } from "../actions";
import { CamposDeContacto } from "./CamposDeContacto";

/**
 * Lo que la empresa ofrece, en un formulario.
 *
 * La categoría no es decoración: es lo que permite cruzar esta oferta
 * con lo que los clubes han apuntado que necesitan. Una oferta sin
 * categoría se ve igual, pero no la encuentra nadie filtrando.
 *
 * El importe solo aparece en las ofertas de dinero. En un servicio, lo
 * que se ofrece ES el servicio: ponerle precio confunde a las dos
 * partes — mismo criterio que en las necesidades del club.
 */
export function OfertaForm({
  oferta,
  contacto,
  alTerminar,
}: {
  /** Si viene, se edita; si no, se crea una nueva. */
  oferta?: OfertaDeEmpresa;
  /** El de la empresa, para rellenarlo ya puesto. */
  contacto: ContactoEmpresa;
  alTerminar?: () => void;
}) {
  const [estado, formAction] = useActionState(oferta ? editarOferta : crearOferta, null);
  const [tipo, setTipo] = useState<TipoDeOferta>(oferta?.tipo ?? "service");

  // Al guardar bien, el padre cierra el formulario. Se mira el estado
  // en el render en vez de con un efecto: un efecto que además cambia
  // estado provoca un render de más y es fácil que se quede a medias.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado?.ok) alTerminar?.();
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {oferta && <input type="hidden" name="id" value={oferta.id} />}

      <Campo etiqueta="Qué ofreces" ayuda="Concreto. Es lo primero y a veces lo único que lee el club.">
        <input
          name="titulo"
          required
          minLength={3}
          maxLength={150}
          defaultValue={oferta?.titulo ?? ""}
          placeholder="4 sesiones de fisioterapia al mes"
          className={clasesInput}
        />
      </Campo>

      <Campo etiqueta="De qué tipo" grupo>
        <div className="flex flex-col gap-2 sm:flex-row">
          {TIPOS_DE_OFERTA.map((opcion) => (
            <label
              key={opcion.id}
              className={`flex-1 cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                tipo === opcion.id ? "border-teal-500 bg-teal-50" : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  value={opcion.id}
                  checked={tipo === opcion.id}
                  onChange={() => setTipo(opcion.id)}
                  className="h-4 w-4 border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
                />
                <span className="font-medium text-zinc-900">{opcion.etiqueta}</span>
              </span>
              <span className="mt-1 block text-xs text-zinc-500">{opcion.ayuda}</span>
            </label>
          ))}
        </div>
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Categoría" ayuda="Es lo que hace que te encuentre el club que busca justo esto.">
          <select name="categoria" defaultValue={oferta?.categoria ?? ""} className={clasesInput}>
            <option value="">Sin categoría</option>
            {CATEGORIAS_NECESIDAD.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Provincia" ayuda="Déjalo en blanco si puedes llegar a toda España.">
          <input
            name="provincia"
            maxLength={80}
            defaultValue={oferta?.provincia ?? ""}
            placeholder="Alicante"
            className={clasesInput}
          />
        </Campo>
      </div>

      {tipo === "money" && (
        <Campo etiqueta="Importe (€)" ayuda="Orientativo. Lo acabáis de acordar el club y tú.">
          <input
            name="valor"
            type="number"
            min={0}
            step="0.01"
            defaultValue={oferta?.valor ?? ""}
            placeholder="500"
            className={clasesInput}
          />
        </Campo>
      )}

      <Campo etiqueta="Detalle" ayuda="Con qué frecuencia, para cuántas personas, en qué condiciones.">
        <textarea
          name="descripcion"
          maxLength={1000}
          defaultValue={oferta?.descripcion ?? ""}
          placeholder="En nuestra clínica de Benidorm, con cita previa, de lunes a viernes."
          className={clasesTextarea}
        />
      </Campo>

      <Campo
        etiqueta="Qué pides a cambio"
        ayuda="Lo que esperas del club. Si no pides nada, dilo también: ayuda más de lo que parece."
      >
        <input
          name="pideACambio"
          maxLength={500}
          defaultValue={oferta?.pideACambio ?? ""}
          placeholder="Nuestro logo en la camiseta de entrenamiento y una mención al mes"
          className={clasesInput}
        />
      </Campo>

      <CamposDeContacto contacto={contacto} />

      <AvisoError mensaje={estado?.error} />
      <AvisoExito mensaje={estado?.ok ? "Guardado." : null} />

      <div className="flex flex-wrap gap-2">
        <BotonEnviar>{oferta ? "Guardar cambios" : "Publicar"}</BotonEnviar>
        {alTerminar && (
          <button
            type="button"
            onClick={alTerminar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
