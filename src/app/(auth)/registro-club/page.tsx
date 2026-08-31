"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { registrarClub } from "./actions";

export default function RegistroClubPage() {
  const [estado, formAction] = useActionState(registrarClub, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          Registra tu club
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          El primer mes es gratis. Después, 29,90 €/mes con IVA incluido.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-zinc-700">
            Nombre del club
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="organization"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-zinc-400">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label htmlFor="confirmarPassword" className="mb-1 block text-sm font-medium text-zinc-700">
            Confirma la contraseña
          </label>
          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            name="aceptaTerminos"
            required
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            He leído y acepto las{" "}
            <Link href="/condiciones-de-uso" target="_blank" className="font-medium text-emerald-700 hover:underline">
              Condiciones de Uso
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="font-medium text-emerald-700 hover:underline">
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>Crear cuenta de club</BotonEnviar>
      </form>

      <div className="space-y-2 text-center text-sm text-zinc-500">
        <p>
          ¿Eres una empresa?{" "}
          <Link href="/registro-empresa" className="font-medium text-emerald-700 hover:underline">
            Regístrate aquí
          </Link>
        </p>
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
