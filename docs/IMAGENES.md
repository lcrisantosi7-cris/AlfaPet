# Imágenes — rutas exactas

Coloca los archivos con estos nombres (si falta alguno, el sistema muestra un reemplazo y no se rompe):

public/images/brand/logo-alfapet.png          Logo circular (sidebar)
public/images/hero/hero-mascotas.png          Perro y gato del banner (PNG con fondo transparente)
public/images/avatars/dra-ana-torres.jpg      Foto de la usuaria
public/images/pets/luna.jpg
public/images/pets/max.jpg
public/images/pets/toby.jpg
public/images/pets/mia.jpg
public/images/pets/rocky.jpg

Para cambiar una ruta: `app/modules/dashboard/model/dashboard.repository.server.ts` (mascotas),
`app/core/layout/BrandLogo.tsx` (logo), `app/modules/dashboard/view/WelcomeBanner.tsx` (banner),
`app/modules/auth/controller/session.controller.server.ts` (usuaria).
