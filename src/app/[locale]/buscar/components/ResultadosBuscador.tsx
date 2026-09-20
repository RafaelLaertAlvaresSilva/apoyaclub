"use client";

import Image from "next/image";
import { BotonFavorito } from "@/components/Favoritos";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { filtrosAQueryString, OPCIONES_ORDEN } from "@/lib/buscar-params";
import {
  ETIQUETA_FORMA_COLABORACION,
  ETIQUETA_OBJETIVO,
  ETIQUETA_PERIODO,
  CLASES_NIVEL_PATROCINIO,
  ETIQUETA_CATEGORIA_NECESIDAD,
  ETIQUETA_NIVEL_PATROCINIO,
  ETIQUETA_TIPO_OPORTUNIDAD,
  esPorPlazas,
  formatoValorOportunidad,
  plazasLibres,
} from "@/lib/opportunities";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { agruparPorClub, type FiltrosBusqueda, type PaginaBusqueda, type ResultadoClub, type ResultadoOportunidad, type VistaBusqueda } from "@/lib/search-types";

const formatoDistancia = (km: number) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

export function ResultadosBuscador({
  filtros,
  vistaInicial,
  paginaInicial,
}: {
  filtros: FiltrosBusqueda;
  vistaInicial: VistaBusqueda;
  paginaInicial: PaginaBusqueda<ResultadoOportunidad>;
}) {
  const t = useTranslations("buscar.resultados");
  const router = useRouter();
  const [vista, setVista] = useState<VistaBusqueda>(vistaInicial);
  const [oportunidades, setOportunidades] = useState<ResultadoOportunidad[]>(paginaInicial.resultados);
  const [hayMas, setHayMas] = useState(paginaInicial.hayMas);
  const [total, setTotal] = useState(paginaInicial.total);
  const [cargando, setCargando] = useState(false);

  function cambiarVista(nueva: VistaBusqueda) {
    setVista(nueva);
    // Cambia la URL para que se pueda compartir tal cual, pero sin pasar
    // por el servidor: los resultados ya están cargados en el cliente,
    // así que no hace falta otra consulta.
    const url = `/buscar?${filtrosAQueryString(filtros, nueva)}`;
    window.history.replaceState(null, "", url);
  }

  function cambiarOrden(orden: FiltrosBusqueda["orden"]) {
    router.push(`/buscar?${filtrosAQueryString({ ...filtros, orden }, vista)}`, { scroll: false });
  }

  async function cargarMas() {
    setCargando(true);
    try {
      const qs = filtrosAQueryString(filtros, vista);
      const respuesta = await fetch(`/api/buscar?${qs}&desde=${oportunidades.length}`);
      if (!respuesta.ok) return;
      const pagina = (await respuesta.json()) as PaginaBusqueda<ResultadoOportunidad>;
      setOportunidades((actual) => [...actual, ...pagina.resultados]);
      setHayMas(pagina.hayMas);
      setTotal(pagina.total);
    } finally {
      setCargando(false);
    }
  }

  const clubes = vista === "club" ? agruparPorClub(oportunidades) : [];

  return (
    <div className="min-w-0 flex-1 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          <BotonVista activo={vista === "oportunidad"} onClick={() => cambiarVista("oportunidad")}>
            {t("porOportunidad")}
          </BotonVista>
          <BotonVista activo={vista === "club"} onClick={() => cambiarVista("club")}>
            {t("porClub")}
          </BotonVista>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="orden" className="text-zinc-500">
            {t("ordenarPor")}
          </label>
          <select
            id="orden"
            value={filtros.orden ?? "novedad"}
            onChange={(evento) => cambiarOrden(evento.target.value as FiltrosBusqueda["orden"])}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark"
          >
            {OPCIONES_ORDEN.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        {total != null
          ? t("cuenta", { total })
          : t("cuentaAproximada", { cantidad: oportunidades.length })}
      </p>

      {oportunidades.length === 0 ? (
        <EstadoVacio filtros={filtros} vista={vista} />
      ) : vista === "oportunidad" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {oportunidades.map((oportunidad) => (
            <TarjetaOportunidad key={oportunidad.opportunityId} oportunidad={oportunidad} />
          ))}
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {clubes.map((club) => (
            <TarjetaClub key={club.clubId} club={club} />
          ))}
        </ul>
      )}

      {hayMas && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={cargarMas}
            disabled={cargando}
            className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          >
            {cargando ? t("cargando") : t("cargarMas")}
          </button>
        </div>
      )}
    </div>
  );
}

function BotonVista({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        activo ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function Logo({ url, nombre }: { url: string | null; nombre: string }) {
  return url ? (
    <Image src={url} alt={nombre} width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain p-0.5" />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

function Ubicacion({
  ciudad,
  provincia,
  distanceKm,
}: {
  ciudad: string;
  provincia: string | null;
  distanceKm: number | null;
}) {
  const tUbicacion = useTranslations("buscar.resultados");

  return (
    <p className="text-xs text-zinc-500">
      {[ciudad, provincia].filter(Boolean).join(", ")}
      {distanceKm != null && (
        <span className="font-medium text-teal-700">
          {tUbicacion("distancia", { distancia: formatoDistancia(distanceKm) })}
        </span>
      )}
    </p>
  );
}

function TarjetaOportunidad({ oportunidad }: { oportunidad: ResultadoOportunidad }) {
  const tTarjeta = useTranslations("buscar.resultados");
  const etiquetas = [
    ETIQUETA_TIPO_OPORTUNIDAD[oportunidad.opportunityType],
    oportunidad.period ? ETIQUETA_PERIODO[oportunidad.period] : null,
    oportunidad.collaborationType ? ETIQUETA_FORMA_COLABORACION[oportunidad.collaborationType] : null,
  ].filter((etiqueta): etiqueta is string => !!etiqueta);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Logo url={oportunidad.clubLogoUrl} nombre={oportunidad.clubName} />
        <div className="min-w-0 flex-1">
          <Link href={`/club/${oportunidad.clubSlug}`} className="text-sm font-medium text-zinc-700 hover:underline">
            {oportunidad.clubName}
          </Link>
          <Ubicacion ciudad={oportunidad.clubCity} provincia={oportunidad.clubProvince} distanceKm={oportunidad.distanceKm} />
        </div>
        <BotonFavorito tipo="oportunidad" id={oportunidad.opportunityId} nombre={oportunidad.title} />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900">{oportunidad.title}</p>
          {/* La oportunidad al revés: el club necesita esto y da
              visibilidad a cambio (migración 0038). */}
          {oportunidad.esNecesidad && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Lo necesitan
              {oportunidad.categoriaNecesidad
                ? ` · ${ETIQUETA_CATEGORIA_NECESIDAD[oportunidad.categoriaNecesidad]}`
                : ""}
            </span>
          )}
          {oportunidad.sponsorLevel !== "libre" && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                CLASES_NIVEL_PATROCINIO[oportunidad.sponsorLevel]
              }`}
            >
              {ETIQUETA_NIVEL_PATROCINIO[oportunidad.sponsorLevel]}
            </span>
          )}
        </div>
        {oportunidad.teamLabel && <p className="mt-0.5 text-xs text-zinc-500">{oportunidad.teamLabel}</p>}
        {oportunidad.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{oportunidad.description}</p>}
        {oportunidad.exclusivity && (
          <p className="mt-1 text-xs font-medium text-brand-teal-dark">
            {tTarjeta("exclusiva", { sector: oportunidad.exclusivity })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {etiquetas.map((etiqueta) => (
          <span key={etiqueta} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {etiqueta}
          </span>
        ))}
        {oportunidad.objectives.map((objetivo) => (
          <span key={objetivo} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            {ETIQUETA_OBJETIVO[objetivo]}
          </span>
        ))}
      </div>

      {esPorPlazas(oportunidad) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-brand-teal-dark">
            {tTarjeta("plazas", {
              libres: plazasLibres(oportunidad),
              total: oportunidad.slotsTotal ?? 0,
            })}
          </p>
          <BarraDePlazas
            slotsTotal={oportunidad.slotsTotal}
            slotsTaken={oportunidad.slotsTaken}
            etiqueta={oportunidad.esNecesidad ? "colaboradores" : "plazas"}
          />
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-1">
        <p className="text-lg font-bold text-teal-700">
          {formatoValorOportunidad.format(oportunidad.value)}
          {esPorPlazas(oportunidad) && (
            <span className="ml-1 text-xs font-medium text-zinc-500">{tTarjeta("porEmpresa")}</span>
          )}
        </p>
        <span className="flex flex-wrap items-center gap-2">
          {/* Directa al detalle del acuerdo: qué recibe la empresa,
              quién hace cada cosa y con qué condiciones. Desde el
              buscador, lo que se está mirando es ESTA oportunidad, no
              el club entero; obligar a pasar por su ficha completa para
              volver a buscarla es un paso de más. */}
          <Link
            href={`/club/${oportunidad.clubSlug}/oportunidad/${oportunidad.opportunityId}`}
            className="rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-50"
          >
            Ver ficha
          </Link>
          <Link
            href={`/club/${oportunidad.clubSlug}`}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
          >
            {tTarjeta("verClub")}
          </Link>
        </span>
      </div>
    </li>
  );
}

function TarjetaClub({ club }: { club: ResultadoClub }) {
  const tClub = useTranslations("buscar.resultados");
  const rango =
    club.minValue === club.maxValue
      ? formatoValorOportunidad.format(club.minValue)
      : `${formatoValorOportunidad.format(club.minValue)} – ${formatoValorOportunidad.format(club.maxValue)}`;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Logo url={club.clubLogoUrl} nombre={club.clubName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">{club.clubName}</p>
          <Ubicacion ciudad={club.clubCity} provincia={club.clubProvince} distanceKm={club.distanceKm} />
        </div>
        <BotonFavorito tipo="club" id={club.clubId} nombre={club.clubName} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {club.opportunityTypes.map((tipo) => (
          <span key={tipo} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {ETIQUETA_TIPO_OPORTUNIDAD[tipo]}
          </span>
        ))}
      </div>

      <p className="text-sm text-zinc-600">
        {tClub("oportunidadesDelClub", { total: club.opportunitiesCount, rango })}
      </p>

      <Link
        href={`/club/${club.clubSlug}`}
        className="mt-auto rounded-lg bg-teal-700 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-teal-800"
      >
        Ver página del club
      </Link>
    </li>
  );
}

function EstadoVacio({ filtros, vista }: { filtros: FiltrosBusqueda; vista: VistaBusqueda }) {
  const tVacio = useTranslations("buscar.resultados");
  const router = useRouter();
  // El orden y la pestaña de "qué buscas" no son filtros: vienen
  // puestos de casa. Contarlos hacía que, entrando al buscador limpio,
  // saliera "prueba a quitar algún filtro" sin haber puesto ninguno.
  // Con pocos clubes todavía, ese es el primer mensaje que ve una
  // empresa: un callejón sin salida que además no es verdad.
  const NO_SON_FILTROS = new Set(["orden", "busca", "vista"]);
  const tieneFiltros = Object.entries(filtros).some(([nombre, valor]) => {
    if (NO_SON_FILTROS.has(nombre)) return false;
    if (Array.isArray(valor)) return valor.length > 0;
    return valor != null && valor !== "" && valor !== "todo";
  });

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
      <p className="font-medium text-zinc-900">
        {tieneFiltros ? tVacio("vacioTitulo") : tVacio("vacioSinFiltrosTitulo")}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
        {!tieneFiltros
          ? tVacio("vacioSinFiltrosTexto")
          : filtros.radioKm
            ? tVacio("vacioConRadio")
            : tVacio("vacioSinRadio")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filtros.radioKm && (
          <button
            type="button"
            onClick={() =>
              router.push(`/buscar?${filtrosAQueryString({ ...filtros, radioKm: filtros.radioKm! * 2 }, vista)}`)
            }
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            {tVacio("ampliarRadio", { km: filtros.radioKm! * 2 })}
          </button>
        )}
        {tieneFiltros ? (
          <button
            type="button"
            onClick={() => router.push("/buscar")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {tVacio("quitarFiltros")}
          </button>
        ) : (
          <Link
            href="/servicios"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            {tVacio("verQueNecesitan")}
          </Link>
        )}
      </div>
    </div>
  );
}
