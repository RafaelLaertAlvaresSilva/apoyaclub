"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { CLASES_CAMPO_ACCESO } from "@/components/CampoContrasena";
import { Button } from "@/components/ui/Button";
import { reenviarConfirmacion, type EstadoReenvio } from "./actions";

/**
 * Un minuto entre reenvíos.
 *
 * Ni el correo llega antes, ni conviene dejar que se pulse veinte
 * veces: el proveedor acabaría tratando la dirección como spam, que es
 * justo el problema que esta pantalla intenta resolver.
 */
const ESPERA_SEGUNDOS = 60;

export function ReenviarCorreo() {
  const [estado, enviar] = useActionState<EstadoReenvio, FormData>(reenviarConfirmacion, null);

  // La cuenta atrás empieza al pulsar, no al llegar la respuesta.
  //
  // Mirar el reloj mientras se dibuja la pantalla no vale: React puede
  // volver a dibujar en cualquier momento y el número saldría distinto
  // cada vez. Y arrancarla desde un efecto tampoco, porque entonces el
  // efecto está haciendo de disparador en vez de reaccionar a algo.
  // Pulsar es un evento, que es justo donde sí toca.
  //
  // El campo es de tipo correo y obligatorio, así que el navegador no
  // deja enviar una dirección mal escrita: cuando esto se ejecuta, el
  // envío va de camino.
  const [quedan, setQuedan] = useState(0);

  useEffect(() => {
    if (quedan <= 0) return;
    const reloj = setTimeout(() => setQuedan((segundos) => segundos - 1), 1000);
    return () => clearTimeout(reloj);
  }, [quedan]);

  const enviado = !!estado && "ok" in estado;

  return (
    <form
      action={enviar}
      onSubmit={() => setQuedan(ESPERA_SEGUNDOS)}
      className="space-y-3 rounded-xl border border-zinc-200 p-4 text-left"
    >
      <div>
        <label htmlFor="email-reenvio" className="block text-sm font-medium text-zinc-800">
          ¿No te ha llegado?
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          Escribe el correo con el que te registraste y te lo mandamos otra vez.
        </p>
      </div>

      <input
        id="email-reenvio"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="tuclub@correo.es"
        className={CLASES_CAMPO_ACCESO}
      />

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      {enviado && (
        <AvisoExito mensaje="Enviado. Si esa dirección tiene una cuenta sin confirmar, el correo está de camino." />
      )}

      <BotonReenviar quedan={quedan} />
    </form>
  );
}

function BotonReenviar({ quedan }: { quedan: number }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="secondary"
      disabled={pending || quedan > 0}
      className="w-full"
    >
      {pending ? "Enviando…" : quedan > 0 ? `Puedes reenviarlo en ${quedan} s` : "Reenviar el correo"}
    </Button>
  );
}
