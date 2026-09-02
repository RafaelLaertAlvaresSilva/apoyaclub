/**
 * Geocodificación de direcciones aproximadas (ciudad, provincia, código
 * postal) a coordenadas, y utilidades de distancia. Fase 7 (buscador),
 * usado en dos sitios:
 *   - Al guardar la Identidad del club (`app/panel/actions.ts`), para
 *     rellenar `clubs.latitude`/`clubs.longitude`.
 *   - Al buscar por "cerca de..." en `/buscar` (`lib/search.ts`), para
 *     convertir el texto que escribe la empresa en un punto desde el
 *     que medir el radio.
 *
 * Usa el geocodificador gratuito de OpenStreetMap (Nominatim): no hace
 * falta ninguna clave de API ni coste. Su política de uso pide como
 * mucho 1 petición por segundo y un User-Agent identificable
 * (https://operations.osmfoundation.org/policies/nominatim/).
 *
 * Para no acercarse a ese límite (una búsqueda pública con radio la
 * dispara cualquier visitante, sin sesión), Fase 15 añade dos cosas:
 *
 * 1. Caché en base de datos (`geocode_cache`, migración 0010): la misma
 *    ciudad solo se pregunta una vez. Se guardan también los fallos,
 *    para no reintentar en bucle una dirección que no existe.
 * 2. Un tope global de llamadas reales a Nominatim por minuto
 *    (`consume_rate_limit`). Si se supera, la petición se resuelve sin
 *    coordenadas: la búsqueda sigue funcionando, solo se queda sin
 *    filtro de radio, que es mucho mejor que quedarse sin geocodificador
 *    porque nos hayan bloqueado la IP.
 */

import { consumirLimite } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type Coordenadas = {
  latitude: number;
  longitude: number;
};

/** Días que se da por buena una entrada de la caché antes de volver a preguntar. */
const DIAS_VALIDEZ_CACHE = 180;

/** Llamadas reales a Nominatim permitidas por minuto en toda la aplicación. */
const LLAMADAS_POR_MINUTO = 30;

function normalizar(texto: string): string {
  return texto.toLowerCase().replace(/\s+/g, " ").trim();
}

async function leerDeCache(
  clave: string,
): Promise<{ encontrado: boolean; coordenadas: Coordenadas | null } | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("geocode_cache")
      .select("latitude, longitude, found, created_at")
      .eq("query", clave)
      .maybeSingle();

    if (error || !data) return null;

    const caducada =
      Date.now() - new Date(data.created_at as string).getTime() >
      DIAS_VALIDEZ_CACHE * 24 * 60 * 60 * 1000;
    if (caducada) return null;

    if (!data.found || data.latitude == null || data.longitude == null) {
      return { encontrado: false, coordenadas: null };
    }

    return {
      encontrado: true,
      coordenadas: { latitude: data.latitude as number, longitude: data.longitude as number },
    };
  } catch {
    return null;
  }
}

async function guardarEnCache(clave: string, coordenadas: Coordenadas | null): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("geocode_cache").upsert(
      {
        query: clave,
        latitude: coordenadas?.latitude ?? null,
        longitude: coordenadas?.longitude ?? null,
        found: coordenadas !== null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "query" },
    );
  } catch {
    // La caché es una optimización: si no se puede escribir, se sigue.
  }
}

export async function geocodificarDireccion(partes: {
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}): Promise<Coordenadas | null> {
  const texto = [partes.postalCode, partes.city, partes.province]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => !!parte)
    .join(", ");

  if (!texto) return null;

  const clave = normalizar(texto);

  const enCache = await leerDeCache(clave);
  if (enCache) return enCache.coordenadas;

  const hayCupo = await consumirLimite({
    bucket: "geocode:nominatim",
    identificador: "global",
    limite: LLAMADAS_POR_MINUTO,
    ventanaSegundos: 60,
  });

  if (!hayCupo) {
    console.warn("[geocoding] Tope de llamadas a Nominatim alcanzado; se resuelve sin coordenadas.");
    return null;
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", texto);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "es");

    const respuesta = await fetch(url, {
      headers: {
        // Nominatim exige un User-Agent identificable con la app.
        "User-Agent": "ApoyaClub/1.0 (https://apoyaclub.vercel.app)",
        "Accept-Language": "es",
      },
      // Cada dirección es distinta, así que no tiene sentido cachear
      // esta petición a nivel de fetch de Next.js.
      cache: "no-store",
    });

    if (!respuesta.ok) return null;

    const resultados = (await respuesta.json()) as { lat: string; lon: string }[];
    const primero = resultados[0];
    if (!primero) {
      // Dirección que Nominatim no reconoce: se cachea el fallo para no
      // volver a preguntar por ella en cada búsqueda.
      await guardarEnCache(clave, null);
      return null;
    }

    const latitude = Number.parseFloat(primero.lat);
    const longitude = Number.parseFloat(primero.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    const coordenadas = { latitude, longitude };
    await guardarEnCache(clave, coordenadas);
    return coordenadas;
  } catch {
    // Si Nominatim falla, está caído o no responde a tiempo, no
    // bloqueamos ni la búsqueda ni el guardado del club: simplemente se
    // sigue sin coordenadas para esa petición.
    return null;
  }
}

const RADIO_TIERRA_KM = 6371;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Distancia entre dos puntos, en kilómetros (fórmula de Haversine). */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRadianes(b.latitude - a.latitude);
  const dLon = aRadianes(b.longitude - a.longitude);
  const lat1 = aRadianes(a.latitude);
  const lat2 = aRadianes(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Caja delimitadora (bounding box) alrededor de un centro, para poder
 * prefiltrar en SQL con columnas normales (`latitude between ... and
 * ...`) antes de calcular la distancia exacta en el servidor de Next.js.
 * Un poco más ancha de lo estrictamente necesario (usa un cuadrado en
 * vez del círculo real), así que el filtro exacto por radio se aplica
 * siempre después, con `distanciaKm`.
 */
export function cajaDelimitadora(centro: Coordenadas, radioKm: number) {
  const GRADOS_LAT_POR_KM = 1 / 111; // ~111 km por grado de latitud, constante en cualquier punto.
  const deltaLat = radioKm * GRADOS_LAT_POR_KM;

  const kmPorGradoLongitud = 111 * Math.cos(aRadianes(centro.latitude));
  const deltaLon = kmPorGradoLongitud > 0.0001 ? radioKm / kmPorGradoLongitud : 180;

  return {
    minLat: centro.latitude - deltaLat,
    maxLat: centro.latitude + deltaLat,
    minLon: centro.longitude - deltaLon,
    maxLon: centro.longitude + deltaLon,
  };
}
