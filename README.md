# 🎓 Portfolio Académico — Ing. de Sistemas

Portafolio web con **Unidades + Semanas**, login/register, roles de **admin** y **user**, subida de imágenes y archivos (PDF, Word, etc.).

---

## 🗂️ Estructura del proyecto

```
portfolio/
├── index.html              ← Página de Login / Register
├── pages/
│   └── dashboard.html      ← Dashboard principal
├── css/
│   └── style.css           ← Estilos
├── js/
│   ├── supabase-config.js  ← ⚠️ Aquí van tus claves
│   ├── auth.js             ← Lógica de login/register
│   └── dashboard.js        ← Lógica del dashboard
└── supabase-setup.sql      ← SQL para configurar la BD
```

---

## ⚙️ Configuración paso a paso

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Pon un nombre, contraseña y región (puede ser US East)
3. Espera que termine de crear

### 2. Configurar la base de datos
1. En Supabase → **SQL Editor**
2. Copia todo el contenido de `supabase-setup.sql`
3. Pégalo y haz clic en **Run**

### 3. Crear bucket de Storage
1. En Supabase → **Storage** → **New Bucket**
2. Nombre: `portfolio-files`
3. Activar **Public bucket** ✅
4. Haz clic en **Save**

### 4. Agregar tus claves en el proyecto
1. En Supabase → **Settings** → **API**
2. Copia la **Project URL** y la **anon public** key
3. Abre el archivo `js/supabase-config.js` y reemplaza:

```javascript
const SUPABASE_URL = 'https://TU-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';
```

### 5. Subir a GitHub Pages
1. Crea un repositorio en GitHub (puede ser público)
2. Sube todos los archivos
3. Ve a **Settings** → **Pages**
4. Source: `main` branch → **Save**
5. Tu sitio estará en: `https://tu-usuario.github.io/nombre-repo/`

### 6. Hacerte admin
1. Primero **regístrate** con tu correo en la página
2. En Supabase → **Table Editor** → tabla `profiles`
3. Busca tu usuario y cambia `role` de `user` a `admin`
4. ¡Listo! Ya tienes acceso al panel de administración

---

## 🚀 Funcionalidades

| Función | User | Admin |
|---------|------|-------|
| Ver unidades | ✅ | ✅ |
| Ver semanas | ✅ | ✅ |
| Ver descripción e imagen | ✅ | ✅ |
| Descargar archivos | ✅ | ✅ |
| Crear unidades | ❌ | ✅ |
| Publicar semanas | ❌ | ✅ |
| Subir imágenes y archivos | ❌ | ✅ |
| Eliminar contenido | ❌ | ✅ |
| Gestionar roles de usuarios | ❌ | ✅ |

---

## 📝 Notas
- Los archivos soportados son: PDF, Word (.doc/.docx), PowerPoint, Excel, ZIP, TXT
- La imagen de portada es opcional por semana
- Puedes desactivar la verificación de email en Supabase → Auth → Settings → "Enable email confirmations" → OFF (más fácil para pruebas)
