"use client";

import { useActionState, useState } from "react";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import { AvisoError } from "@/components/AvisoError";
import { ETIQUETA_CATEGORIA_NECESIDAD } from "@/lib/opportunities";
import {
  ETIQUETA_ESTADO_OFERTA,
  ETIQUETA_TIPO_OFERTA,
  type EstadoOferta,
  type OfertaDeEmpresa,
} from "@/lib/empresas";
import { SeccionCard } from "../../panel/components/SeccionCard";
import { archivarOferta, borrarOferta, cambiarEstadoOferta } from "../actions";
import { OfertaForm } from "./OfertaForm";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const COLOR_ESTADO: Record<EstadoOferta, string> = {
  available: "bg-teal-100 text-teal-800",
  reserved: "bg-amber-100 text-amber-900",
  closed: "bg-zinc-200 text-zinc-600",
};

/**
 * Lo que la empresa ofrece, y qué hacer con ello.
 *
 * Igual que en el panel del club: si ya hay algo publicado, el
 * formulario de alta se pliega y lo primero que se ve es lo que hay.
 * Un formulario vacío por delante y la lista debajo, fuera de pantalla
 * en el móvil, es lo contrario de lo que la empresa viene a mirar.
 */
export function OfertasManager({ ofertas }: { ofertas: OfertaDeEmpresa[] }) {
  const [creando, setCreando] = useState(ofertas.length === 0);
  const [editando, setEditando] = useState<string | null>(null);

  const activas = ofertas.filter((oferta) => !oferta.archivadaEn);
  const archivadas = ofertas.filter((oferta) => oferta.archivadaEn);

  return (
    <div className="flex flex-col gap-6">
      {creando ? (
        <SeccionCard
          titulo="Publica lo que ofreces"
          descripcion="Sale en el directorio de empresas y lo ven los clubes que buscan justo eso."
        >
          <OfertaForm alTerminar={() => setCreando(false)} />
        </SeccionCard>
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="self-start rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
        >
          + Publicar otra cosa
        </button>
      )}

      {activas.length > 0 && (
        <div className="flex flex-col gap-3">
          {activas.map((oferta) => (
            <TarjetaOferta
              key={oferta.id}
              oferta={oferta}
              editando={editando === oferta.id}
              alEditar={() => setEditando(oferta.id)}
              alCerrar={() => setEditando(null)}
            />
          ))}
        </div>
      )}

      {archivadas.length > 0 && (
        <details className="rounded-xl border border-zinc-200 bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-600 [&::-webkit-details-marker]:hidden">
            Archivadas ({archivadas.length})
          </summary>
          <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-5">
            {archivadas.map((oferta) => (
              <TarjetaOferta
                key={oferta.id}
                oferta={oferta}
                editando={false}
                alEditar={() => setEditando(oferta.id)}
                alCerrar={() => setEditando(null)}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TarjetaOferta({
  oferta,
  editando,
  alEditar,
  alCerrar,
}: {
  oferta: OfertaDeEmpresa;
  editando: boolean;
  alEditar: () => void;
  alCerrar: () => void;
}) {
  // Pasan por `useActionState` y no por un `<form action={...}>` pelado
  // porque estas acciones devuelven el motivo cuando fallan, y un
  // formulario normal se lo tragaría. Un botón que no hace nada y no
  // dice por qué es como una web rota, aunque el fallo sea que la
  // sesión ha caducado y se arregle en diez segundos.
  const [estadoCambio, cambiarEstado] = useActionState(
    async (_previo: { error?: string } | null, formData: FormData) =>
      (await cambiarEstadoOferta(formData)) ?? null,
    null,
  );
  const [estadoArchivo, archivar] = useActionState(
    async (_previo: { error?: string } | null, formData: FormData) =>
      (await archivarOferta(formData)) ?? null,
    null,
  );

  if (editando) {
    return (
      <div className="rounded-xl border border-teal-300 bg-white p-5">
        <OfertaForm oferta={oferta} alTerminar={alCerrar} />
      </div>
    );
  }

  const archivada = !!oferta.archivadaEn;

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-5 ${archivada ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{oferta.titulo}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {ETIQUETA_TIPO_OFERTA[oferta.tipo]}
            {oferta.categoria && ` · ${ETIQUETA_CATEGORIA_NECESIDAD[oferta.categoria]}`}
            {oferta.provincia ? ` · ${oferta.provincia}` : " · Toda España"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {oferta.tipo === "money" && oferta.valor != null && (
            <span className="text-sm font-semibold text-zinc-900">{formatoEuros.format(oferta.valor)}</span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[oferta.estado]}`}>
            {ETIQUETA_ESTADO_OFERTA[oferta.estado]}
          </span>
        </div>
      </div>

      {oferta.descripcion && <p className="mt-3 text-sm text-zinc-600">{oferta.descripcion}</p>}

      {oferta.pideACambio && (
        <p className="mt-2 text-sm text-zinc-700">
          <span className="font-medium">A cambio: </span>
          {oferta.pideACambio}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={alEditar}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Editar
        </button>

        {/* El estado se cambia con un formulario normal y no con un
            desplegable que guarde solo: un toque sin querer en el
            móvil no puede cerrar un acuerdo abierto. */}
        {!archivada && (
          <form action={cambiarEstado} className="flex items-center gap-2">
            <input type="hidden" name="id" value={oferta.id} />
            <select
              name="estado"
              defaultValue={oferta.estado}
              aria-label="Estado de la oferta"
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="available">Disponible</option>
              <option value="reserved">Apalabrada</option>
              <option value="closed">Cerrada</option>
            </select>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Cambiar
            </button>
          </form>
        )}

        <form action={archivar}>
          <input type="hidden" name="id" value={oferta.id} />
          {archivada && <input type="hidden" name="desarchivar" value="si" />}
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100"
          >
            {archivada ? "Volver a publicar" : "Archivar"}
          </button>
        </form>

        <span className="ml-auto">
          <AccionConConfirmacion
            accion={borrarOferta}
            id={oferta.id}
            nombre={oferta.titulo}
            etiqueta="Borrar"
          />
        </span>
      </div>

      <AvisoError mensaje={estadoCambio?.error ?? estadoArchivo?.error} />
    </div>
  );
}
