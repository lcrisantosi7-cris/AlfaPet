-- 1) Habitaciones (antes "Jaula ...")
update public.kennels set name = regexp_replace(name, '^jaula', 'Habitación', 'i') where name ilike 'jaula%';

-- 2) Productos: campos nuevos
alter table public.products
  add column if not exists description text check (char_length(description) <= 500),
  add column if not exists brand text check (char_length(brand) <= 80),
  add column if not exists unit text not null default 'unidad' check (char_length(unit) <= 20),
  add column if not exists expires_at date;

-- 3) Más categorías
insert into public.product_categories (name) values
  ('Alimento seco'), ('Alimento húmedo'), ('Snacks y premios'), ('Juguetes'), ('Accesorios y paseo'),
  ('Higiene y cuidado'), ('Camas y transporte'), ('Antiparasitarios'), ('Antibióticos'),
  ('Antiinflamatorios y analgésicos'), ('Vitaminas y suplementos'), ('Dermatología'), ('Insumos médicos')
on conflict (name) do nothing;

-- 4) Vacunas comunes (con intervalo para calcular la próxima dosis)
insert into public.vaccines (name, interval_days) values
  ('Quíntuple canina', 365), ('Séxtuple canina', 365), ('Antirrábica', 365),
  ('Triple felina', 365), ('Bordetella', 365), ('Leucemia felina', 365)
on conflict (name) do nothing;

-- 5) Farmacia de ejemplo (edítala o desactívala desde Productos)
insert into public.products (sku, name, category, category_id, price, stock, min_stock, kind, requires_prescription, unit)
select v.sku, v.name, v.cat, (select c.id from public.product_categories c where c.name = v.cat),
       v.price, v.stock, v.min_stock, 'farmacia', v.rx, v.unit
from (values
  ('FAR-001', 'Antiparasitario externo (pipeta)', 'Antiparasitarios', 35.00, 20, 5, false, 'unidad'),
  ('FAR-002', 'Desparasitante interno (tabletas)', 'Antiparasitarios', 12.00, 40, 10, false, 'tableta'),
  ('FAR-003', 'Amoxicilina + ácido clavulánico 250 mg', 'Antibióticos', 28.00, 30, 8, true, 'blister'),
  ('FAR-004', 'Meloxicam suspensión oral', 'Antiinflamatorios y analgésicos', 32.00, 15, 5, true, 'frasco'),
  ('FAR-005', 'Suero fisiológico 500 ml', 'Insumos médicos', 9.00, 30, 10, false, 'frasco'),
  ('FAR-006', 'Complejo vitamínico en gotas', 'Vitaminas y suplementos', 25.00, 20, 5, false, 'frasco'),
  ('FAR-007', 'Shampoo dermatológico medicado', 'Dermatología', 38.00, 12, 4, false, 'frasco')
) as v(sku, name, cat, price, stock, min_stock, rx, unit)
on conflict (sku) do nothing;