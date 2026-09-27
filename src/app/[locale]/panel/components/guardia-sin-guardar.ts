/**
 * El aviso de "tienes cambios sin guardar", compartido entre el
 * formulario y el menú.
 *
 * Las secciones de la ficha se abren desde el menú del panel, que está
 * en otro componente y no puede ver lo que hay escrito en los campos.
 * Sin esto, media descripción escrita se iba entera al pulsar otra
 * sección, sin avisar — que es la forma más rápida de que un directivo
 * con poco tiempo no vuelva a rellenar la ficha.
 *
 * El formulario deja aquí su comprobación mientras está montado, y el
 * menú pregunta antes de moverse. Si no hay formulario en pantalla, no
 * hay nada que perder y se sale sin preguntar.
 */
let guardia: (() => boolean) | null = null;

/** Lo llama el formulario: `null` al desmontarse. */
export function registrarGuardia(comprobar: (() => boolean) | null): void {
  guardia = comprobar;
}

/** Lo llama el menú antes de cambiar de sección. */
export function sePuedeSalir(): boolean {
  return guardia ? guardia() : true;
}
