import { Link } from "@/i18n/navigation";
import type { Bloque } from "@/lib/guias";
import { TextoGuia } from "./TextoGuia";

/**
 * El cuerpo de una guía. Cada tipo de bloque tiene su dibujo; el texto
 * corre a una columna cómoda de leer (unos 70 caracteres por línea) y
 * los recuadros rompen el ritmo para que la guía no sea un muro de
 * párrafos.
 */
export function BloquesGuia({ bloques }: { bloques: Bloque[] }) {
  return (
    <div className="text-[1.0625rem] leading-[1.8] text-zinc-700">
      {bloques.map((bloque, i) => (
        <BloqueGuia key={i} bloque={bloque} />
      ))}
    </div>
  );
}

function BloqueGuia({ bloque }: { bloque: Bloque }) {
  switch (bloque.tipo) {
    case "parrafo":
      return (
        <p className="mt-5">
          <TextoGuia texto={bloque.texto} />
        </p>
      );

    case "apartado":
      return (
        <div className="mt-16 scroll-mt-28 first:mt-0" id={bloque.id}>
          {bloque.antetitulo && (
            <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{bloque.antetitulo}</p>
          )}
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-titular sm:text-3xl">
            {bloque.titulo}
          </h2>
        </div>
      );

    case "subtitulo":
      return <h3 className="mt-9 text-xl font-bold tracking-tight text-titular">{bloque.titulo}</h3>;

    case "lista": {
      const Etiqueta = bloque.numerada ? "ol" : "ul";
      return (
        <Etiqueta className="mt-5 space-y-3">
          {bloque.elementos.map((elemento, i) => (
            <li key={i} className="flex gap-3.5">
              {bloque.numerada ? (
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-teal-light text-sm font-bold text-accion-tinta">
                  {i + 1}
                </span>
              ) : (
                <span aria-hidden="true" className="mt-[0.7rem] h-2 w-2 shrink-0 rounded-full bg-brand-teal" />
              )}
              <span className="min-w-0">
                <TextoGuia texto={elemento} />
              </span>
            </li>
          ))}
        </Etiqueta>
      );
    }

    case "tarjetas":
      return (
        <ul className={`mt-7 grid gap-4 ${bloque.elementos.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {bloque.elementos.map((tarjeta) => (
            <li key={tarjeta.titulo} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-2xl">
                {tarjeta.icono}
              </span>
              <p className="mt-3 font-bold leading-snug text-titular">{tarjeta.titulo}</p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-zinc-600">
                <TextoGuia texto={tarjeta.texto} />
              </p>
            </li>
          ))}
        </ul>
      );

    case "tabla": {
      const [cabecera, ...filas] = bloque.filas;
      return (
        <figure className="mt-7">
          {/* En el teléfono la tabla se desliza de lado en vez de
              aplastar las columnas. */}
          <div className="relative overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem] leading-snug">
              <thead>
                <tr className="bg-brand-navy text-sobre-color">
                  {cabecera.map((celda) => (
                    <th key={celda} scope="col" className="px-4 py-3 font-semibold">
                      {celda}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i} className="border-t border-zinc-200 even:bg-zinc-50">
                    {fila.map((celda, j) => (
                      <td key={j} className={`px-4 py-3 align-top ${j === 0 ? "font-semibold text-titular" : "text-zinc-600"}`}>
                        <TextoGuia texto={celda} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bloque.nota && (
            <figcaption className="mt-3 text-sm leading-relaxed text-zinc-500">
              <TextoGuia texto={bloque.nota} />
            </figcaption>
          )}
        </figure>
      );
    }

    case "consejo":
      return (
        <aside className="mt-8 rounded-2xl border-l-4 border-brand-teal bg-brand-teal-light/60 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-bold text-titular">
            <span aria-hidden="true">💡</span>
            {bloque.titulo}
          </p>
          <p className="mt-2 text-[1rem] leading-relaxed">
            <TextoGuia texto={bloque.texto} />
          </p>
        </aside>
      );

    case "error":
      return (
        <aside className="mt-8 rounded-2xl border-l-4 border-aviso bg-aviso/10 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-bold text-titular">
            <span aria-hidden="true">⚠️</span>
            {bloque.titulo}
          </p>
          <p className="mt-2 text-[1rem] leading-relaxed">
            <TextoGuia texto={bloque.texto} />
          </p>
        </aside>
      );

    case "ejemplo":
      return (
        <figure className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <figcaption className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-bold text-titular">
            <span aria-hidden="true">✉️</span>
            {bloque.titulo}
          </figcaption>
          <div className="px-5 py-4 text-[0.95rem] leading-relaxed text-zinc-700 sm:px-6">
            {bloque.lineas.map((linea, i) =>
              linea === "" ? <div key={i} className="h-3" /> : <p key={i}>{linea}</p>,
            )}
          </div>
        </figure>
      );

    case "checklist":
      return (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="font-bold text-titular">{bloque.titulo}</p>
          <ul className="mt-3 space-y-2.5">
            {bloque.elementos.map((elemento, i) => (
              <li key={i} className="flex gap-3 text-[1rem] leading-relaxed">
                <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-teal text-xs font-bold text-sobre-color">
                  ✓
                </span>
                <span className="min-w-0">
                  <TextoGuia texto={elemento} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "llamada":
      return (
        <aside className="mt-10 overflow-hidden rounded-3xl bg-brand-navy-dark p-7 text-sobre-color shadow-xl shadow-brand-navy/20 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">ApoyaClub · 6 meses gratis</p>
          <p className="mt-2 text-xl font-extrabold leading-snug sm:text-2xl">{bloque.titulo}</p>
          <p className="mt-2 text-[1rem] leading-relaxed text-sobre-color/75">{bloque.texto}</p>
          <Link
            href="/6mesesgratis?a=GUIA"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accion px-6 font-bold text-sobre-color hover:bg-accion-fuerte"
          >
            Empieza gratis →
          </Link>
        </aside>
      );
  }
}
