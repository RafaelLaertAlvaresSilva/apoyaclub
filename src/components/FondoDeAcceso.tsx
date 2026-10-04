import Image from "next/image";

/**
 * La foto del pabellón, de fondo, en las pantallas de entrar y de darse
 * de alta.
 *
 * Esas páginas eran un recuadro blanco sobre un gris plano: funcionaban,
 * pero no se parecían en nada al resto de la web, y son justo el
 * momento en que alguien decide si se queda. La foto las ata al mismo
 * sitio del que vienen.
 *
 * Tres capas encima de la foto, y cada una hace falta:
 *
 *   - Un velo blanco parejo, para que el recuadro blanco del formulario
 *     no se pierda contra el suelo claro del pabellón.
 *   - Un degradado desde arriba, porque justo ahí está la barra del
 *     logo, que es blanca: sin él se ve el corte.
 *   - Otro desde abajo, que es donde acaba la página y empieza el pie,
 *     también claro.
 *
 * El velo es moderado a propósito. La foto tiene que verse: si se
 * apaga del todo, es una foto que pesa 68 KB y no aporta nada.
 *
 * `-z-10` y no un `z` positivo: el formulario y sus campos van por
 * delante sin tener que llevar `relative` cada uno.
 */
export function FondoDeAcceso() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src="/fondo-acceso.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/45" />
      {/* Los degradados de los bordes, más cortos en el teléfono: ahí el
          recuadro del formulario ocupa casi todo el ancho y a la foto
          solo le quedan dos franjas estrechas arriba y abajo. Con los
          112 px del ordenador, esas franjas se las comían enteras y la
          foto no se veía. */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white to-transparent sm:h-28" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent sm:h-28" />
    </div>
  );
}
