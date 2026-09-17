import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { Link, redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { calcularAlcance } from "@/lib/alcance";
import { reunirDatosDeAlcance } from "@/lib/alcance-datos";
import { formatearNumero } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { AvisoDeOrigen, Bloque, Cifra } from "./components/BloquesDeAlcance";

/**
 * El informe de alcance del club.
 *
 * Un club de barrio sabe que llega a mucha gente y no sabe decirlo. Lo
 * que hace casi todo el mundo es sumar: 120 jugadores + 150 familias +
 * 800 seguidores = "llegamos a 1.070 personas". El padre que está en el
 * partido es una de esas 150 familias y además sigue al club en
 * Instagram: se le ha contado tres veces, y la primera empresa que lo
 * note deja de creerse también lo que sí era cierto.
 *
 * Así que aquí no se suma nada. Cada cifra sale marcada con de dónde
 * viene, y la única cuenta que se hace va escrita entera debajo.
 *
 * Esta página es para el club. Las mismas cifras, calculadas por el
 * mismo sitio (`lib/alcance.ts`), son las que salen en la sección de
 * audiencia del dossier que verá la empresa.
 */
export default async function AlcancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = (await getLocale()) as AppLocale;
  if (!user) return redirect({ href: "/login", locale });

  const datos = await reunirDatosDeAlcance(supabase, user.id);
  const informe = calcularAlcance(datos);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Alcance del club</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            A cuánta gente llegas, dicho de forma que aguante una pregunta. Aquí no se suman las
            cifras entre sí: la misma persona puede ser socio, padre de un jugador y seguidor en
            redes, y sumarla tres veces se nota enseguida.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="alcance" />

      {informe.titular && (
        <section className="rounded-2xl border border-teal-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-700">
            Si tuvieras que decir una sola cifra, esta
          </p>
          <div className="mt-3 max-w-md">
            <Cifra cifra={informe.titular} locale={locale} grande />
          </div>
        </section>
      )}

      {informe.comparacion && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Comparado con la temporada pasada</h2>
          <p className="mt-2 text-sm text-zinc-700">
            De {formatearNumero(informe.comparacion.mediaAnterior, locale)} personas de media en la{" "}
            {informe.comparacion.temporadaAnterior} a{" "}
            {formatearNumero(informe.comparacion.mediaActual, locale)} en la{" "}
            {informe.comparacion.temporadaActual}:{" "}
            <strong
              className={informe.comparacion.diferencia >= 0 ? "text-teal-700" : "text-zinc-900"}
            >
              {informe.comparacion.diferencia >= 0 ? "+" : "−"}
              {formatearNumero(Math.abs(informe.comparacion.diferencia), locale)} personas (
              {informe.comparacion.diferencia >= 0 ? "+" : "−"}
              {Math.abs(informe.comparacion.porcentaje)} %)
            </strong>
            .
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Esto es lo que hace que un patrocinador renueve: no que el club le caiga bien, sino
            enseñarle que este año hay más gente que el pasado.
          </p>
        </section>
      )}

      {informe.bloques.map((bloque) => (
        <Bloque key={bloque.id} bloque={bloque} locale={locale} />
      ))}

      {informe.hayCifras && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <AvisoDeOrigen />
          <p className="mt-2 text-sm text-zinc-600">
            Estas mismas cifras son las que salen en la sección de audiencia de tu{" "}
            <Link href="/panel/dossier" className="font-medium text-teal-700 underline">
              dossier
            </Link>
            . Se calculan en un solo sitio, así que los dos documentos no pueden decir cosas
            distintas.
          </p>
        </div>
      )}

      {informe.faltan.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {informe.hayCifras ? "Lo que te falta, y para qué sirve" : "Por dónde empezar"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            {informe.hayCifras
              ? "Nada de esto es obligatorio. Cada cosa que rellenes es una pregunta menos que te va a hacer la empresa."
              : "Tu ficha todavía no tiene con qué calcular nada. Esto es lo que más cambia el informe, por orden."}
          </p>

          <ul className="mt-4 space-y-3">
            {informe.faltan.map((falta) => (
              <li
                key={falta.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{falta.que}</p>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-600">{falta.porQue}</p>
                </div>
                <Link
                  href={falta.ruta}
                  className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-teal-800"
                >
                  {falta.rutaEtiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
