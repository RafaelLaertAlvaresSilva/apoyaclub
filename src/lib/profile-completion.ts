import type { ClubProfile, ClubSponsor, ClubTeam } from "@/lib/types";

/**
 * Calcula el porcentaje de perfil completado que se muestra en el panel
 * del club, para animar a rellenar más secciones.
 *
 * El nombre y la localidad son obligatorios (siempre están rellenos si
 * existe la fila del club), así que no puntúan; el resto de campos de
 * cada sección suman puntos. El resultado es la media del progreso de
 * las 8 secciones, para que ninguna sección pese más que las demás.
 */
export function calcularPorcentajeCompletado(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  patrocinadores: ClubSponsor[],
): number {
  if (!perfil) return 0;

  const secciones = [
    // 1. Identidad
    puntuar(
      [
        !!perfil.logoUrl,
        perfil.photoUrls.length > 0,
        !!perfil.videoUrl,
        !!perfil.description,
        !!perfil.website,
        Object.values(perfil.socialLinks).some(Boolean),
      ],
    ),
    // 2. Nivel deportivo
    puntuar([!!perfil.topCategory, !!perfil.competitions, !!perfil.achievements]),
    // 3. Equipos
    puntuar([equipos.length > 0]),
    // 4. Cantera
    puntuar([
      perfil.youthTeamsCount != null,
      perfil.youthPlayersCount != null,
      perfil.youthFamiliesCount != null,
    ]),
    // 5. Historia
    puntuar([perfil.foundingYear != null, perfil.milestones.length > 0]),
    // 6. Audiencia
    puntuar([
      Object.values(perfil.followersByNetwork).some((valor) => valor != null),
      perfil.estimatedReach != null,
      perfil.averageAttendance != null,
    ]),
    // 7. Comunidad
    puntuar([perfil.communityActions.length > 0]),
    // 8. Patrocinadores
    puntuar([patrocinadores.length > 0]),
  ];

  const media = secciones.reduce((suma, valor) => suma + valor, 0) / secciones.length;
  return Math.round(media);
}

/** Porcentaje (0-100) de condiciones cumplidas dentro de una sección. */
function puntuar(condiciones: boolean[]): number {
  if (condiciones.length === 0) return 100;
  const cumplidas = condiciones.filter(Boolean).length;
  return (cumplidas / condiciones.length) * 100;
}
