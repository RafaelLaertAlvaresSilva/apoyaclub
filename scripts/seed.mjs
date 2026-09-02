/**
 * Datos de prueba para el buscador (Fase 15).
 *
 * El criterio de "hecho" de la Fase 7 era: "con 10 clubes de prueba, una
 * búsqueda tipo balonmano, 50 km de Valencia, hasta 500 € devuelve
 * resultados coherentes". Sin datos no había forma de comprobarlo, así
 * que esto crea 15 clubes repartidos por España, sus equipos y unas 40
 * oportunidades de valores distintos.
 *
 * Uso:
 *   node scripts/seed.mjs           crea los datos
 *   node scripts/seed.mjs --limpiar borra solo lo que creó este script
 *
 * Seguridad: se niega a ejecutarse contra producción. Necesita
 * SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local, y
 * marca todos los clubes con el sufijo de email @seed.apoyaclub.test
 * para poder distinguirlos y borrarlos después.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUFIJO_SEED = "@seed.apoyaclub.test";

function cargarEnv() {
  try {
    const contenido = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const linea of contenido.split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const separador = limpia.indexOf("=");
      if (separador === -1) continue;
      const clave = limpia.slice(0, separador).trim();
      const valor = limpia.slice(separador + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[clave]) process.env[clave] = valor;
    }
  } catch {
    // Sin .env.local se usan las variables que ya haya en el entorno.
  }
}

cargarEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  console.error("Este script no se ejecuta contra producción.");
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { autoRefreshToken: false, persistSession: false } });

const CLUBES = [
  { nombre: "Balonmano Marítimo", ciudad: "Valencia", provincia: "Valencia", cp: "46011", deporte: "Balonmano" },
  { nombre: "Handbol Túria", ciudad: "Paterna", provincia: "Valencia", cp: "46980", deporte: "Balonmano" },
  { nombre: "Club Balonmano Sagunt", ciudad: "Sagunto", provincia: "Valencia", cp: "46500", deporte: "Balonmano" },
  { nombre: "Balonmano Ribera", ciudad: "Alzira", provincia: "Valencia", cp: "46600", deporte: "Balonmano" },
  { nombre: "Rugby Club Albufera", ciudad: "Valencia", provincia: "Valencia", cp: "46023", deporte: "Rugby" },
  { nombre: "Rugby Castelló", ciudad: "Castellón de la Plana", provincia: "Castellón", cp: "12004", deporte: "Rugby" },
  { nombre: "Club Rugby Alacant", ciudad: "Alicante", provincia: "Alicante", cp: "03005", deporte: "Rugby" },
  { nombre: "Balonmano Zaragoza Norte", ciudad: "Zaragoza", provincia: "Zaragoza", cp: "50018", deporte: "Balonmano" },
  { nombre: "Club Deportivo Chamartín", ciudad: "Madrid", provincia: "Madrid", cp: "28036", deporte: "Baloncesto" },
  { nombre: "Fútbol Sala Vallecas", ciudad: "Madrid", provincia: "Madrid", cp: "28038", deporte: "Fútbol sala" },
  { nombre: "Club Voleibol Gràcia", ciudad: "Barcelona", provincia: "Barcelona", cp: "08012", deporte: "Voleibol" },
  { nombre: "Handbol Besòs", ciudad: "Badalona", provincia: "Barcelona", cp: "08911", deporte: "Balonmano" },
  { nombre: "Club Balonmano Triana", ciudad: "Sevilla", provincia: "Sevilla", cp: "41010", deporte: "Balonmano" },
  { nombre: "Rugby Bahía", ciudad: "Vigo", provincia: "Pontevedra", cp: "36202", deporte: "Rugby" },
  { nombre: "Club Atletismo Ría", ciudad: "Bilbao", provincia: "Bizkaia", cp: "48001", deporte: "Atletismo" },
];

const PLANTILLAS_OPORTUNIDAD = [
  { titulo: "Camiseta de entrenamiento de la cantera", tipo: "youth", valor: 350, nivel: "colaborador", periodo: "season", forma: "money", objetivos: ["familias", "deporte_base"] },
  { titulo: "Patrocinador principal de la camiseta", tipo: "equipment", valor: 4500, nivel: "principal", periodo: "season", forma: "money", objetivos: ["visibilidad"], exclusividad: "automoción" },
  { titulo: "Lona publicitaria en el pabellón", tipo: "venue_matches", valor: 600, nivel: "colaborador", periodo: "season", forma: "money", objetivos: ["comunidad_local"] },
  { titulo: "Patrocinio del descanso de los partidos de casa", tipo: "venue_matches", valor: 150, nivel: "libre", periodo: "match", forma: "money", objetivos: ["visibilidad", "comunidad_local"] },
  { titulo: "Marca patrocinadora en redes sociales", tipo: "social_content", valor: 250, nivel: "oficial", periodo: "month", forma: "mixed", objetivos: ["contenido", "jovenes"], exclusividad: "restauración" },
  { titulo: "Torneo de Navidad de la cantera", tipo: "events_tournaments", valor: 900, nivel: "oficial", periodo: "event", forma: "money", objetivos: ["familias", "rsc"] },
  { titulo: "Fisioterapia para el primer equipo", tipo: "in_kind", valor: 1200, nivel: "colaborador", periodo: "season", forma: "service", objetivos: ["deporte_femenino"] },
  { titulo: "Bolsas de deporte para el equipo femenino", tipo: "equipment", valor: 50, nivel: "libre", periodo: "season", forma: "product", objetivos: ["deporte_femenino", "familias"] },
];

async function crear() {
  console.log("Creando clubes de prueba…");

  for (const [indice, club] of CLUBES.entries()) {
    const email = `club${indice + 1}${SUFIJO_SEED}`;

    const { data: creado, error: errorUsuario } = await supabase.auth.admin.createUser({
      email,
      password: "seed-apoyaclub-2026",
      email_confirm: true,
      app_metadata: { role: "club" },
      user_metadata: { name: club.nombre },
    });

    if (errorUsuario && !errorUsuario.message.includes("already been registered")) {
      console.error(`  ✗ ${club.nombre}: ${errorUsuario.message}`);
      continue;
    }

    let usuarioId = creado?.user?.id;
    if (!usuarioId) {
      const { data: lista } = await supabase.auth.admin.listUsers({ perPage: 200 });
      usuarioId = lista?.users.find((usuario) => usuario.email === email)?.id;
    }
    if (!usuarioId) continue;

    // Suscripción en prueba: si no, el club no sale ni en su página
    // pública ni en el buscador (migración 0007).
    const { error: errorClub } = await supabase.from("clubs").upsert(
      {
        id: usuarioId,
        name: club.nombre,
        city: club.ciudad,
        province: club.provincia,
        postal_code: club.cp,
        description: `${club.nombre} es un club de ${club.deporte.toLowerCase()} con cantera propia. Datos de prueba.`,
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
      { onConflict: "id" },
    );

    if (errorClub) {
      console.error(`  ✗ ${club.nombre}: ${errorClub.message}`);
      continue;
    }

    const { data: equipos } = await supabase
      .from("club_teams")
      .insert([
        { club_id: usuarioId, sport: club.deporte, category: "Senior", gender: "Masculino", team_level: "primer_equipo", player_count: 16 },
        { club_id: usuarioId, sport: club.deporte, category: "Cadete", gender: "Femenino", team_level: "cantera", player_count: 14 },
      ])
      .select("id");

    const oportunidades = PLANTILLAS_OPORTUNIDAD.slice(0, 2 + (indice % 3)).map((plantilla, posicion) => ({
      club_id: usuarioId,
      title: plantilla.titulo,
      description: `${plantilla.titulo} en ${club.nombre}. Datos de prueba.`,
      opportunity_type: plantilla.tipo,
      value: plantilla.valor,
      period: plantilla.periodo,
      collaboration_type: plantilla.forma,
      objectives: plantilla.objetivos,
      sponsor_level: plantilla.nivel,
      exclusivity: plantilla.exclusividad ?? null,
      team_id: equipos?.[posicion % (equipos?.length || 1)]?.id ?? null,
      status: "available",
    }));

    await supabase.from("opportunities").insert(oportunidades);
    console.log(`  ✓ ${club.nombre} (${oportunidades.length} oportunidades)`);
  }

  console.log("Listo. Contraseña de todos los clubes de prueba: seed-apoyaclub-2026");
}

async function limpiar() {
  console.log("Borrando los datos de prueba…");
  const { data: lista } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const usuarios = (lista?.users ?? []).filter((usuario) => usuario.email?.endsWith(SUFIJO_SEED));

  for (const usuario of usuarios) {
    // Borrar el usuario arrastra su club y, en cascada, equipos y
    // oportunidades.
    await supabase.auth.admin.deleteUser(usuario.id);
    console.log(`  ✓ ${usuario.email}`);
  }

  console.log(`Borrados ${usuarios.length} clubes de prueba.`);
}

const esLimpieza = process.argv.includes("--limpiar");
await (esLimpieza ? limpiar() : crear());
