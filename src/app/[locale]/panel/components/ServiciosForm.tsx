"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { BorrarConConfirmacion } from "@/components/BorrarConConfirmacion";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";
import {
  CATEGORIAS_SERVICIO,
  ETIQUETA_CATEGORIA_SERVICIO,
  type ServiceNeed,
} from "@/lib/service-needs";
import { cambiarEstadoServicio, eliminarServicio, guardarServicio } from "../actions";

/**
 * Lo que el club necesita, no lo que ofrece (migración 0016).
 *
 * Una empresa pequeña muchas veces no tiene presupuesto de patrocinio,
 * pero sí una clínica de fisioterapia, una furgoneta o una imprenta. Esta
 * sección es su puerta de entrada, y para el club es la forma de reducir
 * gastos sin pedir dinero.
 */
export function ServiciosForm({ servicios }: { servicios: ServiceNeed[] }) {
  const t = useTranslations("panel.servicios");
  const [estado, formAction] = useActionState(guardarServicio, null);

  const abiertos = servicios.filter((servicio) => servicio.status === "open");
  const cubiertos = servicios.filter((servicio) => servicio.status === "covered");

  return (
    <SeccionCard titulo={t("titulo")} descripcion={t("descripcion")}>
      {servicios.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {[...abiertos, ...cubiertos].map((servicio) => (
            <li
              key={servicio.id}
              className={`flex flex-wrap items-start gap-3 rounded-lg border p-3 ${
                servicio.status === "covered" ? "border-zinc-200 bg-zinc-50" : "border-zinc-200"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    servicio.status === "covered" ? "text-zinc-500 line-through" : "text-zinc-900"
                  }`}
                >
                  {servicio.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {ETIQUETA_CATEGORIA_SERVICIO[servicio.category]}
                </p>
                {servicio.description && (
                  <p className="mt-1 text-sm text-zinc-600">{servicio.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <form action={cambiarEstadoServicio}>
                  <input type="hidden" name="id" value={servicio.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={servicio.status === "open" ? "covered" : "open"}
                  />
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
                  >
                    {servicio.status === "open" ? t("marcarCubierto") : t("reabrir")}
                  </button>
                </form>

                <BorrarConConfirmacion
                  accion={eliminarServicio}
                  id={servicio.id}
                  nombre={servicio.title}
                  etiqueta={t("eliminar")}
                  clases="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-4 border-t border-zinc-100 pt-5">
        <Campo etiqueta={t("categoria")} ayuda={t("categoriaAyuda")}>
          <select name="category" defaultValue="salud" className={clasesInput}>
            {CATEGORIAS_SERVICIO.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.etiqueta} — {categoria.ejemplos}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta={t("queNecesitas")} ayuda={t("queNecesitasAyuda")}>
          <input name="title" required className={clasesInput} />
        </Campo>

        <Campo etiqueta={t("detalle")} ayuda={t("detalleAyuda")}>
          <textarea name="description" className={clasesTextarea} />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? t("guardado") : null} />

        <BotonEnviar>{t("anadir")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
