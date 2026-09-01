"use server";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  return redirect({ href: "/login", locale });
}
