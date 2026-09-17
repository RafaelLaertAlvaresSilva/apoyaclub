import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import {
  ETIQUETA_MOTIVO,
  ORDEN_MOTIVOS,
  obtenerInformeDeBajas,
  type ClubQueSeVa,
  type MotivoDeSalida,
} from "@/lib/admin-bajas";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../components/AdminNav";

export const dynamic = "force-dynamic";

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function fecha(iso: string | null): string {
  if (!iso) return "—";
  const momento = new Date(iso);
  return Number.isFinite(momento.getTime()) ? formatoFecha.format(momento) : "—";
}

/** Color por urgencia: el que ha dejado de pagar todavía se recupera. */
const COLOR_MOTIVO: Record<MotivoDeSalida, string> = {
  dejo_de_pagar: "bg-red-100 text-red-800",
  prueba_caducada: "bg-amber-100 text-amber-900",
  suscripcion_cancelada: "bg-zinc-200 text-zinc-700",
  suspendido: "bg-zinc-200 text-zinc-700",
  cuenta_borrada: "bg-zinc-100 text-zinc-500",
};

/**
 * Quién se va, y por dónde (migración 0045).
 *
 * El panel de Finanzas cuenta lo que entra; este cuenta lo que se
 * escapa. Los dos primeros grupos —el que ha dejado de pagar y el que
 * se quedó en la prueba— son los únicos que todavía se pueden
 * recuperar con una llamada, así que van delante.
 */
export default async function BajasPage() {
  const t = await getTranslations("admin.panel");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; segunda capa por si se renderiza en
  // otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const informe = await obtenerInformeDeBajas();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Bajas y pagos caídos</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Clubes que se han ido o están a punto. Los dos primeros grupos todavía se recuperan con
            una llamada.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="bajas" />

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ORDEN_MOTIVOS.map((motivo) => (
            <div
              key={motivo}
              className={`rounded-xl border bg-white p-4 ${
                informe.porMotivo[motivo] > 0 && (motivo === "dejo_de_pagar" || motivo === "prueba_caducada")
                  ? "border-red-200"
                  : "border-zinc-200"
              }`}
            >
              <p className="text-2xl font-semibold text-zinc-900">{informe.porMotivo[motivo]}</p>
              <p className="mt-1 text-xs text-zinc-500">{ETIQUETA_MOTIVO[motivo]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          De todos ellos, {informe.seFueronPagando}{" "}
          {informe.seFueronPagando === 1 ? "llegó" : "llegaron"} a pagar alguna vez. Un club que se
          va sin haber pagado nunca dice algo distinto de uno que pagó y dejó de hacerlo.
        </p>
      </section>

      <section>
        {informe.clubes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="font-medium text-zinc-900">Ningún club se está yendo.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Ni bajas, ni cobros fallando, ni pruebas caducadas sin pagar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Club</th>
                  <th className="px-4 py-3 font-medium">Qué le pasa</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Alta</th>
                  <th className="px-4 py-3 font-medium">Baja</th>
                  <th className="px-4 py-3 font-medium">Duró</th>
                  <th className="px-4 py-3 font-medium">¿Pagó?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {informe.clubes.map((club) => (
                  <FilaBaja key={`${club.motivo}-${club.clubId ?? club.nombre}-${club.baja ?? ""}`} club={club} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-500">
        De los clubes que se borran la cuenta solo se conserva el nombre de la entidad, dónde
        estaba, el plan y las fechas. Ni correo, ni teléfono, ni persona de contacto: eso se va con
        la cuenta.
      </p>
    </div>
  );
}

function FilaBaja({ club }: { club: ClubQueSeVa }) {
  return (
    <tr>
      <td className="px-4 py-3">
        {/* La cuenta borrada ya no tiene ficha que abrir. */}
        {club.slug ? (
          <Link href={`/club/${club.slug}`} className="font-medium text-brand-teal-dark hover:underline">
            {club.nombre}
          </Link>
        ) : (
          <span className="font-medium text-zinc-900">{club.nombre}</span>
        )}
        <p className="text-xs text-zinc-500">
          {[club.localidad, club.provincia].filter(Boolean).join(", ") || "—"}
        </p>
        {club.motivoEscrito && (
          <p className="mt-1 max-w-xs text-xs italic text-zinc-600">«{club.motivoEscrito}»</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_MOTIVO[club.motivo]}`}
        >
          {ETIQUETA_MOTIVO[club.motivo]}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-700">{club.nombrePlan ?? "—"}</td>
      <td className="px-4 py-3 text-zinc-600">{fecha(club.alta)}</td>
      <td className="px-4 py-3 text-zinc-600">{fecha(club.baja)}</td>
      <td className="px-4 py-3 text-zinc-600">
        {club.duracionEnDias == null ? "—" : `${club.duracionEnDias} días`}
      </td>
      <td className="px-4 py-3">
        {club.llegoAPagar ? (
          <span className="text-zinc-900">Sí</span>
        ) : (
          <span className="text-zinc-400">No</span>
        )}
      </td>
    </tr>
  );
}
