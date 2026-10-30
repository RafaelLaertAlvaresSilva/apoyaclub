import type { User } from "@supabase/supabase-js";
import { esPaisValido, type Pais } from "@/lib/paises";
import type { Role } from "@/lib/types";

/**
 * Quién está dentro del admin y qué puede ver.
 *
 * - El administrador (Rafael) lo ve todo: todos los países, las
 *   finanzas, las empresas, las bajas y los representantes.
 * - Un representante ve y gestiona SOLO los clubes de su país (los
 *   mismos botones que el administrador, suspender incluido), y su
 *   comisión. Nada de dinero de otros países ni de la plataforma.
 *
 * Todo sale de `app_metadata`, que solo se escribe con la clave de
 * servicio: un representante no puede cambiarse de país ni subirse el
 * porcentaje desde su navegador.
 *
 * Un representante al que se le ha quitado el acceso conserva su cuenta
 * (y su historial de comisiones) con `activo: false`, y aquí deja de
 * contar como tal.
 */
export type AccesoAdmin =
  | { tipo: "admin" }
  | {
      tipo: "representante";
      pais: Pais;
      /** Su parte, en tanto por ciento (30 = 30 %). */
      porcentaje: number;
      /** Su enlace propio: apoyaclub.com/.../6mesesgratis?a=CODIGO. */
      codigo: string | null;
      /** Su cuenta y desde cuándo está: cobra por lo que entra desde entonces. */
      id: string | null;
      desde: string | null;
    };

export const PORCENTAJE_POR_DEFECTO = 30;

export function accesoAdminDe(
  usuario: (Pick<User, "app_metadata"> & Partial<Pick<User, "id" | "created_at">>) | null | undefined,
): AccesoAdmin | null {
  const meta = usuario?.app_metadata ?? {};
  const rol = meta.role as Role | undefined;

  if (rol === "admin") return { tipo: "admin" };

  if (rol === "representante" && meta.activo !== false && esPaisValido(meta.pais)) {
    const porcentaje = Number(meta.porcentaje);
    return {
      tipo: "representante",
      pais: meta.pais,
      porcentaje:
        Number.isFinite(porcentaje) && porcentaje > 0 && porcentaje <= 100 ? porcentaje : PORCENTAJE_POR_DEFECTO,
      codigo: typeof meta.codigo === "string" && meta.codigo ? meta.codigo : null,
      id: usuario?.id ?? null,
      desde: usuario?.created_at ?? null,
    };
  }

  return null;
}

/** Si este acceso puede tocar un club de este país. */
export function puedeGestionarPais(acceso: AccesoAdmin, pais: Pais): boolean {
  return acceso.tipo === "admin" || acceso.pais === pais;
}
