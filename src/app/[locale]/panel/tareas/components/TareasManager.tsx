"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "../../components/SeccionCard";
import {
  agruparPorEmpresa,
  estadoVisible,
  hoyISO,
  type TareaPatrocinio,
} from "@/lib/tareas-patrocinio";
import { crearTarea } from "../actions";
import { TareaFila } from "./TareaFila";

type Filtro = "pendientes" | "caducadas" | "hechas" | "todas";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "pendientes", etiqueta: "Pendientes" },
  { id: "caducadas", etiqueta: "Caducadas" },
  { id: "hechas", etiqueta: "Hechas" },
  { id: "todas", etiqueta: "Todas" },
];

/**
 * La agenda de compromisos del club, agrupada por empresa.
 *
 * Por empresa y no por fecha porque es como el club piensa en esto:
 * la pregunta que se hace no es "¿qué toca el martes?", es "¿qué le
 * debo a la ferretería?". Lo que toca hoy ya está arriba, en su propio
 * bloque, y también en la portada del panel.
 */
export function TareasManager({
  tareas,
  empresasConocidas,
}: {
  tareas: TareaPatrocinio[];
  empresasConocidas: string[];
}) {
  const [estado, formAction] = useActionState(crearTarea, null);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const formulario = useRef<HTMLFormElement>(null);
  const hoy = hoyISO();

  // El formulario se vacía al guardar bien: el club suele meter varias
  // tareas seguidas para la misma empresa y dejar el texto anterior
  // dentro solo provoca duplicados a medio corregir. Va en un efecto
  // porque tocar el formulario durante el render no está permitido.
  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  const visibles = useMemo(() => {
    if (filtro === "todas") return tareas;
    return tareas.filter((tarea) => {
      const visible = estadoVisible(tarea, hoy);
      if (filtro === "hechas") return visible === "hecha";
      if (filtro === "caducadas") return visible === "caducada";
      return tarea.estado === "pendiente";
    });
  }, [tareas, filtro, hoy]);

  const grupos = useMemo(() => agruparPorEmpresa(visibles, hoy), [visibles, hoy]);

  return (
    <div className="flex flex-col gap-6">
      <SeccionCard
        titulo="Añadir algo que hay que hacer"
        descripcion="Una línea por cada cosa prometida: una publicación, un vídeo, una visita, una valla."
      >
        <form ref={formulario} action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Empresa"
              ayuda="No hace falta que esté registrada en ApoyaClub."
            >
              <input
                name="empresa"
                required
                maxLength={120}
                list="empresas-conocidas"
                placeholder="Ferretería Ramírez"
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta="Qué hay que hacer">
              <input
                name="accion"
                required
                maxLength={200}
                placeholder="2 publicaciones en Instagram"
                className={clasesInput}
              />
            </Campo>
          </div>

          {/* El desplegable se rellena con las empresas que el club ya ha
              escrito antes. Sin esto, la misma empresa acaba en la lista
              como "Ferreteria Ramirez", "ferretería ramírez" y "Ramírez",
              y los grupos dejan de servir para nada. */}
          <datalist id="empresas-conocidas">
            {empresasConocidas.map((empresa) => (
              <option key={empresa} value={empresa} />
            ))}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Desde (opcional)" ayuda="Si es algo que dura, como una valla.">
              <input name="inicio" type="date" className={clasesInput} />
            </Campo>

            <Campo etiqueta="Fecha límite" ayuda="El día en que tiene que estar hecho.">
              <input name="fin" type="date" required className={clasesInput} />
            </Campo>
          </div>

          <Campo etiqueta="Notas (opcional)">
            <textarea
              name="notas"
              maxLength={1000}
              placeholder="Etiquetar a @ferreteriaramirez. Fotos del partido del sábado."
              className={clasesTextarea}
            />
          </Campo>

          <AvisoError mensaje={estado?.error} />
          <AvisoExito mensaje={estado?.ok ? "Añadido." : null} />

          <BotonEnviar>Añadir a la lista</BotonEnviar>
        </form>
      </SeccionCard>

      <SeccionCard
        titulo="Todo lo que has prometido"
        descripcion="Agrupado por empresa. Delante, las que tienen algo vencido."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => setFiltro(opcion.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === opcion.id
                  ? "bg-teal-700 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        {grupos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
            {tareas.length === 0
              ? "Todavía no has apuntado nada. Empieza por lo que le has prometido a tu patrocinador principal: si está escrito, se cumple."
              : "No hay nada en este filtro."}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {grupos.map((grupo) => (
              <div key={grupo.empresa}>
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <h3 className="font-semibold text-zinc-900">{grupo.empresa}</h3>
                  {grupo.caducadas > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {grupo.caducadas} vencida{grupo.caducadas === 1 ? "" : "s"}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {grupo.pendientes} pendiente{grupo.pendientes === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {grupo.tareas.map((tarea) => (
                    <TareaFila key={tarea.id} tarea={tarea} hoy={hoy} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SeccionCard>
    </div>
  );
}
