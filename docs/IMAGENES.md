# Catálogo de imágenes de AlfaPet

La interfaz debe funcionar aunque falte una imagen: usa `SmartImage` o un fallback visual y nunca dependas de imágenes externas para datos clínicos.

## Archivos recomendados

| Prioridad | Archivo exacto | Uso | Especificación recomendada | Obligatoria |
|---|---|---|---|---|
| Alta | `public/images/brand/logo-alfapet.png` | Logo de sidebar, login y cabecera | PNG transparente, 512×512 px, versión clara y oscura si aplica | Sí, identidad |
| Alta | `public/images/hero/hero-mascotas.png` | Banner de Inicio | Perro y gato juntos, recorte horizontal, fondo transparente, 900×650 px | No, debe existir fallback |
| Media | `public/images/avatars/admin.jpg` | Avatar de administrador de ejemplo o perfil con foto autorizada | JPG/WEBP cuadrado, 256×256 px | No |
| Media | `public/images/pets/luna.jpg` | Mascota de muestra para capturas de presentación | JPG/WEBP cuadrado, 512×512 px | No |
| Media | `public/images/pets/max.jpg` | Mascota de muestra para capturas de presentación | JPG/WEBP cuadrado, 512×512 px | No |
| Media | `public/images/pets/toby.jpg` | Mascota de muestra para capturas de presentación | JPG/WEBP cuadrado, 512×512 px | No |
| Media | `public/images/pets/mia.jpg` | Mascota de muestra para capturas de presentación | JPG/WEBP cuadrado, 512×512 px | No |
| Media | `public/images/pets/rocky.jpg` | Mascota de muestra para capturas de presentación | JPG/WEBP cuadrado, 512×512 px | No |
| Baja | `public/images/illustrations/empty-patients.svg` | Estado vacío de pacientes | SVG simple, colores de marca | No |
| Baja | `public/images/illustrations/empty-calendar.svg` | Estado vacío de citas | SVG simple, colores de marca | No |
| Baja | `public/images/illustrations/empty-inventory.svg` | Estado vacío de inventario | SVG simple, colores de marca | No |

## Consideraciones

- El repositorio actualmente contiene `public/images/brand/logo-alfapet.jpeg`; si se mantiene ese archivo, actualiza `BrandLogo.tsx` para apuntar a él o agrega el PNG indicado en la tabla.
- Las imágenes de mascotas de ejemplo deben ser ilustrativas, no aparentar ser registros reales de pacientes.
- No incluir nombres, teléfonos, historias clínicas ni fotografías de clientes reales en imágenes de demostración.
- Para fotos reales de pacientes, utiliza una URL de almacenamiento autorizada en Supabase Storage y controla acceso mediante políticas; no las incrustes en el código fuente.
- No se necesitan imágenes para reportes, configuración, vacunas ni productos: tablas, iconos vectoriales y gráficos deben renderizarse con datos de Supabase.
- Las imágenes faltantes nunca deben impedir que la ruta cargue.

## Rutas del código relacionadas

- Logo: `app/core/layout/BrandLogo.tsx`
- Banner de Inicio: `app/modules/dashboard/view/WelcomeBanner.tsx`
- Tarjetas de mascotas: `app/modules/dashboard/view/RecentPatientsCard.tsx`
- Fallback de imagen: `app/core/ui/SmartImage.tsx`
