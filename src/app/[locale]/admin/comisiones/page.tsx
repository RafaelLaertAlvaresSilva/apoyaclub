import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { intlLocaleDe } from "@/config/locales";
import { Link } from "@/i18n/navigation";
import { PORCENTAJE_POR_DEFECTO } from "@/lib/acceso-admin";
import { accesoAdminDeLaPagina } from "@/lib/acceso-admin-servidor";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { comisionPorMes, type MesDeComision } from "@/lib/comisiones";
import { cobrosDeClubes } from "@/lib/comisiones-stripe";
import { BANDERA_DEL_PAIS, type Pais } from "@/lib/paises";
import { AdminNav } from "../components/AdminNav";
import { CABECERA_TABLA } from "../components/estilos";

type Liquidacion = {
  email: string;
  pais: Pais;
  porcentaje: number;
  desde: string;
};

/**
 * La comisión de un representante, mes a mes.
 *
 * El representante ve la suya y nada más: ni la de otros, ni el resto
 * de las finanzas. El administrador elige de quién verla.
 *
 * Cuenta todos los clubes de su país (lo acordado: no solo los que trae
 * él), y solo lo cobrado desde que empezó.
 */
export default async function ComisionesPage({ searchParams }: { searchParams: Promise<{ rep?: string }> }) {
  const { rep } = await searchParams;
  const acceso = await accesoAdminDeLaPagina();
  const esAdministrador = acceso.tipo === "admin";

  // En el idioma con el que entra: el representante de Brasil, en /br.
  const t = await getTranslations("admin.comisiones");
  const idioma = intlLocaleDe(await getLocale());
  const formatoEuros = new Intl.NumberFormat(idioma, { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
  const formatoMes = new Intl.DateTimeFormat(idioma, { month: "long", year: "numeric", timeZone: "UTC" });
  const formatoFecha = new Intl.DateTimeFormat(idioma, { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
  const euros = (centimos: number) => formatoEuros.format(centimos / 100);
  const nombreDelMes = (mes: string) => {
    const texto = formatoMes.format(new Date(`${mes}-01T00:00:00Z`));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  const [clubes, representantes] = await Promise.all([
    obtenerUsuariosPorRol("club"),
    obtenerUsuariosPorRol("representante"),
  ]);

  // De quién es la liquidación que se enseña. Un representante, siempre
  // la suya: aunque escriba otro `?rep=` en la dirección, no se mira.
  let liquidacion: Liquidacion | null = null;
  let elegido: string | null = null;

  if (acceso.tipo === "representante") {
    const yo = representantes.find((representante) => representante.id === acceso.id);
    liquidacion = {
      email: yo?.email ?? "",
      pais: acceso.pais,
      porcentaje: acceso.porcentaje,
      desde: acceso.desde ?? new Date().toISOString(),
    };
  } else {
    const elegible = representantes.find((representante) => representante.id === rep) ?? representantes[0];
    if (elegible) {
      elegido = elegible.id;
      const porcentaje = Number(elegible.appMetadata.porcentaje);
      liquidacion = {
        email: elegible.email ?? "",
        pais: elegible.pais,
        porcentaje: Number.isFinite(porcentaje) && porcentaje > 0 ? porcentaje : PORCENTAJE_POR_DEFECTO,
        desde: elegible.createdAt,
      };
    }
  }

  let meses: MesDeComision[] = [];
  let falloStripe = false;

  if (liquidacion) {
    const idsDelPais = clubes.filter((club) => club.pais === liquidacion.pais).map((club) => club.id);
    try {
      meses = comisionPorMes(await cobrosDeClubes(idsDelPais), liquidacion.porcentaje, liquidacion.desde);
    } catch {
      falloStripe = true;
    }
  }

  const total = meses.reduce((suma, mes) => suma + mes.parteCentimos, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panel")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {esAdministrador ? t("tituloAdmin") : t("titulo")}
          </h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="comisiones" esAdministrador={esAdministrador} />

      {esAdministrador && representantes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label={t("elegir")}>
          {representantes.map((representante) => (
            <Link
              key={representante.id}
              href={`/admin/comisiones?rep=${representante.id}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                representante.id === elegido
                  ? "border-accion-tinta bg-white font-medium text-accion-tinta"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              {BANDERA_DEL_PAIS[representante.pais]} {representante.email}
            </Link>
          ))}
        </nav>
      )}

      {!liquidacion ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          {t.rich("sinRepresentantes", {
            enlace: (trozo) => (
              <Link href="/admin/representantes" className="font-medium text-accion-tinta underline">
                {trozo}
              </Link>
            ),
          })}
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">
              {esAdministrador && <>{liquidacion.email} · </>}
              {BANDERA_DEL_PAIS[liquidacion.pais]} {t("clubesDe", { pais: liquidacion.pais })} · {liquidacion.porcentaje} %
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 tabular-nums">{euros(total)}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {esAdministrador ? t("suParte") : t("tuParte")}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {t("comoSeCalcula", { porcentaje: liquidacion.porcentaje, pais: liquidacion.pais })}
            </p>
          </section>

          {falloStripe ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              {t("falloStripe")}
            </p>
          ) : meses.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              {t("sinCobros", { pais: liquidacion.pais })}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className={CABECERA_TABLA}>
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("mes")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("cobrado")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("iva")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("stripe")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("queda")}</th>
                    <th className="px-4 py-3 text-right font-medium">
                      {esAdministrador
                        ? t("columnaSuParte", { porcentaje: liquidacion.porcentaje })
                        : t("columnaTuParte", { porcentaje: liquidacion.porcentaje })}
                    </th>
                  </tr>
                </thead>
                {meses.map((mes) => (
                  <tbody key={mes.mes} className="border-t border-zinc-200">
                    <tr className="bg-zinc-50 font-medium text-zinc-900">
                      <td className="px-4 py-3">
                        {nombreDelMes(mes.mes)}{" "}
                        <span className="font-normal text-zinc-500">
                          · {t("cobros", { n: mes.cobros.length })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{euros(mes.cobradoCentimos)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">−{euros(mes.ivaCentimos)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">−{euros(mes.stripeCentimos)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{euros(mes.netoCentimos)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-accion-tinta">{euros(mes.parteCentimos)}</td>
                    </tr>
                    {mes.cobros.map((cobro) => (
                      <tr key={cobro.id} className="text-zinc-600">
                        <td className="px-4 py-2 pl-8">
                          {cobro.clubNombre}{" "}
                          <span className="text-xs text-zinc-400">{formatoFecha.format(new Date(cobro.fecha))}</span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{euros(cobro.cobradoCentimos)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">−{euros(cobro.ivaCentimos)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">−{euros(cobro.stripeCentimos)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{euros(cobro.netoCentimos)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{euros(cobro.parteCentimos)}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
