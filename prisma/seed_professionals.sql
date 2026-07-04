-- Seed: 6 profesionales de ejemplo para poblar la sección
-- "Profesionales verificados en tu zona" del home.
-- Nota avatar: professionals.avatarUrl guarda una KEY de R2 (bucket propio,
-- servida via /api/avatar?key=...), no una URL pública — no se puede seedear
-- por SQL sin subir el archivo real a R2 antes. Se deja NULL: ProfCard cae
-- a las iniciales+color como fallback (comportamiento ya soportado).
-- users.image sí acepta URL externa directa (usado en Navbar), por eso ahí
-- se usa pravatar.cc.
-- Password no seteado (login solo via OAuth/reset). Correr manualmente
-- contra la DB (psql, Supabase SQL editor, etc). No se ejecuta desde acá.

BEGIN;

INSERT INTO users (id, name, username, email, image, role, "isActive", "createdAt", "updatedAt")
VALUES
  ('seed_user_lm', 'Laura Miranda', 'laura-miranda', 'laura.miranda@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=47', 'PROFESSIONAL', true, now(), now()),
  ('seed_user_dn', 'Diego Núñez', 'diego-n', 'diego.nunez@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=12', 'PROFESSIONAL', true, now(), now()),
  ('seed_user_eb', 'Elena Brea', 'elena-brea', 'elena.brea@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=32', 'PROFESSIONAL', true, now(), now()),
  ('seed_user_sr', 'Sofía Ramos', 'sofia-r', 'sofia.ramos@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=45', 'PROFESSIONAL', true, now(), now()),
  ('seed_user_mv', 'Martín Vera', 'martin-v', 'martin.vera@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=14', 'PROFESSIONAL', true, now(), now()),
  ('seed_user_ap', 'Andrea Paz', 'andrea-p', 'andrea.paz@seed.conectatuproff.com', 'https://i.pravatar.cc/150?img=48', 'PROFESSIONAL', true, now(), now());

INSERT INTO professionals (id, "userId", "firstName", "lastName", specialty, location, rating, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES
  ('seed_pro_lm', 'seed_user_lm', 'Laura', 'Miranda', 'Masajes terapéuticos', 'Palermo, CABA', 4.9, true, true, now(), now()),
  ('seed_pro_dn', 'seed_user_dn', 'Diego', 'Núñez', 'Plomero · Urgencias 24h', 'Belgrano, CABA', 4.7, true, true, now(), now()),
  ('seed_pro_eb', 'seed_user_eb', 'Elena', 'Brea', 'Kinesiología deportiva', 'San Isidro, GBA', 5.0, true, true, now(), now()),
  ('seed_pro_sr', 'seed_user_sr', 'Sofía', 'Ramos', 'Reflexóloga · Bienestar', 'Caballito, CABA', 4.8, true, true, now(), now()),
  ('seed_pro_mv', 'seed_user_mv', 'Martín', 'Vera', 'Electricista · Urgencias', 'Lanús, GBA', 4.6, true, true, now(), now()),
  ('seed_pro_ap', 'seed_user_ap', 'Andrea', 'Paz', 'Limpieza · Hogar', 'Flores, CABA', 4.9, true, true, now(), now());

INSERT INTO services (id, "professionalId", title, price, currency, "isActive", "createdAt", "updatedAt")
VALUES
  ('seed_svc_lm', 'seed_pro_lm', 'Sesión de masajes terapéuticos', 3500, 'ARS', true, now(), now()),
  ('seed_svc_dn', 'seed_pro_dn', 'Visita de plomería', 4500, 'ARS', true, now(), now()),
  ('seed_svc_eb', 'seed_pro_eb', 'Sesión de kinesiología deportiva', 5000, 'ARS', true, now(), now()),
  ('seed_svc_sr', 'seed_pro_sr', 'Sesión de reflexología', 3200, 'ARS', true, now(), now()),
  ('seed_svc_mv', 'seed_pro_mv', 'Visita eléctrica', 4800, 'ARS', true, now(), now()),
  ('seed_svc_ap', 'seed_pro_ap', 'Limpieza de hogar', 2500, 'ARS', true, now(), now());

COMMIT;
