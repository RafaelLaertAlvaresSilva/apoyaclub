import { fraseDeIdentificacion, TITULAR } from "@/lib/titular";

/**
 * La identificación del titular en las páginas legales.
 *
 * Cuando faltan datos no se calla ni disimula: lo dice y deja a la
 * vista el correo de contacto. Un hueco entre corchetes publicado es
 * peor que reconocer que falta algo, porque el corchete parece un
 * descuido y el aviso parece una obra en curso.
 */
export function DatosDelTitular({ introduccion }: { introduccion: string }) {
  const frase = fraseDeIdentificacion();

  if (!frase) {
    return (
      <p>
        {introduccion} Los datos identificativos del titular están pendientes de publicar.
        Mientras tanto, para cualquier cuestión legal o de privacidad puedes escribir a{" "}
        <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a> y te los facilitamos.
      </p>
    );
  }

  return (
    <p>
      {introduccion} {frase}
    </p>
  );
}
