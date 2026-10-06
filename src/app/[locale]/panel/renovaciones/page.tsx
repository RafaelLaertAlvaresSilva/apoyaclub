import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { clubSponsorRowToSponsor, type ClubSponsorRow } from "@/lib/club-mappers";
import { contarRenovacionesQueAvisan, ordenarPorRenovacion, temporadaDe } from "@/lib/renovaciones";
import { createClient } from "@/lib/supabase/server";
import { ListaDeRenovaciones } from "./components/ListaDeRenovaciones";

/**
 * Renovaciones: cuándo acaba cada patrocinio y qué escribir.
 *
 * El patrocinio del deporte base casi nunca se pierde porque la empresa
 * diga que no. Se pierde porque nadie volvió a preguntar: la temporada
 * acaba, llega el verano, y en septiembre ya hay otro club en la
 * camiseta. Esta sección existe para que eso no dependa de que alguien
 * se acuerde.
 *
 * Tres cosas, y las tres estaban sueltas:
 *
 *   - CUÁNDO. Dos fechas por patrocinador: cuándo acaba el acuerdo y
 *     cuándo hay que escribir, que es antes.
 *   - QUÉ SE ACORDÓ. Lo que hoy vive en la cabeza del que lo firmó y
 *     desaparece cuando cambia la junta.
 *   - QUÉ ESCRIBIR. El club que no sabe cómo empezar acaba mandando
 *     "¿seguís interesados?", que invita a contestar que no.
 *
 * Las fechas se piden a la base de datos sin filtrar por ellas: se
 * ordena y se cuenta en memoria. Es a propósito. Las columnas vienen de
 * la migración 0050 y, hasta que un club la aplique, no existen: un
 * `where renewal_date` dejaría la página en blanco en vez de
 * enseñarla vacía y pedir las fechas.
 */
export default async function RenovacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [{ data: filaClub }, { data: filasPatrocinadores }] = await Promise.all([
    supabase.from("clubs").select("id, name").eq("id", user.id).maybeSingle<{
      id: string;
      name: string;
    }>(),
    supabase
      .from("club_sponsors")
      .select("*")
      .eq("club_id", user.id)
      .returns<ClubSponsorRow[]>(),
  ]);

  const hoy = new Date();
  const patrocinadores = ordenarPorRenovacion(
    (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
    hoy,
  );
  const avisan = contarRenovacionesQueAvisan(patrocinadores, hoy);

  // El día de hoy se calcula aquí y viaja como texto: el componente de
  // cliente no puede hacer su propio `new Date()` sin arriesgarse a
  // pintar un número distinto del que pintó el servidor.
  const hoyISO = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Panel del club</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Renovaciones</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Hasta cuándo dura cada patrocinio y cuándo toca hablarlo. Casi ningún patrocinador se
          pierde porque diga que no: se pierde porque nadie volvió a preguntar a tiempo.
        </p>
      </div>

      {avisan > 0 && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Tienes <strong>{avisan}</strong>{" "}
          {avisan === 1 ? "renovación que necesita" : "renovaciones que necesitan"} que escribas
          ya.
        </p>
      )}

      {!filaClub ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad de tu club en{" "}
          <Link href="/panel/perfil" className="font-medium text-teal-700 hover:underline">
            tu perfil
          </Link>
          .
        </div>
      ) : patrocinadores.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Todavía no has añadido ningún patrocinador. Añádelos en{" "}
          <Link href="/panel/patrocinadores" className="font-medium text-teal-700 hover:underline">
            Patrocinadores
          </Link>{" "}
          y aquí podrás llevar el control de sus renovaciones.
        </div>
      ) : (
        <ListaDeRenovaciones
          patrocinadores={patrocinadores}
          nombreDelClub={filaClub.name}
          temporada={temporadaDe(hoy)}
          hoyISO={hoyISO}
        />
      )}
    </div>
  );
}
