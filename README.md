# AlfaPet — sistema de gestión veterinaria

Aplicación web para la gestión asistencial de la veterinaria AlfaPet, como parte del proyecto académico “Sistema de gestión asistencial veterinaria bajo estándares de calidad ISO 25010 para optimizar la estabilidad operativa, Sullana 2026”.

## Tecnologías
- React y TypeScript
- React Router
- Tailwind CSS
- Supabase Auth y PostgreSQL

## Estado actual
- Autenticación y perfiles por rol.
- Panel inicial conectado a una función RPC de resumen.
- Formulario transaccional de registro de propietario y paciente.
- Directorio de pacientes con búsqueda y filtros de especie/estado.
- Los módulos de citas, consultas, historial clínico, vacunas, productos, reportes y configuración siguen pendientes de implementación funcional.

## Instalación local
Requiere una versión de Node.js compatible con el campo `engines` de `package.json`.

1. Clona el repositorio.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env` y configura las variables del proyecto Supabase.
4. En un proyecto Supabase de desarrollo, revisa y ejecuta `supabase/migrations/202610220001_patient_transactions.sql` después de comprobar el esquema y las políticas RLS existentes.
5. Ejecuta `npm run dev`.

## Comprobaciones
- `npm run typecheck`
- `npm run build`

Estas comprobaciones deben ejecutarse localmente o en CI antes de considerar el cambio listo para producción. No se han documentado resultados de pruebas hasta que se ejecuten y registren.

## Calidad ISO/IEC 25010
Consulta [el plan de calidad](docs/PLAN_CALIDAD_ISO_25010.md). El documento define verificaciones propuestas para adecuación funcional, desempeño, compatibilidad, capacidad de interacción, fiabilidad, seguridad, mantenibilidad, flexibilidad y seguridad operacional. Las métricas y conclusiones deben basarse en evidencia real.

## Seguridad
- Nunca guardes `.env`, contraseñas, claves de servicio ni tokens reales en el repositorio.
- La clave service-role de Supabase es exclusivamente para servidor y no debe llegar al navegador.
- Mantén RLS habilitado y prueba el acceso con cada rol.
- Si una credencial real fue publicada en Git, revócala/ rótala en el proveedor; borrar el valor del archivo actual no lo elimina del historial de Git.

## Contribución
Trabaja con migraciones revisables, validación de servidor y pruebas automatizadas. Antes de desplegar cambios de base de datos, prueba restauración, concurrencia y permisos en un entorno de desarrollo.
