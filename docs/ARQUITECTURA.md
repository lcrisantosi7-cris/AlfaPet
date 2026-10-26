# AlfaPet — Arquitectura

## Capas por módulo

Cada funcionalidad vive en `app/modules/<modulo>/` con controlador, repositorio/modelo, vista y ruta. Los controladores validan sesión, rol y entrada; los repositorios encapsulan Supabase; las vistas reciben datos y renderizan la interfaz.

Reglas principales:

- Una vista nunca importa un `.server.ts`.
- Un modelo nunca importa una vista.
- Los componentes reutilizables viven en `app/core/`.
- Las operaciones que deben ser atómicas se implementan en RPC o en restricciones de PostgreSQL.
- La autorización de la interfaz se duplica en el servidor y en RLS; ocultar un menú no es una medida de seguridad.

## Supabase y seguridad de datos

Supabase Auth mantiene la identidad. El servidor crea un cliente por petición y conserva la sesión en cookies. PostgreSQL aplica RLS según `admin`, `veterinario` y `recepcion`.

Las migraciones incluyen funciones transaccionales para pacientes, análisis y ventas; auditoría de cambios; índices; restricciones de integridad; y protección contra duplicidad de propietarios y solapamiento de citas. La migración `202610260003_integridad_concurrencia.sql` añade la duración de la cita, restricciones de exclusión y defensa de actualizaciones realizadas por veterinarios.

## ISO/IEC 25010:2023

| Característica | Evidencia o decisión de diseño |
|---|---|
| Adecuación funcional | Módulos por dominio clínico, RPC transaccionales y validación de entradas. |
| Eficiencia de desempeño | Consultas limitadas/paginadas, índices SQL y consultas agregadas para paneles. La latencia debe medirse con carga representativa. |
| Compatibilidad | SSR con React Router, Supabase aislado tras repositorios y Dockerfile para despliegue. Debe completarse la matriz de navegadores. |
| Capacidad de interacción | Diseño responsive, teclado, foco visible, etiquetas ARIA, mensajes de error y soporte de movimiento reducido. |
| Fiabilidad | Error boundary, manejo de errores, rollback transaccional, restricciones de integridad, auditoría y pruebas unitarias/SQL. |
| Seguridad | Auth validada en servidor, RLS por rol, CSRF same-origin, cookies de sesión y secretos solo en variables de entorno. CSP con `unsafe-inline` sigue siendo una deuda. |
| Mantenibilidad | TypeScript estricto, separación por módulos, Vitest, typecheck, build y CI. |
| Flexibilidad | Variables de entorno, migraciones versionadas y configuración separada por ambiente. |
| Seguridad operacional | Diagnósticos de RLS y procedimientos documentados; falta ejecutar y evidenciar backup/restauración. |

## Evidencia

La matriz de pruebas y los comandos se encuentran en `quality/README.md` y `quality/ISO-25010-EVIDENCE.md`. No se debe declarar conformidad solo por la existencia del código: cada característica requiere resultado medido, criterio de aceptación y evidencia.
