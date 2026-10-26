# AlfaPet — plan de implementación y calidad

## Contexto

El sistema usa React, TypeScript, React Router, Tailwind CSS, Supabase Auth y PostgreSQL. El objetivo es gestionar pacientes, propietarios, citas, consultas, historial, vacunas, inventario, ventas y servicios clínicos sin pérdida de información ni cruces de agenda.

## ISO/IEC 25010:2023

El proyecto usa las nueve características del modelo vigente: adecuación funcional, eficiencia de desempeño, compatibilidad, capacidad de interacción, fiabilidad, seguridad, mantenibilidad, flexibilidad y seguridad operacional.

| Característica | Verificación | Evidencia requerida |
|---|---|---|
| Adecuación funcional | Casos de pacientes, citas, consultas, historial, inventario y ventas | Casos ejecutados y resultados |
| Eficiencia de desempeño | Latencia p50/p95 y consultas bajo carga representativa | Informe de carga |
| Compatibilidad | Navegadores objetivo, SSR, Docker y conexión Supabase | Matriz de compatibilidad |
| Capacidad de interacción | Teclado, foco, etiquetas, responsive y errores comprensibles | Checklist y capturas |
| Fiabilidad | Concurrencia, rollback, restricciones, auditoría y recuperación | Logs y pruebas de fallo |
| Seguridad | Auth, RLS, roles, CSRF, CSP y secretos | Pruebas negativas por rol |
| Mantenibilidad | Tests, typecheck, build, CI y estructura modular | Logs de CI y cobertura |
| Flexibilidad | Variables de entorno y migraciones versionadas | Despliegue en ambiente de prueba |
| Seguridad operacional | Backup y restauración en ambiente aislado | Evidencia de restauración |

Los resultados deben medirse. No se deben presentar valores hipotéticos como resultados del proyecto.

## Pruebas incluidas

- `npm test`: pruebas unitarias con Vitest.
- `npm run test:coverage`: cobertura de código con V8 para registrar una métrica reproducible.
- `npm run typecheck`: validación de tipos y generación de tipos de React Router.
- `npm run build`: build de producción.
- `supabase test db`: pruebas SQL estructurales de restricciones y RLS en un proyecto local o de desarrollo.
- `.github/workflows/quality.yml`: ejecución automática de test, typecheck y build.

## Integridad y concurrencia

La migración `supabase/migrations/202610260003_integridad_concurrencia.sql`:

- evita propietarios duplicados por documento normalizado;
- añade duración explícita a las citas;
- bloquea solapamientos de citas por veterinario y por paciente mediante exclusión GiST;
- restringe en RLS las filas que puede actualizar un veterinario;
- impide por trigger que el veterinario cambie los datos de programación.

Antes de aplicar esta migración, ejecutar los diagnósticos del esquema. Si ya existen duplicados o solapamientos, la migración se detendrá para evitar ocultar inconsistencias.

## Ejecución

Desde la raíz:

```bash
npm ci
npm run test
npm run typecheck
npm run build
npm run quality
```

Las pruebas SQL se ejecutan aparte porque requieren PostgreSQL/Supabase:

```bash
supabase test db
```

No ejecutar migraciones ni pruebas destructivas en producción. Usar un proyecto de desarrollo con datos de prueba y guardar las salidas en `quality/results/`.

## Seguridad

No guardar credenciales reales, contraseñas ni claves de Supabase en Git. La clave `service_role` debe permanecer solo en el servidor. Mantener RLS activo y probar cada operación con usuarios `admin`, `veterinario`, `recepcion` y una sesión no autenticada.
