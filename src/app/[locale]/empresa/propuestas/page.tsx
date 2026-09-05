import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerPropuestasDeEmpresa } from "@/lib/propuestas";
import { createClient } from "@/lib/supabase/server";
import { EmpresaNav } from "../components/EmpresaNav";
import { ListaPropuestas } from "./components/ListaPropuestas";

/**
 * Las propuestas que los clubes le mandan a la empresa desde el
 * directorio (migración 0033). Es la razón por la que a una empresa le
 * compensa apuntarse: deja de buscar y empieza a recibir.
 */
export default async function PropuestasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const propuestas = await obtenerPropuestasDeEmpresa(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Clubes que te han escrito</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <EmpresaNav activo="propuestas" />

      <ListaPropuestas propuestas={propuestas} />
    </div>
  );
}
