/**
 * Traduce los mensajes de error de Supabase Auth (en inglés y con detalle
 * técnico) a mensajes claros en español, sin tecnicismos, para mostrar
 * directamente en la interfaz.
 */
export function mensajeErrorAuth(mensaje: string | undefined | null): string {
  if (!mensaje) {
    return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
  }

  const m = mensaje.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "El correo o la contraseña no son correctos.";
  }
  if (m.includes("email not confirmed")) {
    return "Todavía no has confirmado tu correo electrónico. Revisa tu bandeja de entrada.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "Ya existe una cuenta con este correo electrónico.";
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return "La contraseña es demasiado corta. Usa al menos 8 caracteres.";
  }
  if (m.includes("unable to validate email address") || m.includes("invalid email")) {
    return "El correo electrónico no es válido.";
  }
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many requests")) {
    return "Has hecho demasiados intentos. Espera un momento antes de volver a intentarlo.";
  }
  if (m.includes("same password") || m.includes("should be different")) {
    return "La nueva contraseña debe ser distinta de la anterior.";
  }
  if (m.includes("expired") || m.includes("invalid or expired")) {
    return "El enlace ha caducado o no es válido. Solicita uno nuevo.";
  }
  if (m.includes("network")) {
    return "No se ha podido conectar. Comprueba tu conexión a internet e inténtalo de nuevo.";
  }

  return "Ha ocurrido un error. Inténtalo de nuevo en unos minutos.";
}
