import { getTranslations } from "next-intl/server";

/**
 * Traduce los mensajes de error de Supabase Auth (en inglés y con
 * detalle técnico) a mensajes claros para mostrar en la interfaz.
 *
 * Los textos viven en `messages/es/auth.json` (Fase 14); aquí solo se
 * decide qué caso es cada error de Supabase. Es una función de servidor:
 * la llaman las Server Actions de registro, acceso y recuperación.
 */
export async function mensajeErrorAuth(mensaje: string | undefined | null): Promise<string> {
  const t = await getTranslations("auth.errores");

  if (!mensaje) return t("inesperado");

  const m = mensaje.toLowerCase();

  if (m.includes("invalid login credentials")) return t("credenciales");
  if (m.includes("email not confirmed")) return t("emailSinConfirmar");
  if (m.includes("already registered") || m.includes("already exists")) return t("yaRegistrado");
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return t("passwordCorta");
  }
  if (m.includes("unable to validate email address") || m.includes("invalid email")) {
    return t("emailInvalido");
  }
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many requests")) {
    return t("demasiadosIntentos");
  }
  if (m.includes("same password") || m.includes("should be different")) return t("mismaPassword");
  if (m.includes("expired") || m.includes("invalid or expired")) return t("enlaceCaducado");
  if (m.includes("network")) return t("sinConexion");

  return t("generico");
}
