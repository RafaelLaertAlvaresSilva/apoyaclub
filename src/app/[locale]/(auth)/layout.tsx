import { BarraLogo } from "@/components/BarraLogo";
import { FondoDeAcceso } from "@/components/FondoDeAcceso";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BarraLogo />
      <div className="relative isolate flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
        <FondoDeAcceso />

        <div className="w-full max-w-md space-y-6">
          {/* La sombra sube de `shadow-sm` a `shadow-xl`: sobre el gris
              plano de antes bastaba una línea, pero encima de una foto
              el recuadro necesita despegarse para que se lea. */}
          <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-zinc-200">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
