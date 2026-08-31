"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clasesInput } from "@/app/panel/components/SeccionCard";
import { filtrosAQueryString, RADIOS_KM } from "@/lib/buscar-params";
import { FORMAS_COLABORACION, OBJETIVOS_OPORTUNIDAD, PERIODOS_OPORTUNIDAD, TIPOS_OPORTUNIDAD } from "@/lib/opportunities";
import type { FiltrosBusqueda, VistaBusqueda } from "@/lib/search-types";
import type {
  BudgetPeriod,
  CollaborationType,
  ObjectiveTag,
  OpportunityType,
  TeamLevel,
} from "@/lib/types";

const NIVELES_EQUIPO: { id: TeamLevel; etiqueta: string }[] = [
  { id: "primer_equipo", etiqueta: "Primer equipo" },
  { id: "cantera", etiqueta: "Cantera" },
];

function leerListaMarcada<T extends string>(formData: FormData, campo: string): T[] {
  return formData.getAll(campo).map((valor) => String(valor)) as T[];
}

function leerFiltrosDelFormulario(formData: FormData): FiltrosBusqueda {
  const texto = (campo: string) => {
    const valor = String(formData.get(campo) ?? "").trim();
    return valor === "" ? undefined : valor;
  };
  const numero = (campo: string) => {
    const valor = texto(campo);
    if (!valor) return undefined;
    const n = Number.parseFloat(valor);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  return {
    provincia: texto("provincia"),
    ubicacion: texto("ubicacion"),
    radioKm: numero("radio"),
    deporte: texto("deporte"),
    categoria: texto("categoria"),
    genero: texto("genero"),
    nivelEquipo: texto("nivel") as TeamLevel | undefined,
    tipos: leerListaMarcada<OpportunityType>(formData, "tipo"),
    presupuestoMin: numero("min"),
    presupuestoMax: numero("max"),
    periodo: texto("periodo") as BudgetPeriod | undefined,
    formasColaboracion: leerListaMarcada<CollaborationType>(formData, "forma"),
    objetivos: leerListaMarcada<ObjectiveTag>(formData, "objetivo"),
    orden: (texto("orden") as FiltrosBusqueda["orden"]) ?? "novedad",
  };
}

const clasesEtiquetaGrupo = "mb-2 block text-sm font-medium text-zinc-700";
const clasesCheckbox =
  "flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-800";

export function FiltrosBuscador({
  filtrosIniciales,
  vistaInicial,
  opcionesEquipo,
  provincias,
}: {
  filtrosIniciales: FiltrosBusqueda;
  vistaInicial: VistaBusqueda;
  opcionesEquipo: { deportes: string[]; categorias: string[]; generos: string[] };
  provincias: string[];
}) {
  const router = useRouter();
  const [abiertoEnMovil, setAbiertoEnMovil] = useState(false);

  // El formulario se renderiza dos veces (cajón en móvil, barra lateral
  // en escritorio) para poder mostrar solo uno según el tamaño de
  // pantalla, así que cada manejador recibe su propio `<form>` desde el
  // evento en vez de depender de una única ref compartida entre ambas
  // instancias.
  function aplicar(formulario: HTMLFormElement) {
    const filtros = leerFiltrosDelFormulario(new FormData(formulario));
    router.push(`/buscar?${filtrosAQueryString(filtros, vistaInicial)}`, { scroll: false });
    setAbiertoEnMovil(false);
  }

  function limpiar() {
    router.push("/buscar", { scroll: false });
    setAbiertoEnMovil(false);
  }

  const contenido = (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicar(evento.currentTarget);
      }}
      className="space-y-5"
    >
      <div>
        <p className={clasesEtiquetaGrupo}>Ubicación</p>
        <div className="space-y-2">
          <select
            name="provincia"
            defaultValue={filtrosIniciales.provincia ?? ""}
            onChange={(evento) => aplicar(evento.currentTarget.form!)}
            className={clasesInput}
          >
            <option value="">Toda España</option>
            {provincias.map((provincia) => (
              <option key={provincia} value={provincia}>
                {provincia}
              </option>
            ))}
          </select>
          <input
            name="ubicacion"
            placeholder="Ciudad o código postal"
            defaultValue={filtrosIniciales.ubicacion ?? ""}
            className={clasesInput}
          />
          <select name="radio" defaultValue={filtrosIniciales.radioKm ?? ""} onChange={(evento) => aplicar(evento.currentTarget.form!)} className={clasesInput}>
            <option value="">Sin radio (coincidencia exacta)</option>
            {RADIOS_KM.map((km) => (
              <option key={km} value={km}>
                Hasta {km} km
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <p className={clasesEtiquetaGrupo}>Deporte</p>
          <select name="deporte" defaultValue={filtrosIniciales.deporte ?? ""} onChange={(evento) => aplicar(evento.currentTarget.form!)} className={clasesInput}>
            <option value="">Cualquiera</option>
            {opcionesEquipo.deportes.map((deporte) => (
              <option key={deporte} value={deporte}>
                {deporte}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={clasesEtiquetaGrupo}>Categoría</p>
          <select name="categoria" defaultValue={filtrosIniciales.categoria ?? ""} onChange={(evento) => aplicar(evento.currentTarget.form!)} className={clasesInput}>
            <option value="">Cualquiera</option>
            {opcionesEquipo.categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={clasesEtiquetaGrupo}>Género</p>
          <select name="genero" defaultValue={filtrosIniciales.genero ?? ""} onChange={(evento) => aplicar(evento.currentTarget.form!)} className={clasesInput}>
            <option value="">Cualquiera</option>
            {opcionesEquipo.generos.map((genero) => (
              <option key={genero} value={genero}>
                {genero}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={clasesEtiquetaGrupo}>Nivel</p>
          <select name="nivel" defaultValue={filtrosIniciales.nivelEquipo ?? ""} onChange={(evento) => aplicar(evento.currentTarget.form!)} className={clasesInput}>
            <option value="">Cualquiera</option>
            {NIVELES_EQUIPO.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className={clasesEtiquetaGrupo}>Presupuesto</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="min"
            type="number"
            min={0}
            placeholder="Desde €"
            defaultValue={filtrosIniciales.presupuestoMin ?? ""}
            className={clasesInput}
          />
          <input
            name="max"
            type="number"
            min={0}
            placeholder="Hasta €"
            defaultValue={filtrosIniciales.presupuestoMax ?? ""}
            className={clasesInput}
          />
        </div>
        <select
          name="periodo"
          defaultValue={filtrosIniciales.periodo ?? ""}
          onChange={(evento) => aplicar(evento.currentTarget.form!)}
          className={`${clasesInput} mt-2`}
        >
          <option value="">Cualquier periodo</option>
          {PERIODOS_OPORTUNIDAD.map((periodo) => (
            <option key={periodo.id} value={periodo.id}>
              {periodo.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={clasesEtiquetaGrupo}>Forma de colaboración</p>
        <div className="grid grid-cols-2 gap-2">
          {FORMAS_COLABORACION.map((forma) => (
            <label key={forma.id} className={clasesCheckbox}>
              <input
                type="checkbox"
                name="forma"
                value={forma.id}
                defaultChecked={filtrosIniciales.formasColaboracion?.includes(forma.id) ?? false}
                onChange={(evento) => aplicar(evento.currentTarget.form!)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {forma.etiqueta}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={clasesEtiquetaGrupo}>Tipo de oportunidad</p>
        <div className="grid grid-cols-1 gap-2">
          {TIPOS_OPORTUNIDAD.map((tipo) => (
            <label key={tipo.id} className={clasesCheckbox}>
              <input
                type="checkbox"
                name="tipo"
                value={tipo.id}
                defaultChecked={filtrosIniciales.tipos?.includes(tipo.id) ?? false}
                onChange={(evento) => aplicar(evento.currentTarget.form!)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {tipo.etiqueta}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={clasesEtiquetaGrupo}>Objetivo</p>
        <div className="grid grid-cols-1 gap-2">
          {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
            <label key={objetivo.id} className={clasesCheckbox}>
              <input
                type="checkbox"
                name="objetivo"
                value={objetivo.id}
                defaultChecked={filtrosIniciales.objetivos?.includes(objetivo.id) ?? false}
                onChange={(evento) => aplicar(evento.currentTarget.form!)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {objetivo.etiqueta}
            </label>
          ))}
        </div>
      </div>

      {/* El orden vive en la barra de resultados (OPCIONES_ORDEN se reexporta desde aquí para que ambos usen la misma lista), pero el valor seleccionado se manda con este mismo formulario. */}
      <input type="hidden" name="orden" value={filtrosIniciales.orden ?? "novedad"} />

      <div className="flex gap-2 lg:hidden">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Ver resultados
        </button>
        <button
          type="button"
          onClick={limpiar}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Limpiar
        </button>
      </div>

      <button
        type="button"
        onClick={limpiar}
        className="hidden w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 lg:block"
      >
        Limpiar filtros
      </button>
    </form>
  );

  return (
    <>
      {/* Móvil: botón que abre el panel de filtros en un cajón desplegable. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setAbiertoEnMovil(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700"
        >
          Filtros
        </button>

        {abiertoEnMovil && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setAbiertoEnMovil(false)}
              aria-hidden
            />
            <div className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-zinc-900">Filtros</p>
                <button
                  type="button"
                  onClick={() => setAbiertoEnMovil(false)}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
                >
                  Cerrar
                </button>
              </div>
              {contenido}
            </div>
          </div>
        )}
      </div>

      {/* Escritorio: panel fijo en la barra lateral. */}
      <aside className="hidden w-72 shrink-0 rounded-xl border border-zinc-200 bg-white p-5 lg:block">
        {contenido}
      </aside>
    </>
  );
}
