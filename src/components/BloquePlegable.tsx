/**
 * Un apartado del formulario que empieza cerrado.
 *
 * La ficha del club era una sola pantalla con veinte campos seguidos y
 * un botón al final. En un teléfono eso son varias pantallas de bajar
 * antes de ver "Guardar", y como solo el nombre y la localidad son
 * obligatorios, el club se enfrentaba al muro entero sin saber que con
 * dos casillas ya tenía su página.
 *
 * Es un `<details>` del navegador, no un desplegable hecho a mano: se
 * abre sin JavaScript, y los campos de dentro se envían igual aunque
 * esté cerrado —siguen en la página— así que no hay forma de perder lo
 * escrito por haber cerrado un apartado antes de guardar.
 *
 * `resumen` es lo que se lee sin abrirlo. Sirve para que un apartado
 * cerrado no parezca vacío: "3 de 5 rellenados" invita a mirar, "Redes
 * sociales" a secas no dice si hay algo dentro.
 */
export function BloquePlegable({
  titulo,
  resumen,
  abierto = false,
  children,
}: {
  titulo: string;
  resumen?: string;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={abierto} className="group rounded-lg border border-zinc-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-medium text-zinc-800">{titulo}</span>
          {resumen && <span className="mt-0.5 block text-xs text-zinc-500">{resumen}</span>}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </summary>

      <div className="space-y-4 border-t border-zinc-100 px-4 py-4">{children}</div>
    </details>
  );
}

/** "Ninguno todavía" / "2 de 5 rellenados", para el resumen de arriba. */
export function cuantosRellenados(valores: (string | null | undefined)[], vacio: string): string {
  const puestos = valores.filter((valor) => !!valor?.trim()).length;
  if (puestos === 0) return vacio;
  return `${puestos} de ${valores.length} rellenados`;
}
