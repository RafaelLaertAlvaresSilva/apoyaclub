import type { AppLocale } from "@/i18n/routing";
import {
  AVISO_DE_ORIGEN,
  unidadEnTexto,
  type BloqueDeAlcance,
  type CifraDeAlcance,
  type OrigenDeCifra,
} from "@/lib/alcance";
import { formatearNumero } from "@/lib/format";

/**
 * La maqueta del informe de alcance, compartida por la página del panel
 * y por la vista previa.
 *
 * Los tres bloques van separados a propósito y con un color distinto
 * cada uno. Es lo que impide que alguien lea las cifras de corrido y
 * las sume mentalmente: son cosas de naturaleza distinta y tienen que
 * parecerlo.
 */

const ESTILO_BLOQUE: Record<OrigenDeCifra, { borde: string; fondo: string; etiqueta: string; texto: string }> = {
  contado: {
    borde: "border-teal-200",
    fondo: "bg-teal-50",
    etiqueta: "bg-teal-700 text-white",
    texto: "text-teal-900",
  },
  declarado: {
    borde: "border-zinc-200",
    fondo: "bg-white",
    etiqueta: "bg-zinc-200 text-zinc-700",
    texto: "text-zinc-900",
  },
  deducido: {
    borde: "border-amber-200",
    fondo: "bg-amber-50",
    etiqueta: "bg-amber-600 text-white",
    texto: "text-amber-900",
  },
};

const NOMBRE_ORIGEN: Record<OrigenDeCifra, string> = {
  contado: "Contado",
  declarado: "Declarado",
  deducido: "Deducido",
};

export function Cifra({
  cifra,
  locale,
  grande = false,
}: {
  cifra: CifraDeAlcance;
  locale: AppLocale;
  grande?: boolean;
}) {
  const estilo = ESTILO_BLOQUE[cifra.origen];

  return (
    <div className={`rounded-xl border ${estilo.borde} bg-white p-4`}>
      <p className={`${grande ? "text-4xl" : "text-2xl"} font-semibold ${estilo.texto}`}>
        {formatearNumero(cifra.valor, locale)}{" "}
        <span className="text-sm font-normal text-zinc-500">
          {unidadEnTexto(cifra.unidad, cifra.valor)}
        </span>
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-800">{cifra.etiqueta}</p>
      <p className="mt-1 text-xs text-zinc-500">{cifra.procedencia}</p>
      {cifra.cuenta && (
        <p className="mt-2 rounded-lg bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600">{cifra.cuenta}</p>
      )}
    </div>
  );
}

export function Bloque({ bloque, locale }: { bloque: BloqueDeAlcance; locale: AppLocale }) {
  const estilo = ESTILO_BLOQUE[bloque.id];

  return (
    <section className={`rounded-2xl border ${estilo.borde} ${estilo.fondo} p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilo.etiqueta}`}>
          {NOMBRE_ORIGEN[bloque.id]}
        </span>
        <h2 className="text-lg font-semibold text-zinc-900">{bloque.titulo}</h2>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-zinc-600">{bloque.explicacion}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bloque.cifras.map((cifra) => (
          <Cifra key={cifra.id} cifra={cifra} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export function AvisoDeOrigen() {
  return <p className="text-xs text-zinc-500">{AVISO_DE_ORIGEN}</p>;
}
