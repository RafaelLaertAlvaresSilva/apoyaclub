import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { createClient } from "@/lib/supabase/server";
import { EmpresaNav } from "../components/EmpresaNav";
import { FichaForm } from "./FichaForm";

export const metadata: Metadata = { title: "Mi ficha" };

type FilaEmpresa = {
  name: string | null;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  description: string | null;
  open_to_sponsor: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_public_consent: boolean;
  alerts_enabled: boolean;
  logo_url: string | null;
};

export default async function FichaEmpresaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const { data: empresa } = await supabase
    .from("companies")
    .select(
      "name, sector, city, province, website, description, open_to_sponsor, contact_name, contact_email, contact_phone, contact_public_consent, alerts_enabled, logo_url",
    )
    .eq("id", user.id)
    .maybeSingle<FilaEmpresa>();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Mi ficha</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <EmpresaNav activo="ficha" />

      <FichaForm
        userId={user.id}
        datos={{
          nombre: empresa?.name ?? "",
          sector: empresa?.sector ?? "",
          localidad: empresa?.city ?? "",
          provincia: empresa?.province ?? "",
          web: empresa?.website ?? "",
          descripcion: empresa?.description ?? "",
          enElDirectorio: empresa?.open_to_sponsor ?? false,
          quiereAvisos: empresa?.alerts_enabled ?? true,
          logoUrl: empresa?.logo_url ?? null,
          contacto: {
            nombre: empresa?.contact_name ?? null,
            email: empresa?.contact_email ?? null,
            telefono: empresa?.contact_phone ?? null,
            publico: empresa?.contact_public_consent ?? true,
          },
        }}
      />
    </div>
  );
}
