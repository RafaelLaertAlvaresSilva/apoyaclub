#!/usr/bin/env bash
#
# Aplica todas las migraciones contra un PostgreSQL local vacío y avisa
# si alguna falla. Existe por un error real: la migración 0004 recreaba
# una vista metiendo columnas en medio, cosa que `create or replace view`
# no permite, y eso solo se ve al aplicarlas en orden sobre una base
# nueva. En el proyecto de Supabase de turno, donde las vistas ya
# existían, no daba la cara.
#
#   ./scripts/probar-migraciones.sh
#
# Necesita psql y un PostgreSQL local arrancado.
set -euo pipefail

BASE="${1:-apoyaclub_migraciones_test}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

echo "Base de pruebas: $BASE"
dropdb --if-exists "$BASE"
createdb "$BASE"

psql -q -v ON_ERROR_STOP=1 -d "$BASE" -f "$RAIZ/scripts/preludio-supabase.sql"

fallos=0
for pasada in "primera" "segunda (repetidas)"; do
  echo
  echo "== Pasada $pasada =="
  for archivo in "$RAIZ"/supabase/migrations/*.sql; do
    if ! psql -q -v ON_ERROR_STOP=1 -d "$BASE" -f "$archivo" > /dev/null 2>/tmp/error-migracion; then
      echo "FALLA $(basename "$archivo"):"
      sed 's/^/    /' /tmp/error-migracion | head -5
      fallos=1
    fi
  done
  [ $fallos -eq 0 ] && echo "todas aplican sin errores"
done

echo
objetos=$(psql -tAq -d "$BASE" -c "select count(*) from information_schema.tables where table_schema='public'")
echo "Objetos creados en public: $objetos"
dropdb "$BASE"

exit $fallos
