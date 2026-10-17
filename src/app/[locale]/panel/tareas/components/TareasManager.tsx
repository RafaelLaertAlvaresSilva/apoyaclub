"use client";

import { useTranslations } from "next-intl";
import { useActionState, useMemo, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "../../components/SeccionCard";
import {
  agruparPorEmpresa,
  estadoVisible,
  hoyISO,
  type EmpresaConocida,
  type TareaPatrocinio,
} from "@/lib/tareas-patrocinio";
import { crearTareas } from "../actions";
import { BotonInforme } from "./BotonInforme";
import { TareaFila } from "./TareaFila";

type Filtro = "pendientes" | "caducadas" | "hechas" | "todas";

const FILTROS: Filtro[] = ["pendientes", "caducadas", "hechas", "todas"];

/**
 * Lo que se promete una y otra vez en un patrocinio de club de barrio.
 * No es una lista cerrada: son atajos para no escribir lo mismo cada
 * vez, y el campo sigue siendo texto libre porque lo que promete un
 * club de balonmano no se parece a lo que promete uno de piragüismo.
 */
const ACCIONES_HABITUALES = [
  "publicacionInstagram",
  "storyInstagram",
  "video",
  "visitaJugadores",
  "logoCamiseta",
  "vallaPabellon",
  "mencionPrograma",
  "publicacionFacebook",
] as const;

type LineaFormulario = { id: number; accion: string };

let siguienteId = 1;
const nuevaLinea = (accion = ""): LineaFormulario => ({ id: (siguienteId += 1), accion });

/**
 * La agenda de compromisos del club, agrupada por empresa.
 *
 * Por empresa y no por fecha porque es como el club piensa en esto: la
 * pregunta que se hace no es "¿qué toca el martes?", es "¿qué le debo a
 * la ferretería?". Lo que toca hoy ya está arriba, en su propio bloque.
 */
export function TareasManager({
  tareas,
  empresasConocidas,
}: {
  tareas: TareaPatrocinio[];
  empresasConocidas: EmpresaConocida[];
}) {
  const t = useTranslations("panel.tareas");
  const [estado, formAction] = useActionState(crearTareas, null);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const hoy = hoyISO();

  // Al guardar bien hay que vaciar el formulario entero: el club suele
  // apuntar varias empresas seguidas y dejar lo anterior dentro solo
  // provoca duplicados a medio corregir.
  //
  // Se hace cambiándole la `key`, que lo desmonta y lo vuelve a montar
  // limpio, en vez de llamar a `reset()` desde un efecto. Un efecto que
  // toca el DOM y además cambia estado provoca un render de más y es
  // fácil que se quede a medias; una `key` nueva no puede quedarse a
  // medias.
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [ultimoEstado, setUltimoEstado] = useState(estado);

  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    if (estado?.ok) setClaveFormulario((numero) => numero + 1);
  }

  const visibles = useMemo(() => {
    if (filtro === "todas") return tareas;
    return tareas.filter((tarea) => {
      const visible = estadoVisible(tarea, hoy);
      if (filtro === "hechas") return visible === "hecha";
      if (filtro === "caducadas") return visible === "caducada";
      return tarea.estado === "pendiente";
    });
  }, [tareas, filtro, hoy]);

  const grupos = useMemo(() => agruparPorEmpresa(visibles, hoy), [visibles, hoy]);

  return (
    <div className="flex flex-col gap-6">
      {/* Si ya hay tareas apuntadas, el alta se pliega y lo primero que
          se ve es lo que el club viene a mirar: qué tiene pendiente.
          Estaba al revés —un formulario vacío delante y la lista
          debajo, fuera de pantalla en el móvil— y era lo contrario de
          lo que hacen Oportunidades y "A quién escribir". */}
      {tareas.length === 0 ? (
        <FormularioNuevasTareas
          key={claveFormulario}
          accion={formAction}
          estado={estado}
          empresasConocidas={empresasConocidas}
        />
      ) : (
        <details className="group rounded-xl border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium text-accion-tinta [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-base leading-none">+</span>
            {t("apuntarAlgoNuevo")}
          </summary>
          <div className="border-t border-zinc-100 px-5 py-5">
            <FormularioNuevasTareas
              key={claveFormulario}
              accion={formAction}
              estado={estado}
              empresasConocidas={empresasConocidas}
              sinTarjeta
            />
          </div>
        </details>
      )}

      <SeccionCard
        titulo={t("todoLoPrometido")}
        descripcion={t("todoLoPrometidoTexto")}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTROS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setFiltro(opcion)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === opcion
                  ? "bg-accion text-sobre-color"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {t(`filtros.${opcion}`)}
            </button>
          ))}
        </div>

        {grupos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
            {tareas.length === 0
              ? t("nadaApuntado")
              : t("nadaEnFiltro")}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {grupos.map((grupo) => (
              <div key={grupo.empresa}>
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <h3 className="font-semibold text-zinc-900">{grupo.empresa}</h3>
                  {grupo.caducadas > 0 && (
                    <span className="rounded-full bg-peligro px-2 py-0.5 text-xs font-bold text-sobre-color">
                      {t("vencidas", { n: grupo.caducadas })}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {t("pendientes", { n: grupo.pendientes })}
                  </span>

                  <span className="ml-auto">
                    <BotonInforme empresa={grupo.empresa} compacto />
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {grupo.tareas.map((tarea) => (
                    <TareaFila key={tarea.id} tarea={tarea} hoy={hoy} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SeccionCard>
    </div>
  );
}

/**
 * El formulario de alta, con sus líneas.
 *
 * Va en su propio componente para que el padre pueda vaciarlo entero
 * cambiándole la `key`: al desmontarse se van con él tanto las líneas
 * como lo escrito en los campos, sin tener que ir borrando a mano.
 */
function FormularioNuevasTareas({
  accion: formAction,
  estado,
  empresasConocidas,
  sinTarjeta = false,
}: {
  accion: (formData: FormData) => void;
  estado: { error?: string; ok?: boolean } | null;
  empresasConocidas: EmpresaConocida[];
  /** Dentro del desplegable ya hay recuadro y título propios: no hacen
   * falta otros. Solo la primera vez, con la lista vacía, va con
   * tarjeta. */
  sinTarjeta?: boolean;
}) {
  const t = useTranslations("panel.tareas");
  const [lineas, setLineas] = useState<LineaFormulario[]>([nuevaLinea()]);

  /**
   * Un atajo rellena la última línea si está vacía, y si no añade una
   * nueva. Así se pueden encadenar cuatro clics seguidos y sale el
   * paquete entero sin escribir nada.
   */
  function usarAtajo(accion: string) {
    setLineas((actuales) => {
      const ultima = actuales[actuales.length - 1];
      if (ultima && ultima.accion.trim() === "") {
        return [...actuales.slice(0, -1), { ...ultima, accion }];
      }
      return [...actuales, nuevaLinea(accion)];
    });
  }

  const formulario = (
        <form action={formAction} className="flex flex-col gap-5">
          <SelectorDeEmpresa empresasConocidas={empresasConocidas} />

          <div>
            <p className="mb-2 text-[15px] font-bold text-titular">{t("loHabitual")}</p>
            <div className="flex flex-wrap gap-2">
              {ACCIONES_HABITUALES.map((clave) => t(`atajos.${clave}`)).map((accion) => (
                <button
                  key={accion}
                  type="button"
                  onClick={() => usarAtajo(accion)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
                >
                  + {accion}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-[15px] font-bold text-titular">{t("queHayQueHacer")}</legend>

            {lineas.map((linea, indice) => (
              <div key={linea.id} className="rounded-xl border border-zinc-300 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t("cosa", { n: indice + 1 })}
                  </span>
                  {lineas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLineas((actuales) => actuales.filter((otra) => otra.id !== linea.id))}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      {t("quitar")}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    name="accion"
                    required
                    maxLength={200}
                    value={linea.accion}
                    onChange={(evento) =>
                      setLineas((actuales) =>
                        actuales.map((otra) =>
                          otra.id === linea.id ? { ...otra, accion: evento.target.value } : otra,
                        ),
                      )
                    }
                    placeholder={t("accionEjemplo")}
                    aria-label={t("queHayQueHacerCosa", { n: indice + 1 })}
                    className={clasesInput}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo etiqueta={t("desde")} ayuda={t("desdeAyuda")}>
                      <input name="inicio" type="date" className={clasesInput} />
                    </Campo>
                    <Campo etiqueta={t("fechaLimite")} ayuda={t("fechaLimiteAyuda")}>
                      <input name="fin" type="date" required className={clasesInput} />
                    </Campo>
                  </div>

                  <Campo etiqueta={t("notas")}>
                    <textarea
                      name="notas"
                      maxLength={1000}
                      rows={2}
                      placeholder={t("notasEjemplo")}
                      className={clasesTextarea}
                    />
                  </Campo>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setLineas((actuales) => [...actuales, nuevaLinea()])}
              className="self-start rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
            >
              {t("anadirOtraCosa")}
            </button>
          </fieldset>

          <AvisoError mensaje={estado?.error} />
          <AvisoExito mensaje={estado?.ok ? t("apuntado") : null} />

          <BotonEnviar>
            {t("anadirALaLista", { n: lineas.length })}
          </BotonEnviar>
        </form>
  );

  if (sinTarjeta) return formulario;

  return (
    <SeccionCard
      titulo={t("apuntarPrometido")}
      descripcion={t("apuntarPrometidoTexto")}
    >
      {formulario}
    </SeccionCard>
  );
}


/**
 * Para qué empresa es lo que se apunta.
 *
 * Antes era una casilla de texto con una lista de sugerencias
 * (`<datalist>`) detrás. Tenía dos problemas, y el club solo veía el
 * primero: en el móvil esa lista o no se abre o se abre como un
 * teclado predictivo, así que desde el teléfono no había forma de
 * elegir a los patrocinadores que ya tienes; y al escribir el nombre a
 * mano la tarea se quedaba solo con el texto, sin enganchar con la
 * ficha del patrocinador.
 *
 * Un desplegable de verdad se abre en cualquier teléfono, y al elegir
 * de la lista la tarea se queda enganchada a la ficha. Escribir un
 * nombre nuevo sigue estando a un clic, porque la mayoría de los
 * acuerdos de un club de barrio son con empresas que no están en
 * ninguna parte.
 */
function SelectorDeEmpresa({ empresasConocidas }: { empresasConocidas: EmpresaConocida[] }) {
  const t = useTranslations("panel.tareas");
  const OTRA = "__otra__";

  // Sin nada conocido todavía, un desplegable con una sola opción
  // ("Otra empresa") es un paso de más que no elige nada: se va
  // directo a escribir el nombre.
  const [eleccion, setEleccion] = useState(() => (empresasConocidas.length > 0 ? "" : OTRA));

  const elegida = empresasConocidas.find((empresa) => empresa.nombre === eleccion);
  const esOtra = eleccion === OTRA;

  return (
    <div className="flex flex-col gap-3">
      {empresasConocidas.length > 0 && (
        <Campo
          etiqueta={t("empresa")}
          ayuda={t("empresaAyuda")}
        >
          <select
            name="empresaElegida"
            required
            value={eleccion}
            onChange={(evento) => setEleccion(evento.target.value)}
            className={clasesInput}
          >
            <option value="">{t("eligeEmpresa")}</option>
            {empresasConocidas.map((empresa) => (
              <option key={empresa.nombre} value={empresa.nombre}>
                {empresa.nombre}
              </option>
            ))}
            <option value={OTRA}>{t("otraEmpresa")}</option>
          </select>
        </Campo>
      )}

      {esOtra && (
        <Campo
          etiqueta={empresasConocidas.length > 0 ? t("nombreEmpresa") : t("empresa")}
          ayuda={t("noHaceFaltaRegistrada")}
        >
          <input
            name="empresa"
            required
            maxLength={120}
            placeholder={t("empresaEjemplo")}
            className={clasesInput}
          />
        </Campo>
      )}

      {/* Elegida de la lista: el nombre viaja aquí, y con él el
          identificador de su ficha cuando lo tiene. */}
      {!esOtra && <input type="hidden" name="empresa" value={eleccion} />}
      {!esOtra && elegida?.id && (
        <input type="hidden" name="patrocinadorId" value={elegida.id} />
      )}
    </div>
  );
}
