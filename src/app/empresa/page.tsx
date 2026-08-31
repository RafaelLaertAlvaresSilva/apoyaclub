import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { companyRowToProfile, type CompanyRow } from "@/lib/company-mappers";
import { createClient } from "@/lib/supabase/server";
import { EmpresaNav } from "./components/EmpresaNav";
import { PerfilEmpresaForm } from "./components/PerfilEmpresaForm";

export default async function EmpresaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    redirect("/login");
  }

  const { data: filaEmpresa } = await supabase
    .from("companies")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<CompanyRow>();

  const perfil = filaEmpresa ? companyRowToProfile(filaEmpresa) : null;
  const nombreProvisional = (user.user_metadata?.name as string | undefined) ?? user.email;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Panel de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {perfil?.name ?? nombreProvisional}
          </h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <EmpresaNav activo="perfil" />

      <PerfilEmpresaForm perfil={perfil} />
    </div>
  );
}
