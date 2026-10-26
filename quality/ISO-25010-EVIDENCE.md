# Matriz de evidencia ISO/IEC 25010:2023 — AlfaPet

> Completar los campos de resultado únicamente después de ejecutar las pruebas. Esta matriz no declara conformidad por sí sola.

| Característica | Evidencia implementada | Prueba que debe ejecutarse | Resultado que debe registrarse |
|---|---|---|---|
| Adecuación funcional | Módulos de pacientes, citas, consultas, historial, inventario y ventas | Casos de uso de alta, búsqueda, actualización, cita y venta | Casos ejecutados, aprobados y fallidos |
| Eficiencia de desempeño | Consultas paginadas e índices SQL | Medir p50/p95 con datos representativos y carga concurrente | Latencia, volumen, entorno y umbral |
| Compatibilidad | React Router, SSR, Supabase y Dockerfile | Probar navegadores objetivo y despliegue limpio | Matriz por navegador/entorno |
| Capacidad de interacción | Componentes responsive, teclado, foco y mensajes de error | Checklist manual o automatizado de interacción | Incidencias y porcentaje cumplido |
| Fiabilidad | RPC transaccionales, restricciones SQL, auditoría y error boundary | Repetir operaciones, simular concurrencia y recuperación | Errores, duplicados, rollback y tasa de éxito |
| Seguridad | Auth de servidor, RLS, roles, CSRF, CSP y secretos fuera de Git | Pruebas negativas por rol, sesión anónima y revisión de secretos | Accesos permitidos/denegados y hallazgos |
| Mantenibilidad | TypeScript, módulos, pruebas unitarias y CI | `npm run test`, `npm run typecheck`, revisión de cobertura | Resultado de comandos, cobertura y deuda técnica |
| Flexibilidad | Variables de entorno y migraciones versionadas | Despliegue con configuración de desarrollo y prueba | Pasos, diferencias y resultado |
| Seguridad operacional | Diagnósticos RLS, backups y procedimiento de restauración | Restaurar una copia en entorno aislado y verificar datos | Fecha, versión, tiempo y resultado de restauración |

## Criterios sugeridos

Los umbrales numéricos deben ser acordados por el equipo antes de medirlos. Como mínimo, el trabajo debe mostrar que las pruebas funcionales críticas pasan, que no existen errores de `typecheck`, que el build es reproducible y que las políticas RLS fueron verificadas por rol.
