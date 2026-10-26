# AlfaPet — sistema de gestión veterinaria

Aplicación web para la gestión asistencial de la veterinaria AlfaPet, como parte del proyecto académico “Sistema de gestión asistencial veterinaria bajo estándares de calidad ISO 25010 para optimizar la estabilidad operativa, Sullana 2026”.

## Tecnologías

- React 19 y TypeScript
- React Router 8 con SSR
- Tailwind CSS
- Supabase Auth y PostgreSQL
- Vitest para pruebas unitarias

## Estado actual

- Autenticación de Supabase y perfiles por rol.
- Panel inicial conectado a funciones RPC y datos reales.
- Registro transaccional de propietario y paciente.
- Directorio de pacientes, citas, consultas, historial, vacunas, productos, ventas, reportes, cirugías, análisis e internamiento.
- RLS por rol, auditoría de cambios y funciones transaccionales para operaciones críticas.
- Protección SQL contra propietarios duplicados y solapamiento de citas.

## Instalación local

Requiere Node.js 22.18 o superior.

1. Clona el repositorio.
2. Ejecuta `npm ci`.
3. Copia `.env.example` a `.env` y configura las variables del proyecto Supabase.
4. Ejecuta las migraciones en orden en un proyecto Supabase de desarrollo. La migración `202610260003_integridad_concurrencia.sql` detiene la instalación si detecta duplicados que deben resolverse manualmente.
5. Ejecuta `npm run dev`.

## Comprobaciones

```bash
npm test
npm run typecheck
npm run build
npm run quality
```

El workflow `.github/workflows/quality.yml` ejecuta estas comprobaciones en cada push a `main` y en cada pull request.

## Calidad ISO/IEC 25010

Consulta [el plan de calidad](docs/PLAN_CALIDAD_ISO_25010.md) y la [matriz de evidencia](quality/ISO-25010-EVIDENCE.md). El repositorio contiene pruebas unitarias, pruebas SQL estructurales para integridad/RLS y comandos reproducibles. Los resultados de rendimiento, compatibilidad, restauración y pruebas por rol deben ejecutarse en un entorno de desarrollo y registrarse con evidencia real.

## Seguridad

- Nunca guardes `.env`, contraseñas, claves de servicio ni tokens reales en el repositorio.
- La clave `service_role` de Supabase es exclusivamente para servidor y no debe llegar al navegador.
- Mantén RLS habilitado y prueba el acceso con cada rol.
- Si una credencial real fue publicada en Git, revócala o rótala en el proveedor; borrar el valor del archivo actual no lo elimina del historial de Git.

## Contribución

Trabaja con migraciones revisables, validación de servidor y pruebas automatizadas. Antes de desplegar cambios de base de datos, prueba restauración, concurrencia y permisos en un entorno de desarrollo.
