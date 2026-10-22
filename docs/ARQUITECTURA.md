# Alfapet — Arquitectura

## Capas (MVC por módulo)

Cada funcionalidad vive en `app/modules/<modulo>/` con tres capas y un archivo "pegamento":

| Capa | Carpeta / archivo | Responsabilidad |
|---|---|---|
| Modelo | `model/*.types.ts`, `model/*.repository.server.ts` | Tipos y acceso a datos (hoy mock, luego Supabase) |
| Controlador | `controller/*.controller.server.ts` | `loader` / `action`: valida sesión, rol y entrada; llama al modelo |
| Vista | `view/*.tsx` | Componentes que solo reciben props y pintan |
| Ruta | `<modulo>.route.tsx` | Conecta controlador y vista (≤ 15 líneas) |

Reglas:
- Una vista nunca importa un `.server.ts`. Un modelo nunca importa una vista.
- Ningún archivo supera ~120 líneas. Si crece, se divide en componentes.
- Todo lo reutilizable va a `app/core/` (ui, layout, theme, security, lib, config).

## Estructura

```
app/
  core/
    config/navigation.ts      Menú + roles (fuente única de verdad)
    layout/                   AppShell, Sidebar, Topbar, ThemeToggle, BrandLogo
    ui/                       Card, Avatar, Badge, StatCard, charts/
    theme/                    Modo claro/oscuro (cookie en servidor)
    security/                 Headers HTTP, defensa CSRF
    lib/                      cn(), format
  modules/
    auth/                     Usuario y sesión (mock → Supabase Auth)
    dashboard/                Pantalla Inicio
    placeholder/              Pantalla provisional de módulos futuros
  routes/                     Solo layouts y recursos (app-layout, theme)
  routes.ts                   Rutas generadas desde navigation.ts
```

## Cómo agregar un módulo (ej. Pacientes)

1. Crear `app/modules/pacientes/{model,controller,view}/`.
2. Crear `pacientes.route.tsx` (loader del controlador + componente de la vista).
3. En `app/routes.ts`: agregar `"pacientes"` a `BUILT_MODULES` y
   `route("pacientes", "modules/pacientes/pacientes.route.tsx")` dentro del layout.

## Diseño y modo claro/oscuro

- Los colores NO se escriben en los componentes. Se usan tokens semánticos
  (`bg-surface`, `text-ink`, `border-line`, `bg-brand`…) definidos en `app/app.css`.
- Modo claro y oscuro = dos bloques de variables (`:root` y `.dark`). Cambiar la
  identidad visual = editar solo ese archivo.
- El tema se guarda en una cookie leída por el servidor: no hay parpadeo al cargar.

## ISO/IEC 25010 — cómo se cubre cada característica

| Característica | Decisión en el código |
|---|---|
| Adecuación funcional | Módulos por dominio clínico alineados al menú (pacientes, citas, consultas, historial, vacunas…) |
| Eficiencia de desempeño | Gráficos en CSS/SVG sin librerías; imágenes `lazy`; CSS único con Tailwind |
| Compatibilidad | Estándares web; SSR con React Router; Supabase aislado tras repositorios |
| Usabilidad | Responsive, navegación por teclado, "saltar al contenido", foco visible, `prefers-reduced-motion`, etiquetas ARIA |
| Fiabilidad | `ErrorBoundary` global, 404 controlado, fallback de imágenes faltantes |
| Seguridad | Roles en `navigation.ts`, headers HTTP (CSP, HSTS, X-Frame-Options…), CSRF en acciones, cookies `HttpOnly`/`SameSite`, validación con lista blanca |
| Mantenibilidad | MVC modular, archivos cortos, tokens de diseño, tipos estrictos, un solo lugar por cambio |
| Portabilidad | Dockerfile del template, sin dependencias de SO, variables por entorno |

## Seguridad — pendiente para la fase de backend

- [ ] Supabase Auth: sesión validada en servidor (`session.controller.server.ts`)
- [ ] `requireRole()` en cada loader/action (no basta ocultar el menú)
- [ ] Row Level Security en todas las tablas
- [ ] Validación de formularios con Zod en cada `action`
- [ ] CSP con nonce (quitar `'unsafe-inline'` de `script-src`)
- [ ] Limitar intentos de login y registrar auditoría de accesos a historiales clínicos
- [ ] Variables secretas solo en `.env` (nunca `VITE_` para claves privadas)
- [ ] Servir siempre por HTTPS (las cookies son `Secure` en producción)
