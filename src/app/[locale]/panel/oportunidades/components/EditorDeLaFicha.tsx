"use client";

import { useState } from "react";
import { RESPONSABLES, type Accion, type Beneficio, type Responsable } from "@/lib/ficha-oportunidad";
import { clasesInput } from "../../components/SeccionCard";

/**
 * Lo que convierte "patrocinio 500 €" en un acuerdo.
 *
 * Dos listas cortas: qué recibe la empresa —con cantidades, porque "4
 * publicaciones" no es lo mismo que "publicaciones"— y quién se encarga
 * de cada cosa. Sin esto, club y empresa firman entendiendo cada uno
 * algo distinto y la discusión aparece en marzo.
 *
 * Viajan en un campo oculto como JSON, igual que los hitos del club.
 * El servidor las vuelve a comprobar antes de guardarlas: lo que llega
 * del navegador nunca se guarda tal cual.
 */
export function EditorDeLaFicha({
  beneficios: beneficiosIniciales,
  acciones: accionesIniciales,
}: {
  beneficios: Beneficio[];
  acciones: Accion[];
}) {
  const [beneficios, setBeneficios] = useState<Beneficio[]>(beneficiosIniciales);
  const [acciones, setAcciones] = useState<Accion[]>(accionesIniciales);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-sm font-medium text-zinc-900">La empresa recibe</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Una línea por cosa, con la cantidad cuando la haya. Es lo primero que mira quien está
          decidiendo si le interesa.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {beneficios.map((beneficio, indice) => (
            <div key={indice} className="flex flex-wrap items-start gap-2">
              <div className="w-20">
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={beneficio.cantidad ?? ""}
                  onChange={(evento) =>
                    setBeneficios((actuales) =>
                      actuales.map((uno, i) =>
                        i === indice
                          ? { ...uno, cantidad: Number.parseInt(evento.target.value, 10) || null }
                          : uno,
                      ),
                    )
                  }
                  placeholder="4"
                  aria-label={`Cantidad de la línea ${indice + 1}`}
                  className={clasesInput}
                />
              </div>

              <div className="min-w-48 flex-1">
                <input
                  type="text"
                  maxLength={200}
                  value={beneficio.texto}
                  onChange={(evento) =>
                    setBeneficios((actuales) =>
                      actuales.map((uno, i) => (i === indice ? { ...uno, texto: evento.target.value } : uno)),
                    )
                  }
                  placeholder="Publicaciones en Instagram"
                  aria-label={`Qué recibe, línea ${indice + 1}`}
                  className={clasesInput}
                />
              </div>

              <button
                type="button"
                onClick={() => setBeneficios((actuales) => actuales.filter((_, i) => i !== indice))}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setBeneficios((actuales) => [...actuales, { texto: "", cantidad: null }])}
          className="mt-2 rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
        >
          + Añadir algo que recibe
        </button>
      </section>

      <section>
        <p className="text-sm font-medium text-zinc-900">Quién hace qué</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Lo que hay que hacer para que esto funcione, y de quién es cada cosa. Es lo que evita el
          &quot;yo creía que lo hacíais vosotros&quot;.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {acciones.map((accion, indice) => (
            <div key={indice} className="flex flex-wrap items-start gap-2">
              <div className="min-w-48 flex-1">
                <input
                  type="text"
                  maxLength={200}
                  value={accion.texto}
                  onChange={(evento) =>
                    setAcciones((actuales) =>
                      actuales.map((uno, i) => (i === indice ? { ...uno, texto: evento.target.value } : uno)),
                    )
                  }
                  placeholder="Diseño de las creatividades"
                  aria-label={`Qué hay que hacer, línea ${indice + 1}`}
                  className={clasesInput}
                />
              </div>

              <div className="w-32">
                <select
                  value={accion.responsable}
                  onChange={(evento) =>
                    setAcciones((actuales) =>
                      actuales.map((uno, i) =>
                        i === indice ? { ...uno, responsable: evento.target.value as Responsable } : uno,
                      ),
                    )
                  }
                  aria-label={`Quién se encarga, línea ${indice + 1}`}
                  className={clasesInput}
                >
                  {RESPONSABLES.map((uno) => (
                    <option key={uno.id} value={uno.id}>
                      {uno.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setAcciones((actuales) => actuales.filter((_, i) => i !== indice))}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAcciones((actuales) => [...actuales, { texto: "", responsable: "club" }])}
          className="mt-2 rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
        >
          + Añadir algo que hay que hacer
        </button>
      </section>

      {/* Las líneas en blanco no se mandan: el servidor las descartaría
          igual, pero así tampoco viajan. */}
      <input
        type="hidden"
        name="beneficios"
        value={JSON.stringify(beneficios.filter((uno) => uno.texto.trim()))}
      />
      <input
        type="hidden"
        name="acciones"
        value={JSON.stringify(acciones.filter((uno) => uno.texto.trim()))}
      />
    </div>
  );
}
