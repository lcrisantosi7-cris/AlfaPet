# Evidencia de calidad ISO/IEC 25010

Esta carpeta contiene pruebas reproducibles y la matriz de evidencia del proyecto AlfaPet. Los resultados deben generarse en el entorno de desarrollo o CI; no se deben inventar valores en el documento académico.

## Ejecución local

Desde la raíz del repositorio:

```bash
npm ci
npm run test
npm run test:coverage
npm run typecheck
npm run build
npm run quality
```

`npm run quality` ejecuta las pruebas unitarias, la comprobación de tipos y el build. Sus salidas deben guardarse como evidencia, por ejemplo:

```bash
mkdir -p quality/results
npm run test -- --reporter=verbose > quality/results/unit-tests.txt
npm run test:coverage > quality/results/coverage.txt
npm run typecheck > quality/results/typecheck.txt
npm run build > quality/results/build.txt
```

La cobertura configurada actualmente mide de forma explícita `RateLimiter` y `reporte-dates`, que son los módulos cubiertos por las pruebas unitarias incluidas. No debe presentarse como cobertura total de toda la aplicación; se debe ampliar al añadir pruebas de nuevos módulos.

## Base de datos y RLS

Las pruebas SQL de `supabase/tests/` requieren un proyecto Supabase de desarrollo o un entorno local Supabase. Ejecutarlas con:

```bash
supabase test db
```

No ejecutar migraciones ni pruebas contra producción sin respaldo y autorización. Las pruebas RLS deben ejecutarse con usuarios de cada rol y con una sesión no autenticada.

## Qué colocar en el documento académico

Para cada característica ISO 25010 se debe registrar: objetivo, métrica, fórmula o procedimiento, entorno, muestra, resultado real, criterio de aceptación, evidencia y conclusión. Si una prueba no se ejecutó, debe figurar como pendiente, no como aprobada.

La matriz `ISO-25010-EVIDENCE.md` usa el modelo ISO/IEC 25010:2023: adecuación funcional, eficiencia de desempeño, compatibilidad, capacidad de interacción, fiabilidad, seguridad, mantenibilidad, flexibilidad y seguridad operacional.
