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
 * (https://operations.osmfoundation.org/policies/nominatim/). Aquí solo
 * se llama de una en una, disparada por una acción humana (guardar el
 * formulario, lanzar una búsqueda), nunca en bucle, así que no hace
 * falta ninguna cola ni límite adicional.
 */

export type Coordenadas = {
  latitude: number;
  longitude: number;
};

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
    if (!primero) return null;

    const latitude = Number.parseFloat(primero.lat);
    const longitude = Number.parseFloat(primero.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
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
