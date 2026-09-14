"use client";

import { useState } from "react";

/**
 * Un campo de contraseña que se puede leer.
 *
 * En el móvil se escriben ocho caracteres a ciegas, y al registrarse hay
 * que hacerlo dos veces seguidas. Es la causa más repetida del "el
 * correo o la contraseña no son correctos" y de "las contraseñas no
 * coinciden": no es que la gente no sepa su contraseña, es que no ve lo
 * que está tecleando.
 *
 * El botón dice "Mostrar" / "Ocultar" con palabras y no con un ojo
 * dibujado: el ojo tachado lo entiende medio mundo al revés.
 *
 * La letra es de 16 px (`text-base`) a propósito, aquí y en el resto de
 * campos de estas pantallas. Por debajo de eso, el iPhone amplía la
 * página sola al tocar el campo y la deja descuadrada, así que había que
 * recolocarla a mano campo por campo mientras te registras.
 */

export const CLASES_CAMPO_ACCESO =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark";

export function CampoContrasena({
  id,
  name,
  etiqueta,
  autoComplete,
  minLength,
  requerido = true,
  ayuda,
  children,
}: {
  id: string;
  name: string;
  etiqueta: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  requerido?: boolean;
  ayuda?: string;
  /** Lo que va debajo del campo: el enlace de contraseña olvidada. */
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700">
        {etiqueta}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={requerido}
          minLength={minLength}
          autoComplete={autoComplete}
          className={`${CLASES_CAMPO_ACCESO} pr-20`}
        />
        <button
          type="button"
          onClick={() => setVisible((puesto) => !puesto)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-sm font-medium text-teal-700 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-dark"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {ayuda && <p className="mt-1 text-xs text-zinc-500">{ayuda}</p>}
      {children}
    </div>
  );
}
