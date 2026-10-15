import Image from "next/image";
import { esFotoDeLaCasa } from "@/lib/fotos-de-oportunidad";

/**
 * Las fotos de una oportunidad, en su ficha pública (migración 0052).
 *
 * Es lo que de verdad convence a una empresa: "lona de 3×1 en el
 * pabellón" la obliga a imaginarse la pared, y la foto de la pared se la
 * enseña.
 *
 * DEVUELVE null SI NO HAY FOTOS, que es lo que va a pasar en casi todas
 * durante bastante tiempo. Nada de marco gris ni de "sin imagen": un
 * hueco vacío repetido por todo el catálogo se ve peor que el texto
 * solo, que es lo que hay hoy y funciona.
 *
 * Se vuelven a filtrar aquí por si acaso. Las direcciones se guardaron
 * ya saneadas, pero esto se pinta en una página pública que cualquiera
 * puede abrir, y la fila pudo escribirse antes de que existiera esa
 * comprobación.
 */
export function FotosDeLaOportunidad({
  fotos,
  titulo,
}: {
  fotos: string[];
  titulo: string;
}) {
  const limpias = fotos.filter(esFotoDeLaCasa);
  if (limpias.length === 0) return null;

  const [principal, ...resto] = limpias;

  return (
    <div className="mt-5">
      {/* La primera manda y va a tamaño grande; las otras dos debajo,
          pequeñas. Un mosaico de tres iguales reparte la atención entre
          las tres, y el club ya eligió cuál era la buena al ponerla la
          primera. */}
      <Image
        src={principal}
        alt={`${titulo} — foto principal`}
        width={1200}
        height={800}
        unoptimized
        className="aspect-[3/2] w-full rounded-xl border border-zinc-200 bg-zinc-100 object-cover"
      />

      {resto.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {resto.map((foto, posicion) => (
            <li key={foto}>
              <Image
                src={foto}
                alt={`${titulo} — foto ${posicion + 2}`}
                width={600}
                height={400}
                unoptimized
                className="aspect-[3/2] w-full rounded-lg border border-zinc-200 bg-zinc-100 object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
