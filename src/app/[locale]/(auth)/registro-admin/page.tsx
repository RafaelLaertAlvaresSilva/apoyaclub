"use client";

import { Link } from "@/i18n/navigation";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { registrarAdmin } from "./actions";

/**
 * Sin enlace público hacia esta página (Fase 12): solo quien conozca la
 * URL y la clave de `ADMIN_SIGNUP_KEY` puede llegar a crear una cuenta
 * de administrador.
 */
export default function RegistroAdminPage() {
  const [estado, formAction] = useActionState(registrarAdmin, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Nueva cuenta de administrador</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Solo para el equipo de ApoyaClub. Necesitas la clave de administrador.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-zinc-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="claveAdmin" className="mb-1 block text-sm font-medium text-zinc-700">
            Clave de administrador
          </label>
          <input
            id="claveAdmin"
            name="claveAdmin"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>Crear cuenta de administrador</BotonEnviar>
      </form>

      <div className="text-center text-sm text-zinc-500">
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
