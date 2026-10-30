import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { PORCENTAJE_POR_DEFECTO } from "@/lib/acceso-admin";
import { soloAdministrador } from "@/lib/acceso-admin-servidor";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { BANDERA_DEL_PAIS, NOMBRE_DEL_PAIS, PAISES } from "@/lib/paises";
import { SITE_URL } from "@/lib/site";
import { AdminNav } from "../components/AdminNav";
import { CABECERA_TABLA } from "../components/estilos";
import {
  crearRepresentante,
  desactivarRepresentante,
  reactivarRepresentante,
  reenviarCorreo,
} from "./actions";

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

const AVISOS: Record<string, { texto: string; bien: boolean }> = {
  creado: {
    texto:
      "Representante dado de alta. Le ha llegado un correo para poner su contraseña (es el de «restablecer contraseña»). Cuando entre, verá los clubes de su país y su comisión.",
    bien: true,
  },
  "correo-enviado": { texto: "Correo enviado otra vez.", bien: true },
  desactivado: { texto: "Acceso quitado. Ya no puede entrar. Su historial de comisiones se conserva.", bien: true },
  reactivado: { texto: "Acceso devuelto. Ya puede volver a entrar.", bien: true },
  datos: { texto: "Revisa el correo, el país y el porcentaje (entre 1 y 100).", bien: false },
  "ya-existe": {
    texto:
      "Ya hay una cuenta con ese correo (puede ser de un club o de una empresa). Usa otro correo para el representante.",
    bien: false,
  },
  fallo: { texto: "No se ha podido hacer. Inténtalo otra vez en un rato.", bien: false },
  "no-admin": { texto: "Tu sesión ha caducado. Vuelve a iniciar sesión.", bien: false },
};

const IDIOMA_DEL_PAIS = { ES: "es", PT: "pt", BR: "br" } as const;

/**
 * Los representantes: quién lleva ApoyaClub en cada país. Solo del
 * administrador.
 *
 * Darlo de alta aquí le crea la cuenta y le manda el correo para poner
 * su contraseña. Quitarle el acceso no borra nada: se le bloquea la
 * entrada y se conserva su historial.
 */
export default async function RepresentantesPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  await soloAdministrador();
  const { aviso } = await searchParams;
  const mensaje = aviso ? AVISOS[aviso] : undefined;

  const [representantes, clubes] = await Promise.all([
    obtenerUsuariosPorRol("representante"),
    obtenerUsuariosPorRol("club"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel de administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Representantes</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="representantes" />

      {mensaje && (mensaje.bien ? <AvisoExito mensaje={mensaje.texto} /> : <AvisoError mensaje={mensaje.texto} />)}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Dar de alta un representante</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Verá y gestionará los clubes de su país (también suspender) y su comisión. Nada más: ni las finanzas, ni
          las empresas, ni otros países.
        </p>
        <form action={crearRepresentante} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_7rem_auto] sm:items-end">
          <div>
            <label htmlFor="rep-email" className="block text-sm font-medium text-zinc-700">
              Correo
            </label>
            <input
              id="rep-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="rep-pais" className="block text-sm font-medium text-zinc-700">
              País
            </label>
            <select
              id="rep-pais"
              name="pais"
              defaultValue="BR"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              {PAISES.map((pais) => (
                <option key={pais} value={pais}>
                  {NOMBRE_DEL_PAIS[pais]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-porcentaje" className="block text-sm font-medium text-zinc-700">
              Su parte (%)
            </label>
            <input
              id="rep-porcentaje"
              name="porcentaje"
              type="number"
              min={1}
              max={100}
              defaultValue={PORCENTAJE_POR_DEFECTO}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-brand-navy"
          >
            Dar de alta
          </button>
        </form>
      </section>

      {representantes.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no hay ningún representante.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={CABECERA_TABLA}>
              <tr>
                <th className="px-4 py-3 font-medium">Representante</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Su parte</th>
                <th className="px-4 py-3 font-medium">Su enlace</th>
                <th className="px-4 py-3 font-medium">Clubes</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {representantes.map((representante) => {
                const meta = representante.appMetadata;
                const activo = meta.activo !== false;
                const codigo = typeof meta.codigo === "string" ? meta.codigo : null;
                const delPais = clubes.filter((club) => club.pais === representante.pais);
                const traidos = codigo ? delPais.filter((club) => club.origenCampana === codigo).length : 0;

                return (
                  <tr key={representante.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{representante.email}</p>
                      <p className="text-xs text-zinc-500">
                        Desde el {formatoFecha.format(new Date(representante.createdAt))}
                        {!activo && " · sin acceso"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {BANDERA_DEL_PAIS[representante.pais]} {NOMBRE_DEL_PAIS[representante.pais]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700">{String(meta.porcentaje ?? PORCENTAJE_POR_DEFECTO)} %</td>
                    <td className="px-4 py-3">
                      {codigo ? (
                        <p className="break-all font-mono text-xs text-accion-tinta">
                          {SITE_URL}/{IDIOMA_DEL_PAIS[representante.pais]}/6mesesgratis?a={codigo}
                        </p>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      <p className="tabular-nums">{delPais.length} en su país</p>
                      <p className="tabular-nums">{traidos} por su enlace</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {activo && (
                          <form action={reenviarCorreo}>
                            <input type="hidden" name="id" value={representante.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-accion-tinta"
                            >
                              Reenviar correo de contraseña
                            </button>
                          </form>
                        )}
                        <form action={activo ? desactivarRepresentante : reactivarRepresentante}>
                          <input type="hidden" name="id" value={representante.id} />
                          <button
                            type="submit"
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              activo
                                ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                                : "border-zinc-300 bg-white text-zinc-700 hover:border-accion-tinta"
                            }`}
                          >
                            {activo ? "Quitar acceso" : "Devolver acceso"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
