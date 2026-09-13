"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Resultado = { error: string; ok?: false } | { ok: true } | null;

/**
 * Borrar algo en dos toques, y enterarse si no se pudo.
 *
 * Antes esto era un botón rojo suelto pegado a "Editar" y a las flechas
 * de ordenar. Un toque y el patrocinador desaparecía: sin preguntar,
 * sin poder deshacer y, en un teléfono, a un dedo de distancia del
 * botón de al lado. La única pantalla de toda la web que sí preguntaba
 * era la de borrar la cuenta.
 *
 * Se pregunta aquí mismo y no con la ventanita del navegador: esa
 * ventana bloquea la página entera, sale con el aspecto que le da cada
 * teléfono y no puede decir el nombre de lo que se va a borrar con las
 * palabras del club.
 *
 * Y si el borrado falla —casi siempre porque la sesión ha caducado—, se
 * dice. Estas acciones fallaban en silencio: el club pulsaba, no pasaba
 * nada, y concluía que la web estaba rota. El motivo real tiene
 * solución en diez segundos si alguien lo cuenta.
 */
export function BorrarConConfirmacion({
  accion,
  id,
  nombre,
  etiqueta = "Eliminar",
  clases = "rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50",
}: {
  /** La Server Action que borra. Recibe el `id` en el FormData. */
  accion: (formData: FormData) => Promise<Resultado>;
  id: string;
  /** Lo que se va a borrar, con las palabras del club: "Ferretería Ramírez". */
  nombre: string;
  etiqueta?: string;
  clases?: string;
}) {
  const [preguntando, setPreguntando] = useState(false);
  const [estado, enviar] = useActionState<Resultado, FormData>(
    async (_previo, formData) => accion(formData),
    null,
  );
  const botonNo = useRef<HTMLButtonElement>(null);

  // Al abrir la pregunta, el foco va a "No". Quien llegó aquí de un
  // resbalón tiene la salida debajo del dedo, no el botón de borrar.
  useEffect(() => {
    if (preguntando) botonNo.current?.focus();
  }, [preguntando]);

  const fallo = estado && "error" in estado ? estado.error : null;

  if (!preguntando) {
    return (
      <div>
        <button type="button" onClick={() => setPreguntando(true)} className={clases}>
          {etiqueta}
        </button>
        {fallo && (
          <p role="alert" className="mt-1 max-w-56 text-xs text-red-700">
            {fallo}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={enviar}
      onSubmit={() => setPreguntando(false)}
      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5"
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-xs text-red-900">
        ¿Borrar <strong className="font-semibold">{nombre}</strong>?
      </p>
      <div className="mt-1 flex items-center gap-1">
        <BotonSi />
        <button
          ref={botonNo}
          type="button"
          onClick={() => setPreguntando(false)}
          className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-white"
        >
          No
        </button>
      </div>
    </form>
  );
}

function BotonSi() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Borrando…" : "Sí, borrar"}
    </button>
  );
}
