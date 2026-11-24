import { serializarParaScript } from "@/lib/datos-estructurados";

/** Pinta un bloque JSON-LD (ver `src/lib/datos-estructurados.ts`). */
export function DatosEstructurados({ datos }: { datos: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializarParaScript(datos) }}
    />
  );
}
