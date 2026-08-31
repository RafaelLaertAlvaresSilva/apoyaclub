import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export type UsuarioPorRol = {
  id: string;
  email: string | null;
  createdAt: string;
};

const TAMANO_PAGINA = 200;
// Hasta 5000 cuentas de un rol; de sobra para el tamaño actual de la
// plataforma (MVP, "con pocos clubes no compensa" complicar esto).
const MAX_PAGINAS = 25;

/**
 * Todas las cuentas de un rol dado (Fase 12), leídas de Supabase Auth
 * (no de `clubs`/`companies`): esas tablas de perfil se crean con
 * `upsert` la primera vez que el club/empresa guarda algo (Fases 4 y
 * 8, "no hay un paso de registro obligatorio que la cree antes"), así
 * que una cuenta recién registrada que todavía no ha tocado su panel
 * no tiene fila ahí. Auth sí tiene, desde el registro, su fecha de
 * alta real y su rol (`app_metadata.role`), así que es la fuente de
 * verdad para "quién se ha registrado", no la tabla de perfil.
 */
export async function obtenerUsuariosPorRol(rol: Role): Promise<UsuarioPorRol[]> {
  const admin = createAdminClient();
  const usuarios: UsuarioPorRol[] = [];

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: TAMANO_PAGINA });
    if (error || !data) break;

    for (const usuario of data.users) {
      if ((usuario.app_metadata?.role as Role | undefined) === rol) {
        usuarios.push({ id: usuario.id, email: usuario.email ?? null, createdAt: usuario.created_at });
      }
    }

    if (data.users.length < TAMANO_PAGINA) break;
  }

  return usuarios;
}
