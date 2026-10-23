# AlfaPet — plan de implementación y calidad

## Contexto del proyecto
Título del documento académico: “Sistema de gestión asistencial veterinaria bajo estándares de calidad ISO 25010 para optimizar la estabilidad operativa, Sullana 2026”. El problema descrito incluye inestabilidad operativa, posible pérdida o inconsistencia de historias clínicas, cruces de citas y ausencia de pruebas automatizadas. La aplicación usa React, TypeScript, React Router, Tailwind CSS y Supabase.

## Módulos objetivo
- Inicio: indicadores y agenda obtenidos de datos reales.
- Pacientes y propietarios: registro, búsqueda, detalle y relación con el propietario.
- Citas: calendario, asignación de veterinario y control transaccional de solapamientos.
- Consultas e historial: signos clínicos, diagnóstico, tratamiento y consultas previas.
- Vacunación: vacunas aplicadas, lote y próximas fechas.
- Productos e inventario: catálogo, stock mínimo y movimientos auditables.
- Reportes: actividad, citas, pacientes y existencias.
- Configuración: usuarios, roles y catálogos.

## ISO/IEC 25010: evaluación propuesta
No declarar conformidad ni resultados de pruebas sin ejecutarlos. Definir línea base, método, muestra, entorno y evidencia de cada medición.

| Característica | Verificación propuesta | Evidencia |
|---|---|---|
| Adecuación funcional | Casos de registro, búsqueda, citas e historia clínica | Casos de prueba y resultados |
| Eficiencia de desempeño | Medir latencia p50/p95 y consultas bajo carga representativa | Informe de carga |
| Compatibilidad | Verificar navegadores objetivo y contratos con Supabase | Matriz de compatibilidad |
| Capacidad de interacción | Teclado, etiquetas, errores comprensibles y diseño adaptable | Lista de comprobación |
| Fiabilidad | Operaciones concurrentes e integridad tras fallos | Logs y pruebas de concurrencia |
| Seguridad | RLS, autorización por rol, validación en servidor y secretos | Pruebas negativas de permisos |
| Mantenibilidad | TypeScript, módulos separados, typecheck y pruebas automatizadas | CI y cobertura medida |
| Flexibilidad | Variables de entorno y configuración por ambiente | Prueba de despliegue |
| Seguridad operacional | Copias de seguridad y procedimiento de recuperación | Evidencia de restauración |

Los objetivos numéricos (latencia, cobertura y tasa de éxito) deben acordarse y medirse; no presentar valores hipotéticos como resultados.

## Migración de registro
`supabase/migrations/202610220001_patient_transactions.sql` añade las RPC utilizadas por el repositorio de pacientes. Revisar los enums reales y las políticas RLS en el proyecto Supabase antes de ejecutarla en un entorno de prueba. La función de registro crea el propietario y el paciente en una misma transacción; la validación del servidor y las políticas de base de datos siguen siendo necesarias.

## Comandos
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`

## Seguridad
No guardar credenciales reales, contraseñas ni claves de Supabase en Git. Mantener secretos solo en variables de entorno del servidor y rotar cualquier secreto que se haya publicado. La clave anon/publishable solo es aceptable en el cliente con RLS correctamente configurado; la service-role nunca debe exponerse al navegador. Los ejemplos de entorno contienen únicamente marcadores.
