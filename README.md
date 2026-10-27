# AlfaPet — sistema de gestión veterinaria

AlfaPet es una aplicación web para la gestión asistencial y operativa de una clínica veterinaria. Permite administrar propietarios, pacientes, citas, atención clínica, historial, vacunas, cirugías, análisis, internamiento, productos, ventas, caja, reportes y personal.

El proyecto fue desarrollado para el trabajo académico **“Sistema de gestión asistencial veterinaria bajo estándares de calidad ISO/IEC 25010 para optimizar la estabilidad operativa, Sullana 2026”**.

> **Alcance de calidad.** El sistema implementa controles y evidencias alineados con ISO/IEC 25010. La norma se utiliza como modelo de evaluación de calidad del producto; este repositorio no constituye una certificación externa de conformidad ISO.

## Aplicación publicada

- **Producción:** <https://alfapet.vercel.app/>
- **Acceso:** exclusivo para usuarios registrados en Supabase Auth.
- **Base de datos:** PostgreSQL administrado mediante Supabase.

## Objetivo del sistema

Centralizar la información de la clínica veterinaria en una única aplicación, reducir errores de registro, controlar el acceso según el rol del usuario, mantener la trazabilidad de operaciones relevantes y proteger la integridad de la agenda y de los datos clínicos.

## Tecnologías

### Aplicación

- React 19.
- TypeScript 5.9.
- React Router 8 con renderizado del servidor (SSR).
- Vite 8.
- Tailwind CSS 4.
- Lucide React para iconografía.
- Zod para validación de entradas.
- Node.js 22.18 o superior.

### Datos, autenticación y seguridad

- Supabase Auth para autenticación.
- PostgreSQL como motor de base de datos.
- Supabase SSR para manejo de sesión en servidor.
- Row Level Security (RLS) para autorización por rol.
- Funciones RPC y funciones SQL para operaciones transaccionales.
- Restricciones PostgreSQL para integridad y prevención de solapamientos.
- Registro de auditoría de operaciones relevantes.

### Pruebas y calidad

- Vitest para pruebas unitarias.
- TypeScript para comprobación estática.
- Build de producción con React Router/Vite.
- Pruebas SQL con pgTAP mediante Supabase CLI.
- Diagnósticos SQL para esquema, RLS, roles e integridad.

### Despliegue

- Vercel para la aplicación web.
- Supabase para autenticación y base de datos.

## Roles y permisos

El sistema utiliza tres roles principales:

| Rol | Responsabilidades principales |
|---|---|
| **Administrador** | Gestiona usuarios, roles, catálogos, productos, tarifas, reportes, ventas y configuración general. Puede acceder a la información completa del sistema. |
| **Veterinario** | Atiende citas asignadas, registra consultas, diagnósticos, tratamientos, vacunas, cirugías, análisis, internamientos e historial clínico. No administra usuarios ni caja. |
| **Recepción** | Registra propietarios y pacientes, agenda y actualiza citas, consulta información operativa, gestiona productos, stock y ventas. No registra información clínica restringida. |

La interfaz oculta las opciones no permitidas para cada rol y los controladores del servidor vuelven a validar los permisos. La seguridad no depende únicamente de ocultar elementos visuales.

## Funcionalidades principales implementadas

### Autenticación y perfiles

- Inicio y cierre de sesión con Supabase Auth.
- Validación de cuenta activa.
- Perfiles con nombre, cargo, rol y estado.
- Gestión administrativa de usuarios.
- Activación y desactivación de cuentas.
- Protección de rutas según rol.

### Propietarios y pacientes

- Registro de propietarios y mascotas.
- Asociación entre propietario y paciente.
- Datos de especie, raza, sexo, fecha de nacimiento, peso y microchip.
- Búsqueda por mascota, propietario, DNI, teléfono o microchip.
- Actualización de fichas.
- Registro de peso y evolución.
- Control de pacientes activos, inactivos y fallecidos.
- Prevención de duplicados de propietarios por documento normalizado.

### Citas y agenda

- Registro de citas futuras.
- Asociación con paciente, tipo de atención y veterinario.
- Consulta y filtrado de agenda.
- Asignación de citas pendientes por el veterinario.
- Actualización de estados: pendiente, confirmada, completada y cancelada.
- Restricción de acciones según el rol.
- Prevención de solapamiento de horarios del mismo veterinario.
- Prevención de solapamiento de horarios del mismo paciente.
- Protección a nivel de base de datos para escenarios concurrentes.

### Atención clínica

- Registro y actualización de consultas.
- Síntomas, diagnóstico, tratamiento, peso, temperatura y notas.
- Historial clínico por paciente.
- Registro y seguimiento de vacunas.
- Gestión de cirugías.
- Gestión de órdenes y resultados de análisis.
- Gestión de internamientos y notas clínicas.
- Asociación de las operaciones clínicas con el usuario responsable.

### Productos, stock, ventas y caja

- Catálogo de productos, servicios y categorías.
- Clasificación de productos de farmacia y otros tipos.
- Control de stock y stock mínimo.
- Registro de movimientos de inventario.
- Registro de ventas mediante funciones transaccionales.
- Validación de productos que requieren receta.
- Métodos de pago y canales de venta.
- Anulación de ventas por administración con motivo obligatorio.
- Consulta del historial comercial.

### Reportes y administración

- Indicadores del funcionamiento de la clínica.
- Reportes de ventas, citas, consultas, pacientes, vacunas, productos e internamientos.
- Gestión de usuarios y roles.
- Configuración del perfil propio.
- Auditoría de operaciones relevantes en datos clínicos y comerciales.

## Requisitos funcionales principales

| Código | Requisito | Estado |
|---|---|---|
| RF-01 | Autenticar usuarios mediante correo y contraseña | Implementado |
| RF-02 | Gestionar perfiles, roles y estado de acceso | Implementado |
| RF-03 | Registrar propietarios y pacientes | Implementado |
| RF-04 | Consultar y actualizar fichas de pacientes | Implementado |
| RF-05 | Registrar, consultar y actualizar citas | Implementado |
| RF-06 | Evitar citas solapadas para pacientes y veterinarios | Implementado en PostgreSQL |
| RF-07 | Registrar consultas y datos clínicos | Implementado |
| RF-08 | Consultar historial clínico | Implementado |
| RF-09 | Registrar vacunas | Implementado |
| RF-10 | Gestionar cirugías, análisis e internamientos | Implementado |
| RF-11 | Gestionar productos y movimientos de stock | Implementado |
| RF-12 | Registrar ventas y controlar caja | Implementado |
| RF-13 | Generar reportes operativos | Implementado |
| RF-14 | Aplicar permisos diferenciados por rol | Implementado en servidor y RLS |
| RF-15 | Registrar auditoría de operaciones relevantes | Implementado mediante triggers |

## Requisitos no funcionales y alineación con ISO/IEC 25010

La evaluación se organiza usando el modelo de calidad de producto de ISO/IEC 25010:2023.

| Característica | Aplicación en AlfaPet | Evidencia o mecanismo |
|---|---|---|
| **Adecuación funcional** | Los módulos cubren los procesos de pacientes, citas, clínica, inventario, ventas, reportes y personal. | Rutas funcionales, controladores, validaciones y pruebas de aplicación. |
| **Eficiencia del desempeño** | Las consultas aplican límites, filtros, ordenamiento y llamadas RPC para operaciones agregadas. | Consultas paginadas o limitadas, índices y mediciones de carga en el entorno desplegado. |
| **Compatibilidad** | La aplicación se integra con Supabase mediante API y funciona como aplicación web desplegada en Vercel. | Configuración de producción, variables separadas y pruebas en navegadores compatibles. |
| **Capacidad de interacción** | Formularios con mensajes de validación, estados de operación, navegación por rol, diseño responsive y etiquetas accesibles. | Componentes React, mensajes `role=status`/`role=alert`, navegación y pruebas manuales. |
| **Fiabilidad** | Se protegen operaciones críticas mediante validación, restricciones SQL, transacciones y controles de concurrencia. | Pruebas unitarias, pruebas SQL, restricciones de exclusión y manejo de errores. |
| **Seguridad** | Se utiliza Supabase Auth, sesiones SSR, RLS, autorización en servidor, protección de origen, CSP y separación de claves. | Migraciones de políticas RLS, funciones de autorización, cabeceras y reglas de seguridad. |
| **Mantenibilidad** | El código está separado por módulos, controladores, repositorios, modelos y vistas. | TypeScript, tipado estático, estructura modular, documentación y pruebas. |
| **Flexibilidad** | Las variables de entorno y migraciones permiten configurar el sistema para distintos entornos. | `.env.example`, migraciones versionadas y configuración de Supabase/Vercel. |
| **Seguridad operacional** | Las operaciones sensibles se validan en servidor y se registran mediante auditoría. | `audit_log`, triggers, RLS, mensajes de error y procedimientos de despliegue. |

La matriz detallada se encuentra en [quality/ISO-25010-EVIDENCE.md](quality/ISO-25010-EVIDENCE.md) y el plan de calidad en [docs/PLAN_CALIDAD_ISO_25010.md](docs/PLAN_CALIDAD_ISO_25010.md).

## Arquitectura

La aplicación utiliza una arquitectura modular por dominio:

```text
app/
├── core/                 # Seguridad, sesión, configuración y componentes compartidos
├── modules/
│   ├── auth/             # Autenticación y perfiles
│   ├── pacientes/        # Propietarios y pacientes
│   ├── citas/            # Agenda y citas
│   ├── consultas/        # Atención clínica
│   ├── historial/        # Historial clínico
│   ├── vacunas/          # Vacunación
│   ├── cirugias/         # Cirugías
│   ├── analisis/         # Órdenes y resultados de laboratorio
│   ├── internamiento/    # Internamientos y notas
│   ├── productos/        # Catálogos e inventario
│   ├── ventas/           # Ventas y caja
│   ├── reportes/         # Indicadores y reportes
│   ├── personal/         # Gestión de usuarios
│   └── admin/            # Administración y configuración
├── routes/               # Layout y rutas globales
└── styles/               # Estilos de la aplicación
```

Cada módulo separa, cuando corresponde, controlador, repositorio/modelo, tipos y vista. Las operaciones críticas se validan en el servidor antes de enviarse a Supabase.

## Estructura de la base de datos

Las migraciones se encuentran en `supabase/migrations/` y se aplican en orden. El esquema incluye, entre otras, las siguientes entidades:

- `profiles`: perfiles, roles y estado de los usuarios.
- `owners`: propietarios.
- `patients`: pacientes veterinarios.
- `appointments`: citas y agenda.
- `consultations`: consultas clínicas.
- `vaccinations`: vacunas aplicadas.
- `surgeries`: cirugías.
- `lab_orders` y `lab_order_items`: órdenes y resultados de análisis.
- `admissions` y `admission_notes`: internamientos y notas.
- `products`, `stock_movements` y `product_categories`: productos e inventario.
- `sales` y `sale_items`: ventas.
- `audit_log`: trazabilidad de operaciones.

La autorización de datos se implementa mediante RLS. Las políticas se aplican para `anon` y `authenticated`, mientras que las funciones administrativas que requieren `service_role` se ejecutan únicamente desde el servidor.

## Requisitos previos

- Node.js 22.18 o superior.
- npm.
- Un proyecto Supabase.
- Supabase CLI para desarrollo local y pruebas SQL.
- Docker Desktop activo si se ejecutan Supabase localmente.
- Una cuenta de Vercel para desplegar la aplicación.

## Instalación local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/lcrisantosi7-cris/AlfaPet.git
   cd AlfaPet
   ```

2. Instala dependencias:

   ```bash
   npm ci
   ```

3. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Completa `.env` con la URL de Supabase y la clave pública. La clave `SUPABASE_SERVICE_ROLE_KEY` solo se utiliza para scripts administrativos locales y nunca debe enviarse al navegador.

5. Para levantar Supabase localmente:

   ```bash
   supabase start
   supabase db reset
   ```

6. Inicia la aplicación:

   ```bash
   npm run dev
   ```

7. Abre la URL mostrada por React Router, normalmente `http://localhost:5173`.

## Creación de usuarios de prueba

Para crear usuarios de desarrollo de los tres roles, completa las variables `TEST_*` en `.env` y ejecuta:

```bash
npm run test-users:create
```

Para crear solamente un administrador:

```bash
npm run admin:create
```

Estos scripts requieren `SUPABASE_SERVICE_ROLE_KEY`, deben ejecutarse solo en un entorno controlado y no deben incluir claves reales en Git.

## Pruebas y comprobaciones

### Pruebas de la aplicación

```bash
npm test
```

### Pruebas con salida detallada

```bash
npm test -- --reporter=verbose
```

### Cobertura

```bash
npm run test:coverage
```

### Comprobación de tipos

```bash
npm run typecheck
```

### Build de producción

```bash
npm run build
```

### Comprobación completa de calidad

```bash
npm run quality
```

El comando `quality` ejecuta las pruebas unitarias, el análisis de tipos y el build de producción.

### Pruebas SQL de Supabase

Con Docker y Supabase local activos:

```bash
supabase db reset
supabase test db
```

Las pruebas SQL se encuentran en `supabase/tests/`. Los diagnósticos de solo lectura están en `supabase/diagnostics/`.

## Despliegue en Vercel

1. Conecta el repositorio de GitHub con Vercel.
2. Configura el proyecto con el framework correspondiente a React Router/Vite.
3. Define las variables de entorno de producción en Vercel.
4. No agregues `SUPABASE_SERVICE_ROLE_KEY` a variables expuestas al cliente.
5. Ejecuta una prueba de inicio de sesión después del despliegue.
6. Verifica rutas, permisos RLS, registro de datos y cierre de sesión.

Después de modificar migraciones SQL, aplica los cambios al proyecto Supabase de destino siguiendo el procedimiento de migraciones del proyecto. No ejecutes migraciones destructivas directamente sobre producción sin respaldo y validación previa.

## Evidencias de calidad

- [Plan de calidad ISO/IEC 25010](docs/PLAN_CALIDAD_ISO_25010.md)
- [Matriz de evidencias ISO/IEC 25010](quality/ISO-25010-EVIDENCE.md)
- [Guía de calidad y ejecución](quality/README.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Prueba estructural de integridad y RLS](supabase/tests/quality_integrity.test.sql)
- [Diagnóstico de esquema](supabase/diagnostics/audit-schema-readonly.sql)
- [Diagnóstico de RLS](supabase/diagnostics/verify-rls.sql)
- [Diagnóstico de roles](supabase/diagnostics/verify-roles.sql)

Las pruebas manuales por rol, compatibilidad entre navegadores, rendimiento y restauración deben conservar sus resultados reales como anexos del informe académico. No deben reemplazarse por valores estimados.

## Seguridad

- No subas `.env`, contraseñas, tokens ni claves de Supabase.
- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en código de cliente.
- Mantén RLS habilitado en las tablas públicas.
- Ejecuta autorización en servidor además de ocultar opciones en la interfaz.
- Revoca o rota cualquier credencial que haya sido publicada accidentalmente.
- Utiliza datos ficticios para pruebas.
- Realiza respaldo antes de aplicar cambios importantes en la base de datos.

## Contribución y control de cambios

Antes de enviar cambios:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Las migraciones SQL deben ser versionadas, revisables e idempotentes cuando sea posible. Los cambios de permisos, restricciones y funciones deben acompañarse con pruebas o diagnósticos reproducibles.

## Licencia

Proyecto académico de AlfaPet. El uso, distribución y publicación del código quedan sujetos a la autorización de sus autores.
