import type { Recomendacion } from "@/lib/recomendaciones";

/**
 * Herramientas de terceros a mano desde el panel del club.
 *
 * Distingue las que el club contrata aparte de las que ya van dentro de
 * su cuota, porque para él no se parecen en nada. Y dice sin rodeos
 * cuándo ApoyaClub cobra comisión: un club que paga una cuota tiene
 * derecho a saber si la recomendación de su proveedor es interesada.
 */
export function Recomendaciones({ recomendaciones }: { recomendaciones: Recomendacion[] }) {
  if (recomendaciones.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Herramientas que te pueden ayudar</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Son de otras empresas, no de ApoyaClub. Te las damos porque a un club de base le
        resuelven algo que nosotros no hacemos: encontrar a quién enseñarle tu dossier.
      </p>

      <ul className="mt-4 space-y-3">
        {recomendaciones.map((recomendacion) => (
          <li key={recomendacion.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-zinc-900">{recomendacion.nombre}</p>
              {recomendacion.modo === "incluida" ? (
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  Incluida en tu cuota
                </span>
              ) : (
                recomendacion.precio && (
                  <p className="text-sm text-zinc-500">{recomendacion.precio}</p>
                )
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-600">{recomendacion.queEs}</p>
            <p className="mt-2 text-sm text-zinc-700">{recomendacion.paraQue}</p>

            {recomendacion.comoSeActiva && (
              <p className="mt-2 text-sm font-medium text-teal-700">{recomendacion.comoSeActiva}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={recomendacion.url}
                target="_blank"
                rel="noreferrer nofollow"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {recomendacion.modo === "incluida" ? "Entrar en" : "Ver"} {recomendacion.nombre} ↗
              </a>
              {recomendacion.conComision && (
                <p className="text-xs text-zinc-500">
                  Si contratas desde este enlace, ApoyaClub recibe una comisión. No compartimos
                  ningún dato tuyo con ellos.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
