/**
 * Saneado de lo que va en las cabeceras de un correo.
 *
 * Vive aparte de `resend.ts` porque es la parte con consecuencias de
 * seguridad y conviene poder probarla suelta: el nombre del remitente lo
 * escribe el club, así que llega texto arbitrario a una cabecera. Un
 * salto de línea ahí permitiría inyectar cabeceras nuevas —otro
 * destinatario, otro asunto— y convertir el agradecimiento a un
 * patrocinador en un envío a quien quiera el que lo escribe.
 */

/** Quita de un texto lo que no puede ir en una cabecera de correo. */
export function limpiarCabecera(texto: string): string {
  return texto
    .replace(/[\r\n<>"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Dirección suelta de un remitente que puede venir como "Nombre <a@b.c>". */
export function direccionDe(remitente: string): string {
  const entreAngulos = remitente.match(/<([^>]+)>/);
  return (entreAngulos ? entreAngulos[1] : remitente).trim();
}
