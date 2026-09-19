"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  PLANTILLAS,
  construirCorreo,
  correoDe,
  enlaceDeCorreo,
  type DatosDelClub,
  type PlantillaId,
} from "@/lib/plantillas-correo-club";
import { clasesInput, clasesTextarea } from "../../components/SeccionCard";

/**
 * El correo que el club le escribe a esta empresa.
 *
 * La plataforma lo escribe y el club lo envía desde su propia
 * dirección. No es una limitación técnica: es a propósito. Si
 * ApoyaClub mandara correos en frío por treinta clubes, las quejas de
 * spam caerían sobre su dominio, y lo primero que dejaría de llegar
 * serían los correos que no pueden fallar — recuperar la contraseña,
 * avisar de una solicitud. Además, la respuesta tiene que caer en la
 * bandeja del club, que es donde mira.
 *
 * "Copiar" va primero y "Abrir en mi correo" después: el segundo es
 * más cómodo pero algunos programas de correo recortan los textos
 * largos, y copiar no falla nunca.
 */
export function EscribirCorreo({
  club,
  empresaNombre,
  contactoNombre,
  contactoDatos,
  notas,
  alCerrar,
}: {
  club: DatosDelClub;
  empresaNombre: string;
  contactoNombre: string | null;
  contactoDatos: string | null;
  notas: string | null;
  alCerrar: () => void;
}) {
  const [plantilla, setPlantilla] = useState<PlantillaId>("conocida");
  const [indiceAsunto, setIndiceAsunto] = useState(0);
  const [copiado, setCopiado] = useState(false);

  const generado = construirCorreo(plantilla, club, {
    nombre: empresaNombre,
    contactoNombre,
    detalle: notas,
  });

  // El texto se puede tocar antes de enviarlo, y se reinicia al cambiar
  // de plantilla: la `key` del textarea se encarga, sin efectos.
  const [tocado, setTocado] = useState<string | null>(null);
  const cuerpo = tocado ?? generado.cuerpo;
  const asunto = generado.asuntos[indiceAsunto] ?? generado.asuntos[0];

  function cambiarPlantilla(nueva: PlantillaId) {
    setPlantilla(nueva);
    setIndiceAsunto(0);
    setTocado(null);
    setCopiado(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${asunto}\n\n${cuerpo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso para copiar: el texto está a la vista y se puede
      // seleccionar a mano.
    }
  }

  const para = correoDe(contactoDatos);

  return (
    <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900">Escribir a {empresaNombre}</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Lo escribimos nosotros; lo envías tú desde tu correo, para que te contesten a ti.
          </p>
        </div>
        <button
          type="button"
          onClick={alCerrar}
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Qué situación es</span>
          <select
            value={plantilla}
            onChange={(evento) => cambiarPlantilla(evento.target.value as PlantillaId)}
            className={clasesInput}
          >
            {PLANTILLAS.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-zinc-500">
            {PLANTILLAS.find((opcion) => opcion.id === plantilla)?.cuando}
          </span>
        </label>

        {/* El asunto decide si se abre. Por eso hay varios y no uno. */}
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-zinc-700">Asunto</legend>
          <div className="flex flex-col gap-1.5">
            {generado.asuntos.map((opcion, indice) => (
              <label key={opcion} className="flex items-start gap-2 text-sm text-zinc-700">
                <input
                  type="radio"
                  name="asunto"
                  checked={indiceAsunto === indice}
                  onChange={() => setIndiceAsunto(indice)}
                  className="mt-1 h-3.5 w-3.5 border-zinc-300 text-teal-600 focus:ring-brand-teal-dark"
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">El correo</span>
          <textarea
            key={plantilla}
            defaultValue={generado.cuerpo}
            onChange={(evento) => setTocado(evento.target.value)}
            rows={16}
            className={`${clasesTextarea} bg-white font-mono text-xs leading-relaxed`}
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Cámbialo a tu manera antes de enviarlo. Lo que está entre corchetes hay que rellenarlo.
          </span>
        </label>

        {/* Lo que le falta al club para que este correo convenza. Con
            su enlace: un aviso sin destino no sirve de nada. */}
        {generado.faltan.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-sm font-medium text-amber-900">
              Este correo quedaría mejor si rellenas:
            </p>
            <ul className="mt-1 space-y-1">
              {generado.faltan.map((hueco) => (
                <li key={hueco.donde} className="text-sm text-amber-900">
                  <Link href={hueco.donde} className="font-medium underline">
                    {hueco.que}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copiar()}
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
          >
            {copiado ? "Copiado" : "Copiar el correo"}
          </button>

          <a
            href={enlaceDeCorreo({ para, asunto, cuerpo })}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Abrir en mi correo
          </a>

          {!para && contactoDatos && (
            <span className="text-xs text-zinc-500">
              No hemos encontrado ninguna dirección en sus datos, así que se abrirá en blanco.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
