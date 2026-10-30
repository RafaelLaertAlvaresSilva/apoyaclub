import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { Link } from "@/i18n/navigation";
import { PORCENTAJE_POR_DEFECTO } from "@/lib/acceso-admin";
import { accesoAdminDeLaPagina } from "@/lib/acceso-admin-servidor";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { comisionPorMes, type MesDeComision } from "@/lib/comisiones";
import { cobrosDeClubes } from "@/lib/comisiones-stripe";
import { BANDERA_DEL_PAIS, NOMBRE_DEL_PAIS, type Pais } from "@/lib/paises";
import { AdminNav } from "../components/AdminNav";
import { CABECERA_TABLA } from "../components/estilos";

const formatoEuros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const formatoMes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });

function euros(centimos: number): string {
  return formatoEuros.format(centimos / 100);
}

function nombreDelMes(mes: string): string {
  const texto = formatoMes.format(new Date(`${mes}-01T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
          <p className="text-sm font-medium text-teal-700">Panel de administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {esAdministrador ? "Comisiones de los representantes" : "Mi comisión"}
          </h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="comisiones" esAdministrador={esAdministrador} />

      {esAdministrador && representantes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Elegir representante">
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
          Todavía no hay ningún representante. Dalo de alta en{" "}
          <Link href="/admin/representantes" className="font-medium text-accion-tinta underline">
            Representantes
          </Link>
          .
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">
              {esAdministrador && <>{liquidacion.email} · </>}
              {BANDERA_DEL_PAIS[liquidacion.pais]} Clubes de {NOMBRE_DEL_PAIS[liquidacion.pais]} · {liquidacion.porcentaje} %
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 tabular-nums">{euros(total)}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {esAdministrador ? "Su parte" : "Tu parte"} de todo lo cobrado desde que{" "}
              {esAdministrador ? "empezó" : "empezaste"}.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Cómo se calcula, en cada cobro: lo que paga el club, menos el IVA que va dentro del precio, menos
              lo que Stripe se queda de ese cobro. De lo que queda, el {liquidacion.porcentaje} %. Cuentan todos los
              clubes de {NOMBRE_DEL_PAIS[liquidacion.pais]} y las devoluciones ya están descontadas.
            </p>
          </section>

          {falloStripe ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              No se han podido leer los cobros de Stripe ahora mismo. Vuelve a cargar la página en un rato.
            </p>
          ) : meses.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              Todavía no hay cobros de clubes de {NOMBRE_DEL_PAIS[liquidacion.pais]}. Aparecerán aquí en cuanto el
              primero pague.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className={CABECERA_TABLA}>
                  <tr>
                    <th className="px-4 py-3 font-medium">Mes</th>
                    <th className="px-4 py-3 text-right font-medium">Cobrado</th>
                    <th className="px-4 py-3 text-right font-medium">IVA</th>
                    <th className="px-4 py-3 text-right font-medium">Stripe</th>
                    <th className="px-4 py-3 text-right font-medium">Queda</th>
                    <th className="px-4 py-3 text-right font-medium">
                      {esAdministrador ? "Su parte" : "Tu parte"} ({liquidacion.porcentaje} %)
                    </th>
                  </tr>
                </thead>
                {meses.map((mes) => (
                  <tbody key={mes.mes} className="border-t border-zinc-200">
                    <tr className="bg-zinc-50 font-medium text-zinc-900">
                      <td className="px-4 py-3">
                        {nombreDelMes(mes.mes)}{" "}
                        <span className="font-normal text-zinc-500">
                          · {mes.cobros.length} {mes.cobros.length === 1 ? "cobro" : "cobros"}
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
