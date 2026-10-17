"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Link } from "@/i18n/navigation";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import {
  agruparPorEquipo,
  agruparPorMes,
  agruparPorTemporada,
  fechaLarga,
  hoyParaElFormulario,
  mediaParaLaFicha,
  type Partido,
} from "@/lib/publico-partidos";
import { guardarPartido, usarMediaEnLaFicha } from "../actions";
import { PartidoFila } from "./PartidoFila";

const clasesInput =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

/**
 * El registro de público del club (migración 0037).
 *
 * Lo que se enseña arriba no es la lista de partidos: es lo que un
 * patrocinador pregunta —cuánta gente pasa por delante de su valla—, y
 * la lista es la prueba de que ese número sale de algún sitio.
 */
export function RegistroDePublico({
  partidos,
  equiposDelClub,
  mediaEnLaFicha,
}: {
  partidos: Partido[];
  equiposDelClub: { id: string; etiqueta: string }[];
  mediaEnLaFicha: number | null;
}) {
  const t = useTranslations("panel.publico");
  const intlLocale = useIntlLocale();
  const formatoNumero = new Intl.NumberFormat(intlLocale);
  const [estadoAlta, alta] = useActionState(guardarPartido, null);
  const [estadoMedia, copiarMedia] = useActionState(usarMediaEnLaFicha, null);
  const [abierto, setAbierto] = useState(partidos.length === 0);
  const [equipoElegido, setEquipoElegido] = useState("");

  // Al guardar, React vacía los campos del formulario, pero el
  // desplegable lo manejamos nosotros y no se entera: hay que
  // devolverlo a su sitio a mano.
  const [altaVista, setAltaVista] = useState(estadoAlta);
  if (estadoAlta !== altaVista) {
    setAltaVista(estadoAlta);
    if (estadoAlta?.ok) setEquipoElegido("");
  }

  const temporadas = agruparPorTemporada(partidos);
  const ultima = temporadas[0] ?? null;
  const media = mediaParaLaFicha(partidos);
  const yaEstaEnLaFicha = media !== null && media === mediaEnLaFicha;

  // Si el club renombra un equipo en su ficha, su historial de público
  // se enseña con el nombre nuevo.
  const etiquetasPorId = new Map(equiposDelClub.map((equipo) => [equipo.id, equipo.etiqueta]));
  const porEquipo = ultima ? agruparPorEquipo(ultima.partidos, etiquetasPorId, {
        equipoBorrado: t("equipoBorrado"),
        sinEquipo: t("sinEquipoAsignado"),
      }) : [];
  const porMes = ultima ? agruparPorMes(ultima.partidos, intlLocale) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Lo que se le enseña a una empresa ---- */}
      {ultima && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-zinc-900">
              {t("temporada", { temporada: ultima.temporada })}
            </h2>
            <p className="text-xs text-zinc-500">
              {t("partidosApuntados", { n: ultima.resumen.partidos })}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Dato
              numero={formatoNumero.format(ultima.resumen.total)}
              etiqueta={t("personasEnTotal")}
              detalle={t("sumandoTodos")}
            />
            <Dato
              numero={
                ultima.resumenEnCasa.media != null
                  ? formatoNumero.format(ultima.resumenEnCasa.media)
                  : "—"
              }
              etiqueta={t("mediaEnCasa")}
              detalle={
                ultima.resumenEnCasa.partidos > 0
                  ? t("sobrePartidosEnCasa", { n: ultima.resumenEnCasa.partidos })
                  : t("aunNoHayEnCasa")
              }
            />
            {/* El mejor, de los de casa. Salía de todos los partidos, así
                que un desplazamiento con 2.000 personas del rival podía
                figurar como el mejor partido del club: es gente que no
                iba a verte a ti. */}
            <Dato
              numero={
                ultima.resumenEnCasa.mejor
                  ? formatoNumero.format(ultima.resumenEnCasa.mejor.publico)
                  : "—"
              }
              etiqueta={t("mejorEnCasa")}
              detalle={
                ultima.resumenEnCasa.mejor
                  ? `${ultima.resumenEnCasa.mejor.rival}, ${fechaLarga(ultima.resumenEnCasa.mejor.fecha, intlLocale)}`
                  : t("aunNoHayEnCasa")
              }
            />
          </div>

          {/* ---- Equipo por equipo ---- */}
          {porEquipo.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">{t("equipoPorEquipo")}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{t("equipoPorEquipoTexto")}</p>

              <ul className="mt-3 flex flex-col gap-2">
                {porEquipo.map((equipo) => (
                  <li
                    key={equipo.clave}
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border p-3 ${
                      equipo.sinAsignar ? "border-dashed border-zinc-300 bg-zinc-50" : "border-zinc-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{equipo.etiqueta}</p>
                      <p className="text-xs text-zinc-500">
                        {t("partidos", { n: equipo.resumen.partidos })}
                        {equipo.resumenEnCasa.partidos > 0 &&
                          ` · ${t("enCasaCuantos", { n: equipo.resumenEnCasa.partidos })}`}
                        {` · ${t("personasEnTotalCuantas", { personas: formatoNumero.format(equipo.resumen.total) })}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-semibold tabular-nums text-zinc-900">
                        {equipo.resumenEnCasa.media != null
                          ? formatoNumero.format(equipo.resumenEnCasa.media)
                          : equipo.resumen.media != null
                            ? formatoNumero.format(equipo.resumen.media)
                            : "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {equipo.resumenEnCasa.media != null ? t("deMediaEnCasa") : t("deMedia")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {porEquipo.some((equipo) => equipo.sinAsignar) && (
                <p className="mt-2 text-xs text-zinc-500">
                  {t("sinEquipoNota")}
                </p>
              )}
            </div>
          )}

          {/* ---- Mes a mes ---- */}
          {porMes.length > 1 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">{t("mesAMes")}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{t("mesAMesTexto")}</p>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[380px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="pb-2 font-medium">{t("mes")}</th>
                      <th className="pb-2 text-right font-medium">{t("partidosColumna")}</th>
                      <th className="pb-2 text-right font-medium">{t("total")}</th>
                      <th className="pb-2 text-right font-medium">{t("media")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {porMes.map((mes) => (
                      <tr key={mes.mes}>
                        <td className="py-2 text-zinc-700">{mes.etiqueta}</td>
                        <td className="py-2 text-right tabular-nums text-zinc-600">
                          {mes.resumen.partidos}
                        </td>
                        <td className="py-2 text-right tabular-nums text-zinc-600">
                          {formatoNumero.format(mes.resumen.total)}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums text-zinc-900">
                          {mes.resumen.media != null ? formatoNumero.format(mes.resumen.media) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* La media no se copia sola a la ficha: es un dato que el
              club escribió él y pisárselo por detrás es cambiarle el
              escaparate sin avisar. */}
          {media !== null && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-4">
              {yaEstaEnLaFicha ? (
                <p className="text-sm text-zinc-600">
                  {t.rich("fichaYaEnsena", {
                    media: formatoNumero.format(media),
                    fuerte: (trozo) => <strong>{trozo}</strong>,
                  })}
                </p>
              ) : (
                <form action={copiarMedia} className="flex flex-wrap items-center gap-3">
                  <p className="min-w-0 flex-1 text-sm text-zinc-600">
                    {t.rich(mediaEnLaFicha != null ? "fichaPone" : "fichaSinMedia", {
                      enFicha: mediaEnLaFicha != null ? formatoNumero.format(mediaEnLaFicha) : "",
                      media: formatoNumero.format(media),
                      fuerte: (trozo) => <strong>{trozo}</strong>,
                    })}
                  </p>
                  <button
                    type="submit"
                    className="rounded-lg bg-accion px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-accion-fuerte"
                  >
                    {t("usarMedia")}
                  </button>
                </form>
              )}

              <AvisoError mensaje={estadoMedia?.error ?? null} />
              <AvisoExito
                mensaje={estadoMedia?.ok ? t("mediaCopiada") : null}
              />
            </div>
          )}
        </section>
      )}

      {/* ---- Apuntar un partido ---- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-900">{t("apuntarPartido")}</h2>
          {partidos.length > 0 && (
            <button
              type="button"
              onClick={() => setAbierto((valor) => !valor)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
            >
              {abierto ? t("cerrar") : t("anadirPartido")}
            </button>
          )}
        </div>

        {abierto && (
          <form action={alta} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta={t("fechaPartido")}>
                <input
                  type="date"
                  name="fecha"
                  required
                  defaultValue={hoyParaElFormulario()}
                  className={clasesInput}
                />
              </Campo>
              <Campo etiqueta={t("rival")}>
                <input
                  name="rival"
                  required
                  maxLength={120}
                  placeholder={t("rivalEjemplo")}
                  className={clasesInput}
                />
              </Campo>
              <Campo etiqueta={t("dondeSeJugo")}>
                <select name="donde" defaultValue="casa" className={clasesInput}>
                  <option value="casa">{t("enCasa")}</option>
                  <option value="fuera">{t("fuera")}</option>
                </select>
              </Campo>
              <Campo etiqueta={t("cuantaGente")}>
                <input
                  name="publico"
                  required
                  inputMode="numeric"
                  placeholder="240"
                  className={clasesInput}
                />
              </Campo>
              <Campo etiqueta={t("equipo")}>
                <select
                  name="equipoId"
                  value={equipoElegido}
                  onChange={(evento) => setEquipoElegido(evento.target.value)}
                  className={clasesInput}
                >
                  <option value="">{t("sinEspecificar")}</option>
                  {equiposDelClub.map((equipo) => (
                    <option key={equipo.id} value={equipo.id}>
                      {equipo.etiqueta}
                    </option>
                  ))}
                  <option value="otro">{t("otroEscribirlo")}</option>
                </select>

                {equipoElegido === "otro" && (
                  <input
                    name="equipo"
                    maxLength={120}
                    placeholder={t("equipoEjemplo")}
                    className={`${clasesInput} mt-2`}
                  />
                )}

                {equiposDelClub.length === 0 && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {t.rich("sinEquipos", {
                      enlace: (trozo) => (
                        <Link href="/panel/perfil#equipos" className="font-medium text-teal-700 hover:underline">
                          {trozo}
                        </Link>
                      ),
                    })}
                  </p>
                )}
              </Campo>
              <Campo etiqueta={t("competicion")}>
                <input
                  name="competicion"
                  maxLength={120}
                  placeholder={t("competicionEjemplo")}
                  className={clasesInput}
                />
              </Campo>
            </div>

            <Campo etiqueta={t("notas")}>
              <input
                name="notas"
                maxLength={1000}
                placeholder={t("notasEjemplo")}
                className={clasesInput}
              />
            </Campo>

            <p className="text-xs text-zinc-500">
              {t("estimacion")}
            </p>

            <AvisoError mensaje={estadoAlta?.error ?? null} />
            <AvisoExito mensaje={estadoAlta?.ok ? t("partidoApuntado") : null} />

            <BotonEnviar>{t("guardarPartido")}</BotonEnviar>
          </form>
        )}
      </section>

      {/* ---- La lista, por temporadas ---- */}
      {temporadas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          {t("ningunPartido")}
        </p>
      ) : (
        temporadas.map((temporada) => (
          <section
            key={temporada.temporada}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-zinc-900">
                {t("temporada", { temporada: temporada.temporada })}
              </h2>
              <p className="text-xs text-zinc-500">
                {t("personasEnPartidos", {
                  personas: formatoNumero.format(temporada.resumen.total),
                  n: temporada.resumen.partidos,
                })}
                {temporada.resumen.media != null &&
                  ` · ${t("mediaDe", { media: formatoNumero.format(temporada.resumen.media) })}`}
              </p>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {temporada.partidos.map((partido) => (
                <PartidoFila key={partido.id} partido={partido} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Dato({
  numero,
  etiqueta,
  detalle,
}: {
  numero: string;
  etiqueta: string;
  detalle: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-2xl font-semibold tabular-nums text-zinc-900">{numero}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-700">{etiqueta}</p>
      {detalle && <p className="mt-1 text-xs text-zinc-500">{detalle}</p>}
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[15px] font-bold text-titular">{etiqueta}</span>
      {children}
    </label>
  );
}
