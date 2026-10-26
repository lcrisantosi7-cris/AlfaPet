-- AlfaPet: migracion 001 - catalogos normalizados
-- Objetivo: preparar catalogos de especies, razas y categorias sin eliminar
-- ni renombrar columnas utilizadas actualmente por la aplicacion.
-- Ejecutar en Supabase SQL Editor con un usuario administrador de la base.
-- Revisar el resultado y conservar un respaldo antes de ejecutar en produccion.
--
-- Seguridad: las tablas nuevas usan RLS. Lectura para roles de la aplicacion;
-- escritura de catalogos reservada a admin. No modifica las politicas existentes.

BEGIN;

-- 1. Catalogo de especies
CREATE TABLE IF NOT EXISTS public.species_catalog (
    id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT species_catalog_code_format_check
        CHECK (code = lower(btrim(code)) AND char_length(code) BETWEEN 2 AND 30),
    CONSTRAINT species_catalog_name_length_check
        CHECK (char_length(btrim(name)) BETWEEN 2 AND 80)
);

-- 2. Catalogo de razas; cada raza pertenece a una especie.
CREATE TABLE IF NOT EXISTS public.breeds (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    species_id smallint NOT NULL
        REFERENCES public.species_catalog(id) ON DELETE RESTRICT,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT breeds_name_length_check
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS breeds_species_normalized_name_uidx
    ON public.breeds (species_id, lower(btrim(name)));

-- 3. Catalogo de categorias de productos
CREATE TABLE IF NOT EXISTS public.product_categories (
    id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT product_categories_name_length_check
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 60)
);

-- 4. Nuevas FK opcionales: las columnas antiguas se conservan durante
-- la transicion para no romper el codigo actual.
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS species_id smallint,
    ADD COLUMN IF NOT EXISTS breed_id bigint;

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS category_id smallint;

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.patients'::regclass
          AND conname = 'patients_species_id_fkey'
    ) THEN
        ALTER TABLE public.patients
            ADD CONSTRAINT patients_species_id_fkey
            FOREIGN KEY (species_id)
            REFERENCES public.species_catalog(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.patients'::regclass
          AND conname = 'patients_breed_id_fkey'
    ) THEN
        ALTER TABLE public.patients
            ADD CONSTRAINT patients_breed_id_fkey
            FOREIGN KEY (breed_id)
            REFERENCES public.breeds(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.products'::regclass
          AND conname = 'products_category_id_fkey'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_category_id_fkey
            FOREIGN KEY (category_id)
            REFERENCES public.product_categories(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;
END
$migration$;

-- 5. Semillas seguras. Codigos estables; no se modifica el enum existente.
INSERT INTO public.species_catalog (code, name)
VALUES ('perro', 'Perro'), ('gato', 'Gato')
ON CONFLICT (code) DO NOTHING;

-- Importar las categorias ya utilizadas en productos sin inventar categorias.
-- Se conserva el texto existente (por ejemplo, VACUNA) para facilitar el mapeo.
INSERT INTO public.product_categories (name)
SELECT DISTINCT btrim(category)
FROM public.products
WHERE category IS NOT NULL
  AND btrim(category) <> ''
ON CONFLICT (name) DO NOTHING;

-- 6. Backfill solo de correspondencias inequívocas.
UPDATE public.patients p
SET species_id = s.id
FROM public.species_catalog s
WHERE lower(btrim(p.species::text)) = s.code
  AND p.species_id IS NULL;

UPDATE public.products p
SET category_id = c.id
FROM public.product_categories c
WHERE lower(btrim(p.category)) = lower(btrim(c.name))
  AND p.category IS NOT NULL
  AND btrim(p.category) <> ''
  AND p.category_id IS NULL;

-- No se migran automaticamente las razas actuales ('asas', 'Chusco',
-- 'gatitos'): no hay datos suficientes para confirmar la especie correcta.
-- breed_id permanece NULL hasta que esos valores se revisen.

-- 7. Indices de las nuevas relaciones
CREATE INDEX IF NOT EXISTS patients_species_id_idx
    ON public.patients (species_id);
CREATE INDEX IF NOT EXISTS patients_breed_id_idx
    ON public.patients (breed_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx
    ON public.products (category_id);

-- 8. Seguridad de los catalogos: RLS habilitado y politicas por rol.
ALTER TABLE public.species_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS species_catalog_select ON public.species_catalog;
CREATE POLICY species_catalog_select
    ON public.species_catalog FOR SELECT
    TO authenticated
    USING ((SELECT auth_role()::text) = ANY (ARRAY['admin','veterinario','recepcion']));

DROP POLICY IF EXISTS species_catalog_insert ON public.species_catalog;
CREATE POLICY species_catalog_insert
    ON public.species_catalog FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS species_catalog_update ON public.species_catalog;
CREATE POLICY species_catalog_update
    ON public.species_catalog FOR UPDATE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin')
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS species_catalog_delete ON public.species_catalog;
CREATE POLICY species_catalog_delete
    ON public.species_catalog FOR DELETE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS breeds_select ON public.breeds;
CREATE POLICY breeds_select
    ON public.breeds FOR SELECT
    TO authenticated
    USING ((SELECT auth_role()::text) = ANY (ARRAY['admin','veterinario','recepcion']));

DROP POLICY IF EXISTS breeds_insert ON public.breeds;
CREATE POLICY breeds_insert
    ON public.breeds FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS breeds_update ON public.breeds;
CREATE POLICY breeds_update
    ON public.breeds FOR UPDATE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin')
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS breeds_delete ON public.breeds;
CREATE POLICY breeds_delete
    ON public.breeds FOR DELETE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS product_categories_select ON public.product_categories;
CREATE POLICY product_categories_select
    ON public.product_categories FOR SELECT
    TO authenticated
    USING ((SELECT auth_role()::text) = ANY (ARRAY['admin','veterinario','recepcion']));

DROP POLICY IF EXISTS product_categories_insert ON public.product_categories;
CREATE POLICY product_categories_insert
    ON public.product_categories FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS product_categories_update ON public.product_categories;
CREATE POLICY product_categories_update
    ON public.product_categories FOR UPDATE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin')
    WITH CHECK ((SELECT auth_role()::text) = 'admin');

DROP POLICY IF EXISTS product_categories_delete ON public.product_categories;
CREATE POLICY product_categories_delete
    ON public.product_categories FOR DELETE
    TO authenticated
    USING ((SELECT auth_role()::text) = 'admin');

-- Grants SQL: RLS sigue siendo la barrera por fila para authenticated.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.species_catalog, public.breeds, public.product_categories
    TO authenticated;

COMMIT;

-- 9. Verificacion posterior (ejecutar despues del COMMIT)
-- SELECT 'species_catalog' AS tabla, count(*) AS filas FROM public.species_catalog
-- UNION ALL SELECT 'breeds', count(*) FROM public.breeds
-- UNION ALL SELECT 'product_categories', count(*) FROM public.product_categories;
--
-- SELECT id, code, name, is_active FROM public.species_catalog ORDER BY id;
-- SELECT id, name, category_id FROM public.products ORDER BY name;
-- SELECT id, name, species::text AS especie_actual, species_id, breed, breed_id
-- FROM public.patients ORDER BY name;
--
-- Esta migracion no cambia las politicas de owners/patients, no fuerza RLS,
-- no modifica appointment_status y no elimina ni renombra columnas existentes.
