import { FRANJAS_PRESUPUESTO, type FiltrosEmpresas as Filtros } from "@/lib/directorio-empresas";
import { OBJETIVOS_OPORTUNIDAD } from "@/lib/opportunities";

/**
 * Filtros del directorio de empresas.
 *
 * Es un formulario GET normal, sin JavaScript: los filtros acaban en la
 * URL, así que se pueden compartir, guardar en favoritos y el botón de
 * atrás del navegador hace lo que se espera. Para cuatro campos no hace
 * falta nada más.
 */
export function FiltrosEmpresas({
  filtros,
  provincias,
}: {
  filtros: Filtros;
  provincias: string[];
}) {
  return (
    <form className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Buscar</span>
          <input
            name="q"
            defaultValue={filtros.texto ?? ""}
            placeholder="Nombre o sector"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Provincia</span>
          <select
            name="provincia"
            defaultValue={filtros.provincia ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Todas</option>
            {provincias.map((provincia) => (
              <option key={provincia} value={provincia}>
                {provincia}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-zinc-700">Presupuesto</legend>
        <div className="flex flex-wrap gap-3">
          {FRANJAS_PRESUPUESTO.map((franja) => (
            <label key={franja.id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="franja"
                value={franja.id}
                defaultChecked={filtros.franjas?.includes(franja.id) ?? false}
                className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              {franja.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-zinc-700">Lo que buscan apoyar</legend>
        <div className="flex flex-wrap gap-3">
          {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
            <label key={objetivo.id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="objetivo"
                value={objetivo.id}
                defaultChecked={filtros.objetivos?.includes(objetivo.id) ?? false}
                className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              {objetivo.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          Filtrar
        </button>
        <a
          href="?"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Limpiar
        </a>
      </div>
    </form>
  );
}
