/**
 * Banner que encabeza cada página legal (Fase 11): estas páginas son
 * plantillas de partida, no textos definitivos. No deben publicarse ni
 * enlazarse de forma visible hasta que un abogado las revise y las
 * adapte a APOYACLUB. Ver `src/lib/legal.ts` para la fecha de versión.
 */
export function AvisoRevisionJuridica() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-semibold">⚠️ Plantilla pendiente de revisión jurídica</p>
      <p className="mt-1">
        Este texto es un borrador de partida y todavía no ha sido revisado por un
        abogado. No lo publiques como definitivo ni lo utilices como base legal real
        hasta contar con esa revisión.
      </p>
    </div>
  );
}
