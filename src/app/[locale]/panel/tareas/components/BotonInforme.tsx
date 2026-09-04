/**
 * Los botones para descargar el informe de una empresa.
 *
 * Son formularios normales con POST, no fetch: el navegador ya sabe
 * descargar una respuesta con `Content-Disposition`, y hacerlo a mano
 * con un blob solo añade un sitio más donde fallar. De paso funcionan
 * aunque el JavaScript de la página se haya caído.
 *
 * No llevan "use client" porque no lo necesitan: son HTML.
 */
export function BotonInforme({ empresa, compacto = false }: { empresa: string; compacto?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <form method="post" action="/panel/tareas/informe">
        <input type="hidden" name="empresa" value={empresa} />
        <input type="hidden" name="formato" value="pdf" />
        <button
          type="submit"
          className={
            compacto
              ? "rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
              : "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          }
          title={`Descargar en PDF lo que has hecho por ${empresa}`}
        >
          {compacto ? "Informe PDF" : "Generar informe de progreso (PDF)"}
        </button>
      </form>

      <form method="post" action="/panel/tareas/informe">
        <input type="hidden" name="empresa" value={empresa} />
        <input type="hidden" name="formato" value="word" />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
          title={`Descargar en Word lo que has hecho por ${empresa}, por si quieres retocarlo`}
        >
          Word
        </button>
      </form>
    </span>
  );
}
