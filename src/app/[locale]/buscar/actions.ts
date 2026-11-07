"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { avisarAlEquipo } from "@/lib/avisos-equipo";
import { buscarUrlDelAviso, paisDelAviso, textoDeLaZona } from "@/lib/avisos-zona";
import { deporteDeLaLista } from "@/lib/deportes";
import { enviarEmailAvisoDeZonaApuntado } from "@/lib/email/resend";
import { pareceBot } from "@/lib/honeypot";
import { avisarDeFallo } from "@/lib/monitoring";
import { consumirLimite, ipDelVisitante } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoAvisoDeZona = { ok: true } | { error: string } | null;

const IDIOMAS = new Set(["es", "pt", "en", "br"]);

/**
 * "Avísame cuando haya un club aquí", desde el buscador vacío
 * (migración 0061, pedido por Rafael el 7-11-2026). Sin cuenta: solo el
 * correo y lo que estaba buscando. Le llega un correo de confirmación
 * con el enlace de baja, y a Rafael un aviso: una empresa que pide esto
 * es una empresa que quiere patrocinar en esa zona.
 */
export async function apuntarAvisoDeZona(
  _previo: EstadoAvisoDeZona,
  formData: FormData,
): Promise<EstadoAvisoDeZona> {
  const t = await getTranslations("buscar.avisoZona");
  if (pareceBot(formData)) return { ok: true };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: t("errorEmail") };
  }

  const localePedido = await getLocale();
  const locale = IDIOMAS.has(localePedido) ? localePedido : "es";
  const provincia = String(formData.get("provincia") ?? "").trim().slice(0, 80) || null;
  const deporte = String(formData.get("deporte") ?? "").trim().slice(0, 60) || null;
  const pais = paisDelAviso(String(formData.get("pais") ?? ""), locale);

  const ip = await ipDelVisitante();
  const [cupoIp, cupoEmail] = await Promise.all([
    consumirLimite({ bucket: "aviso-zona:ip", identificador: ip, limite: 5, ventanaSegundos: 3600 }),
    consumirLimite({ bucket: "aviso-zona:email", identificador: email, limite: 5, ventanaSegundos: 86400 }),
  ]);
  if (!cupoIp || !cupoEmail) return { error: t("errorLimite") };

  const admin = createAdminClient();
  const { data: fila, error } = await admin
    .from("zone_alerts")
    .insert({ email, country: pais, province: provincia, sport: deporte, locale, active: true })
    .select("unsubscribe_token")
    .maybeSingle<{ unsubscribe_token: string }>();

  // El mismo correo para la misma zona ya estaba apuntado: se reactiva
  // por si se había dado de baja, y se le dice que ya estaba.
  let token = fila?.unsubscribe_token ?? null;
  if (error) {
    if (error.code !== "23505") {
      avisarDeFallo("empresa", "No se ha podido guardar un aviso de zona", error);
      return { error: t("errorGuardar") };
    }
    const { data: existente } = await admin
      .from("zone_alerts")
      .select("id, unsubscribe_token, email, country, province, sport")
      .eq("country", pais)
      .ilike("email", email)
      .returns<{ id: string; unsubscribe_token: string; province: string | null; sport: string | null }[]>();
    const mismo = (existente ?? []).find((una) => (una.province ?? null) === provincia && (una.sport ?? null) === deporte);
    if (mismo) {
      await admin.from("zone_alerts").update({ active: true }).eq("id", mismo.id);
      token = mismo.unsubscribe_token;
    }
  }

  const tFiltros = await getTranslations("buscar.filtros");
  const tEtiquetas = await getTranslations("common.etiquetas");
  const zona = textoDeLaZona({ province: provincia, sport: deporte }, tFiltros(`paises.${pais}` as never), (texto) => {
    const clave = deporteDeLaLista(texto)?.clave;
    return clave ? tEtiquetas(`deporte.${clave}` as never).toLowerCase() : texto;
  });

  if (token) {
    await enviarEmailAvisoDeZonaApuntado({
      email,
      zona,
      idioma: locale,
      buscarUrl: buscarUrlDelAviso({ locale, country: pais, province: provincia, sport: deporte }),
      bajaUrl: `${SITE_URL}/${locale}/avisos/baja?t=${token}`,
    }).catch(() => null);
  }

  await avisarAlEquipo({
    asunto: `🔔 Una empresa quiere clubes en ${zona}`,
    lineas: [
      `Correo: ${email}`,
      `Zona: ${zona}`,
      `País: ${pais}`,
      `Idioma de la web: ${locale}`,
      "Lo pidió desde el buscador porque no le salía ningún club. Buen sitio para buscar clubes que dar de alta.",
    ],
  });

  return { ok: true };
}
