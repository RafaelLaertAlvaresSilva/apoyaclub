-- ---------------------------------------------------------------------
-- Los papeles de cada patrocinio: el contrato y la factura.
--
-- Hasta ahora, lo acordado con una empresa vivía en un campo de texto
-- ("Qué acordasteis", migración 0050) y el papel firmado de verdad
-- estaba en el correo de quien lo firmó. Cuando cambia la junta, ese
-- correo se va con él y el club se queda sin saber a qué se
-- comprometió.
--
-- UN ALMACÉN NUEVO Y PRIVADO. No se reutiliza `club-media`, y esto es
-- lo más importante de toda la migración: aquel bucket es PÚBLICO en
-- lectura (`public = true`), porque guarda logos y fotos que se enseñan
-- en la ficha. Cualquiera con la dirección ve el archivo. Un contrato o
-- una factura ahí dentro sería una fuga de datos el primer día. Este es
-- privado y solo se llega a sus archivos con un enlace firmado que
-- caduca, que genera el servidor después de comprobar de quién es.
--
-- POR QUÉ UNA TABLA Y NO SOLO LA CARPETA. Listando el bucket se sabe
-- qué archivos hay, pero no si son contratos o facturas, ni cómo se
-- llamaba el archivo que subió el club, ni a qué patrocinador va cada
-- uno. Eso es lo que hace falta para enseñarlo ordenado.
--
-- LOS LÍMITES SON A PROPÓSITO. Esta es la primera función cuyo coste
-- crece con el uso: las ideas y las tareas son filas y no pesan, los
-- archivos se pagan por giga. 10 MB por archivo y 6 archivos por
-- patrocinador acotan el gasto sin que ningún club con un contrato
-- normal se quede fuera.
-- ---------------------------------------------------------------------

create table if not exists public.club_sponsor_documents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  -- Al borrar el patrocinador se van sus papeles. Es distinto de las
  -- tareas (migración 0030), que sobreviven porque lo prometido es
  -- historia del club. Un contrato con una empresa que ya no está no
  -- se consulta nunca y, si se queda, el archivo sigue ocupando sitio
  -- en el almacén sin que haya ninguna pantalla desde la que llegar a
  -- él. OJO: esto borra la FILA, no el ARCHIVO. El archivo lo borra la
  -- aplicación antes de borrar al patrocinador.
  sponsor_id uuid not null references public.club_sponsors (id) on delete cascade,

  -- Qué papel es. Cerrado a tres valores: con texto libre, en un mes
  -- hay "Contrato", "contrato", "CONTRATO" y "contrato firmado", y
  -- agrupar deja de funcionar.
  kind text not null,

  -- Dónde está dentro del bucket: "<club_id>/<sponsor_id>/<uuid>.pdf".
  -- Único porque dos filas apuntando al mismo archivo harían que
  -- borrar una dejara a la otra señalando un hueco.
  storage_path text not null unique,

  -- El nombre que tenía el archivo en el ordenador del club. El de
  -- dentro del bucket es un uuid, que no le dice nada a nadie.
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,

  created_at timestamptz not null default now()
);

alter table public.club_sponsor_documents
  drop constraint if exists club_sponsor_documents_kind_check;
alter table public.club_sponsor_documents
  add constraint club_sponsor_documents_kind_check
  check (kind in ('contrato', 'factura', 'otro'));

-- El mismo tope que el bucket, también aquí: el bucket protege de lo
-- que entra por Storage, esta regla de lo que entra por la tabla.
alter table public.club_sponsor_documents
  drop constraint if exists club_sponsor_documents_size_check;
alter table public.club_sponsor_documents
  add constraint club_sponsor_documents_size_check
  check (size_bytes > 0 and size_bytes <= 10485760);

create index if not exists club_sponsor_documents_sponsor_idx
  on public.club_sponsor_documents (club_id, sponsor_id, created_at);

comment on table public.club_sponsor_documents is
  'Contratos y facturas de cada patrocinador (migración 0051). Los archivos van en el bucket privado club-docs.';

-- ---------------------------------------------------------------------
-- Quién puede ver y tocar estas filas: solo el club dueño.
-- ---------------------------------------------------------------------

alter table public.club_sponsor_documents enable row level security;

drop policy if exists "club_sponsor_documents_select_own" on public.club_sponsor_documents;
create policy "club_sponsor_documents_select_own"
  on public.club_sponsor_documents for select
  using (auth.uid() = club_id);

drop policy if exists "club_sponsor_documents_insert_own" on public.club_sponsor_documents;
create policy "club_sponsor_documents_insert_own"
  on public.club_sponsor_documents for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsor_documents_update_own" on public.club_sponsor_documents;
create policy "club_sponsor_documents_update_own"
  on public.club_sponsor_documents for update
  using (auth.uid() = club_id);

drop policy if exists "club_sponsor_documents_delete_own" on public.club_sponsor_documents;
create policy "club_sponsor_documents_delete_own"
  on public.club_sponsor_documents for delete
  using (auth.uid() = club_id);

-- ---------------------------------------------------------------------
-- El almacén: `club-docs`, PRIVADO.
-- ---------------------------------------------------------------------
-- `public = false` es la línea que separa esto de `club-media`. Con él,
-- no hay dirección pública: para leer un archivo hay que pedirle al
-- servidor un enlace firmado, y el servidor solo lo firma después de
-- comprobar que quien lo pide es el club dueño.
--
-- Los tipos permitidos incluyen imágenes porque media España firma un
-- patrocinio en papel y lo guarda como la foto que le hizo con el
-- móvil. Si solo se admitiera PDF, esos clubes no podrían subir nada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-docs',
  'club-docs',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Nadie lee este bucket por las bravas: no hay política de lectura
-- pública como la de `club-media`. Solo el dueño de la carpeta, y el
-- servidor con su clave de servicio para firmar enlaces.
drop policy if exists "club_docs_read_own_folder" on storage.objects;
create policy "club_docs_read_own_folder"
  on storage.objects for select
  using (
    bucket_id = 'club-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "club_docs_insert_own_folder" on storage.objects;
create policy "club_docs_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'club-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "club_docs_update_own_folder" on storage.objects;
create policy "club_docs_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'club-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "club_docs_delete_own_folder" on storage.objects;
create policy "club_docs_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'club-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
