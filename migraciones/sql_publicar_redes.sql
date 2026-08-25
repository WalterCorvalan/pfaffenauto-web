alter table vehiculos add column if not exists ig_post_id text;
alter table vehiculos add column if not exists fb_post_id text;
alter table vehiculos add column if not exists publicado_redes_at timestamptz;
