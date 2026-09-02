import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Límites de uso de los formularios públicos (Fase 15).
 *
 * Se apoya en la función `consume_rate_limit` de la migración 0010: una
 * tabla en Postgres en vez de un servicio externo, porque con este
 * volumen no compensa añadir una dependencia más (si algún día hace
 * falta, se cambia solo este archivo).
 *
 * Regla importante: si la comprobación falla (la migración todavía no
 * está aplicada, Supabase no responde), se deja pasar. Un límite roto
 * nunca debe impedir que un club reciba una solicitud real; el objetivo
 * es frenar ráfagas automáticas, no ser una barrera de seguridad.
 */

export type Limite = {
  /** Formulario o acción que se está limitando, p. ej. "contacto-landing". */
  bucket: string;
  /** A quién se le cuenta: IP, id de empresa, email… */
  identificador: string;
  /** Cuántos intentos se permiten dentro de la ventana. */
  limite: number;
  /** Duración de la ventana, en segundos. */
  ventanaSegundos: number;
};

export async function consumirLimite({
  bucket,
  identificador,
  limite,
  ventanaSegundos,
}: Limite): Promise<boolean> {
  if (!identificador) return true;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_identifier: identificador,
      p_limit: limite,
      p_window_seconds: ventanaSegundos,
    });

    if (error) {
      console.warn("[rate-limit] No se ha podido comprobar el límite:", error.message);
      return true;
    }

    return data !== false;
  } catch (excepcion) {
    console.warn("[rate-limit] Comprobación no disponible:", excepcion);
    return true;
  }
}

/**
 * IP del visitante detrás del proxy de Vercel. Se queda con el primer
 * salto de `x-forwarded-for`, que es el cliente real; el resto de la
 * cadena la añaden los proxys intermedios y no identifica a nadie.
 */
export async function ipDelVisitante(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return cabeceras.get("x-real-ip")?.trim() || "desconocida";
}

/**
 * El campo trampa y su comprobación viven en `lib/honeypot.ts`, sin
 * dependencias de servidor, para que el componente que lo pinta pueda
 * importarlo desde el navegador. Se reexportan aquí porque las Server
 * Actions los usan siempre junto al limitador.
 */
export { CAMPO_TRAMPA, pareceBot } from "@/lib/honeypot";
