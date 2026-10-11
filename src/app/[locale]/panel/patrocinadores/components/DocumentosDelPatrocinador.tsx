"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import {
  MAXIMO_POR_PATROCINADOR,
  TAMANO_MAXIMO_BYTES,
  TIPOS_DE_DOCUMENTO,
  TIPOS_MIME_PERMITIDOS,
  tamanoLegible,
  type DocumentoDePatrocinio,
} from "@/lib/documentos-patrocinio";
import { borrarDocumento, subirDocumento, type EstadoDocumento } from "../actions";

/**
 * El contrato y la factura de un patrocinador.
 *
 * Esto es lo que faltaba para que "Qué acordasteis" sirviera de algo:
 * ese campo cuenta lo acordado con palabras del club, pero el papel
 * firmado estaba en el correo de quien lo firmó, y con el cambio de
 * junta se iba con él.
 *
 * NO ES UNA CARPETA, Y ESO ES A PROPÓSITO. Solo se puede adjuntar
 * dentro de un patrocinador, con tres tipos cerrados y un tope de seis.
 * Una carpeta libre invita a subir fichas de jugadores y certificados
 * médicos —datos de salud, y de menores—, que es justo lo que esta
 * aplicación no debe guardar. Si no hay dónde, nadie los sube.
 *
 * Los enlaces de descarga apuntan a una ruta del propio panel, no al
 * almacén: el almacén es privado y es el servidor quien firma un enlace
 * de un minuto después de comprobar de quién es el archivo.
 */

const ETIQUETA: Record<string, string> = Object.fromEntries(
  TIPOS_DE_DOCUMENTO.map((tipo) => [tipo.id, tipo.etiqueta]),
);

const COLOR: Record<string, string> = {
  contrato: "bg-teal-100 text-teal-700",
  factura: "bg-amber-100 text-amber-800",
  otro: "bg-zinc-100 text-zinc-600",
};

export function DocumentosDelPatrocinador({
  patrocinadorId,
  nombre,
  documentos,
}: {
  patrocinadorId: string;
  nombre: string;
  documentos: DocumentoDePatrocinio[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoDocumento, FormData>(
    subirDocumento,
    null,
  );
  const [abierto, setAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  const lleno = documentos.length >= MAXIMO_POR_PATROCINADOR;

  // Tras guardar bien, se limpia el formulario: si no, el archivo
  // recién subido sigue elegido y un segundo clic lo sube otra vez.
  //
  // En un efecto y no durante el pintado: tocar un `ref` mientras React
  // pinta es justo lo que React avisa que no se haga, porque el pintado
  // puede repetirse y el `reset` se ejecutaría cuando no toca.
  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">Contrato y facturas</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {documentos.length === 0
              ? "Todavía no has guardado ningún papel de este patrocinio."
              : `${documentos.length} de ${MAXIMO_POR_PATROCINADOR} documentos.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          disabled={lleno && !abierto}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
        >
          {abierto ? "Cerrar" : "+ Añadir documento"}
        </button>
      </div>

      {documentos.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 border-t border-zinc-100">
          {documentos.map((documento) => (
            <li key={documento.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  COLOR[documento.tipo] ?? COLOR.otro
                }`}
              >
                {ETIQUETA[documento.tipo] ?? "Documento"}
              </span>

              {/* Un enlace normal y no un botón con JavaScript: el
                  navegador ya sabe seguir un redireccionamiento y
                  descargar lo que hay al otro lado. */}
              <a
                href={`/panel/patrocinadores/documento?id=${documento.id}`}
                className="min-w-0 flex-1 break-words text-sm font-medium text-teal-700 hover:underline"
              >
                {documento.nombreDelArchivo}
              </a>

              <span className="shrink-0 text-xs text-zinc-500">
                {tamanoLegible(documento.tamano)}
              </span>

              <form action={borrarDocumento} className="shrink-0">
                <input type="hidden" name="documentoId" value={documento.id} />
                <button
                  type="submit"
                  className="text-xs text-zinc-400 transition-colors hover:text-red-600"
                  aria-label={`Borrar ${documento.nombreDelArchivo}`}
                >
                  Borrar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {lleno && !abierto && (
        <p className="mt-3 text-xs text-zinc-500">
          Has llegado al tope de {MAXIMO_POR_PATROCINADOR}. Borra alguno para subir otro.
        </p>
      )}

      {abierto && (
        <form ref={formulario} action={accion} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
          <input type="hidden" name="patrocinadorId" value={patrocinadorId} />

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Qué es</span>
            <select
              name="tipo"
              defaultValue="contrato"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark"
            >
              {TIPOS_DE_DOCUMENTO.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Archivo</span>
            <input
              type="file"
              name="archivo"
              required
              accept={TIPOS_MIME_PERMITIDOS.join(",")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-teal-700"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              PDF o foto, hasta {Math.round(TAMANO_MAXIMO_BYTES / (1024 * 1024))} MB. Si lo firmasteis
              en papel, vale una foto del documento.
            </span>
          </label>

          <AvisoError mensaje={estado?.error ?? null} />
          <AvisoExito mensaje={estado?.ok ? "Guardado." : null} />

          <div>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy disabled:pointer-events-none disabled:opacity-50"
            >
              {enviando ? "Subiendo…" : "Guardar documento"}
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Solo lo ves tú. Estos archivos no salen en la página pública de {nombre} ni en tu dossier.
          </p>
        </form>
      )}
    </div>
  );
}
