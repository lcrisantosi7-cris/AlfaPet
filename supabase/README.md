# Supabase de AlfaPet

1. Revisa el esquema SQL y las políticas RLS de tu proyecto de desarrollo.
2. Ejecuta las migraciones en orden en un entorno de prueba.
3. Verifica las RPC con usuarios de cada rol y con una sesión no autenticada.
4. No desactives RLS ni expongas la clave service-role.

La migración inicial disponible añade las funciones `create_patient_with_owner` y `get_patient_options`, requeridas por el módulo de pacientes.
