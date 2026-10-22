import { Link } from "@/i18n/navigation";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import {
  activarModoPruebasEmpresa,
  quitarModoPruebasEmpresa,
  reactivarEmpresa,
  suspenderEmpresa,
} from "../actions";
import type { EmpresaAdminRow } from "../types";

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

const BOTON = "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors";

/** Una fila del listado de empresas del admin (migración 0055). */
export function FilaEmpresa({ fila }: { fila: EmpresaAdminRow }) {
  // Lo que ve la gente de fuera: sale en el directorio solo si ella lo ha
  // pedido y nadie la ha escondido desde aquí.
  const publica = fila.fichaCreada && fila.enElDirectorio && !fila.suspended && !fila.modoPruebas;

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{fila.name}</p>
        {fila.sector && <p className="text-xs text-zinc-500">{fila.sector}</p>}
        <p className="text-xs text-zinc-500">{fila.lugar}</p>
        {fila.email && <p className="text-xs text-zinc-500">{fila.email}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatoFecha.format(new Date(fila.createdAt))}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">
        <p className="tabular-nums">
          {fila.ofertasActivas} {fila.ofertasActivas === 1 ? "oferta activa" : "ofertas activas"}
        </p>
        <p className="tabular-nums text-zinc-500">
          {fila.propuestasRecibidas} {fila.propuestasRecibidas === 1 ? "propuesta recibida" : "propuestas recibidas"}
        </p>
        <p className="tabular-nums text-zinc-500">
          {fila.guardados} {fila.guardados === 1 ? "guardado" : "guardados"}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {!fila.fichaCreada ? (
            <span className="text-xs text-zinc-500">Sin ficha todavía</span>
          ) : publica ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">En el directorio</span>
          ) : (
            !fila.enElDirectorio && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                Fuera del directorio
              </span>
            )
          )}
          {fila.modoPruebas && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Modo de pruebas</span>
          )}
          {fila.suspended && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Suspendida</span>
          )}
        </div>
        {fila.fichaCreada && (
          <p className="mt-1 text-xs text-zinc-500">{fila.avisosActivados ? "Recibe avisos" : "Avisos apagados"}</p>
        )}
      </td>
      <td className="px-4 py-3">
        {fila.fichaCreada ? (
          <div className="flex flex-wrap gap-2">
            {publica && fila.slug && (
              <Link
                href={`/empresas/${fila.slug}`}
                className={`${BOTON} border-zinc-300 text-zinc-700 hover:bg-zinc-100`}
              >
                Ver ficha
              </Link>
            )}
            {/* Igual que en clubes: el modo de pruebas va directo porque
                no deja a nadie fuera y se deshace con el mismo botón. */}
            <form action={fila.modoPruebas ? quitarModoPruebasEmpresa : activarModoPruebasEmpresa}>
              <input type="hidden" name="id" value={fila.id} />
              <button
                type="submit"
                title={
                  fila.modoPruebas
                    ? "Vuelve a mostrar la empresa en el directorio"
                    : "Esconde la empresa del directorio, pero le deja usar su panel"
                }
                className={`${BOTON} border-amber-300 text-amber-800 hover:bg-amber-50`}
              >
                {fila.modoPruebas ? "Quitar modo de pruebas" : "Modo de pruebas"}
              </button>
            </form>
            {fila.suspended ? (
              <form action={reactivarEmpresa}>
                <input type="hidden" name="id" value={fila.id} />
                <button type="submit" className={`${BOTON} border-zinc-300 text-zinc-700 hover:bg-zinc-100`}>
                  Reactivar
                </button>
              </form>
            ) : (
              <AccionConConfirmacion
                accion={suspenderEmpresa}
                id={fila.id}
                nombre={fila.name}
                etiqueta="Suspender"
                pregunta="¿Suspender a"
                confirmar="Sí, suspender"
                enCurso="Suspendiendo…"
                clases={`${BOTON} border-red-200 text-red-700 hover:bg-red-50`}
              />
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-500">—</span>
        )}
      </td>
    </tr>
  );
}
