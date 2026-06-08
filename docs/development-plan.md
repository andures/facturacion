# Plan de Desarrollo — facturacion

> Estado: **en progreso**
> Última actualización: 2026-05-25

---

## 1. Visión del Producto

App **Android + iOS + Web** para crear y gestionar facturas. En nativo los datos viven en SQLite local; en web se persisten en **Supabase** (sin login, anon key). La web se despliega en **Render** como SPA con PWA instalable.

El usuario puede:
- Mantener una lista de clientes con historial de facturas
- Mantener un catálogo de productos/servicios con precios
- Crear facturas con vista previa de hoja de papel en tiempo real
- Exportar facturas como PDF profesional y compartirlas
- Personalizar con su logo y datos del negocio
- Moneda: **Lempiras (L.)** — ISV **15%** (Honduras)

---

## 2. Stack Técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Expo SDK managed | ~56.0.3 |
| React Native | | 0.85.3 |
| Navegación | expo-router | v5 |
| Estado global | Zustand + AsyncStorage persist | ^5 |
| DB nativa | expo-sqlite | SDK 56 |
| DB web | Supabase JS (`@supabase/supabase-js`) | ^2 |
| Hosting web | Render (static site) | — |
| PWA | manifest.json + service worker | — |
| Archivos | expo-file-system/legacy | SDK 56 |
| Selector imagen | expo-image-picker | SDK 56 |
| Imágenes UI | expo-image | SDK 56 |
| Listas | LegendList (`@legendapp/list`) | ^2 |
| PDF | expo-print + expo-sharing | SDK 56 |
| Estilos | StyleSheet nativo + theme constants | — |
| TypeScript | ~6.0.3 | — |
| Build nativo | EAS Build → APK / IPA | — |

---

## 3. Navegación

Tab bar flotante personalizado (pill indicator, `position: absolute`).

| Tab | Ícono activo | Función |
|-----|-------------|---------|
| Clientes | `person.2.fill` | Lista + perfil con historial de facturas |
| Facturas | `doc.text.fill` | Lista + crear + detalle/PDF |
| Productos | `shippingbox.fill` | Catálogo + CRUD |
| Ajustes | `gearshape.fill` | Logo, datos empresa, prefijo factura |

---

## 4. Arquitectura Web (Supabase)

- `src/db/index.web.ts` — implementación `IDb` con cache in-memory + writes fire-and-forget a Supabase
- `src/db/settings-web.ts` — carga y sincroniza settings desde/hacia Supabase con debounce 600ms
- `src/utils/supabase.ts` — cliente Supabase con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY`
- `initDb()` carga todas las tablas de Supabase al inicio; lecturas son síncronas desde cache
- Settings se cargan de Supabase al iniciar y se sincronizan en cada cambio
- Logo en web se guarda como base64 en Supabase (no en AsyncStorage)

### Tablas Supabase
- `clientes`, `productos`, `facturas`, `lineas_factura` — misma estructura que SQLite
- `settings` — fila única `id='default'` con datos del negocio y logo

---

## 5. Estado de Módulos

### ✅ Ajustes
- [x] Logo del negocio — nativo: file system; web: base64 en Supabase
- [x] Nombre / razón social, RTN/NIF, dirección fiscal
- [x] Prefijo de factura + próximo número
- [x] Sincronización con Supabase (web)
- [x] Moneda fija: L. (Lempiras)

### ✅ Clientes
- [x] Lista con avatares de iniciales (6 paletas de color)
- [x] Crear / editar / eliminar cliente
- [x] Perfil del cliente con sus facturas filtradas por estado
- [x] Botón "＋ Nueva factura" desde el perfil

### ✅ Productos
- [x] Lista con precio destacado
- [x] Crear / editar / eliminar producto
- [x] ISV por producto (default 15%)

### ✅ Facturas — Lista
- [x] Cards con franja de color por estado (borrador / enviada / pagada)
- [x] Chips de filtro por estado
- [x] Total calculado en runtime

### ✅ Facturas — Crear
- [x] Vista previa de hoja de papel en tiempo real
- [x] Agregar líneas desde catálogo o manual
- [x] Tabla con columnas: Descripción / Cant. / Precio / ISV / Total
- [x] Subtotal + ISV + Total en vivo
- [x] Notas
- [x] Barra inferior: [Cancelar] · [+] · [Guardar]
- [x] Numeración automática (prefijo + año + incremental)

### ✅ Facturas — Detalle
- [x] Documento papel con franja azul superior
- [x] Cabecera empresa + FACTURA + estado
- [x] Tabla de líneas con columnas y filas alternas
- [x] Totales alineados a la derecha
- [x] Botón "Exportar / Compartir PDF"
- [x] Cambiar estado (borrador → enviada → pagada)
- [x] Eliminar factura

### ✅ PDF
- [x] Template HTML profesional (`src/utils/invoice-html.ts`)
- [x] Export nativo: `printToFileAsync` → `shareAsync`
- [x] Export web: nueva pestaña → `window.print()`

### ✅ Web / PWA
- [x] Deploy en Render (static site, SPA mode)
- [x] PWA instalable — manifest + service worker
- [x] Service worker: network-first, fallback a cache
- [x] apple-touch-icon 180px para iOS Safari
- [x] Iconos 192px y 512px para Android/Chrome
- [x] Redirect raíz `/` → `/clientes`
- [x] Rewrite `/*` → `/index.html` (SPA routing)

---

## 6. Modelo de Datos (SQLite / Supabase)

```sql
CREATE TABLE clientes (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL,
  empresa TEXT, email TEXT, telefono TEXT,
  direccion TEXT, created_at INTEGER
);

CREATE TABLE productos (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL,
  descripcion TEXT, precio REAL NOT NULL,
  iva REAL NOT NULL DEFAULT 15,
  created_at INTEGER
);

CREATE TABLE facturas (
  id TEXT PRIMARY KEY, numero TEXT NOT NULL UNIQUE,
  cliente_id TEXT NOT NULL, fecha INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador',
  notas TEXT, created_at INTEGER,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE lineas_factura (
  id TEXT PRIMARY KEY, factura_id TEXT NOT NULL,
  descripcion TEXT NOT NULL, precio REAL NOT NULL,
  cantidad REAL NOT NULL DEFAULT 1,
  iva REAL NOT NULL DEFAULT 15,
  orden INTEGER,
  FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  business_name TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  invoice_prefix TEXT NOT NULL DEFAULT 'F-',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  logo_data TEXT
);
```

Totales siempre calculados en runtime — nunca almacenados.

---

## 7. Fases

### Fase 0 — Scaffolding ✅
### Fase 1 — Ajustes y DB ✅
### Fase 2 — Clientes y Productos ✅
### Fase 3 — Facturas (lista + crear + detalle) ✅
### Fase 4 — PDF y pulido UI ✅
### Fase 5 — Web + Supabase + PWA ✅
- [x] Backend Supabase para web (in-memory cache + writes async)
- [x] Settings sincronizados con Supabase
- [x] Deploy Render con SPA routing
- [x] PWA instalable (manifest, SW, iconos)
- [x] Íconos de app nuevos (factura + sello)

### Fase 6 — Estabilidad y bugs críticos 🔲
- [ ] `withTransactionSync` sin atomicidad: lineas pueden llegar a Supabase antes que la factura — implementar insert secuencial o batch
- [ ] `incrementInvoiceNumber` se ejecuta aunque el save falle silenciosamente — mover dentro del callback de éxito o validar
- [ ] Errores de Supabase (`_sb`) solo logueados — mostrar toast/banner al usuario cuando falla un write
- [ ] Debounce de settings sync puede perderse al cerrar tab — usar `beforeunload` o flush inmediato para `nextInvoiceNumber`
- [ ] Editar factura existente (actualmente solo se puede ver y cambiar estado)
- [ ] Logo del negocio dentro del PDF

### Fase 7 — Funcionalidades adicionales 🔲
- [ ] Buscar / filtrar facturas por cliente o número
- [ ] Buscar clientes y productos en las listas
- [ ] Validaciones completas (precio > 0, cliente seleccionado)
- [ ] Empty states con CTA en todas las listas
- [ ] Exportar / importar datos (backup JSON)
- [ ] EAS Build → APK `preview` para QA
- [ ] EAS Build → APK `production`
- [ ] (Opcional) build iOS / TestFlight

---

## 8. Convenciones del Proyecto

- **Sin headers de Stack** — todas las pantallas usan `headerShown: false`
- **Sin Alert en acciones principales** — guardar es directo; Alert solo para destructivas (eliminar)
- **Moneda**: siempre `L.` — no configurable
- **ISV**: 15% por defecto
- **Totales**: calculados en render con `calcInvoiceTotals()`, nunca en DB
- **Estilos**: `gap` entre siblings, `borderCurve: 'continuous'`, `boxShadow` CSS string
- **Listas**: siempre `LegendList`, nunca `ScrollView + .map()`
- **Imágenes**: siempre `expo-image`, nunca RN `Image`
- **Web logo**: base64 data URL guardado solo en Supabase (no en AsyncStorage)
- **Nativo logo**: file path en `documentDirectory`, persisted en AsyncStorage
