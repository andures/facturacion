# Plan de Desarrollo — facturacion

> Estado: **en progreso**
> Última actualización: 2026-05-22

---

## 1. Visión del Producto

App móvil **Android + iOS + Web** para crear y gestionar facturas de forma completamente **local**. Sin login, sin nube. Todo el dato vive en el dispositivo.

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
| Base de datos local | expo-sqlite (nativo) / in-memory (web) | SDK 56 |
| Archivos | expo-file-system/legacy | SDK 56 |
| Selector de imagen | expo-image-picker | |
| Imágenes UI | expo-image | |
| Listas | LegendList (`@legendapp/list`) | ^2 |
| PDF | expo-print + expo-sharing | SDK 56 |
| Estilos | StyleSheet nativo + theme constants | |
| TypeScript | ~6.0.3 | |
| Build / distribución | EAS Build → APK / IPA | |

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

## 4. Estado de Módulos

### ✅ Ajustes
- [x] Logo del negocio (picker → `documentDirectory` → Zustand)
- [x] Nombre / razón social, RTN/NIF, dirección fiscal
- [x] Prefijo de factura + próximo número
- [x] Botón "Cargar datos de ejemplo" (`resetAndSeed`)
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
- [x] Barra inferior: [Cancelar] · [+] · [Guardar] (sin headers, sin Alert de confirmación)
- [x] Numeración automática (prefijo + año + incremental)

### ✅ Facturas — Detalle
- [x] Documento papel con franja azul superior
- [x] Cabecera empresa + FACTURA + estado
- [x] Tabla de líneas con columnas y filas alternas
- [x] Totales alineados a la derecha
- [x] Botón "Exportar / Compartir PDF" → `expo-print` → share sheet
- [x] Cambiar estado (borrador → enviada → pagada)
- [x] Eliminar factura

### ✅ PDF
- [x] Template HTML profesional (`src/utils/invoice-html.ts`)
  - Franja azul superior, cabecera empresa + FACTURA
  - Tabla con headers, filas alternas, totales
  - Sección notas con borde azul
  - Footer con número y fecha
- [x] Export nativo: `printToFileAsync` → `shareAsync`
- [x] Export web: nueva pestaña → `window.print()`

### ✅ Web (desarrollo)
- [x] In-memory DB en `src/db/index.web.ts` (sin expo-sqlite/WASM)
- [x] Datos mock hondureños precargados
- [x] `src/db/mockData.ts` compartido entre web y native seed

---

## 5. Modelo de Datos (SQLite)

```sql
CREATE TABLE clientes (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL,
  empresa TEXT, email TEXT, telefono TEXT,
  direccion TEXT, created_at INTEGER
);

CREATE TABLE productos (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL,
  descripcion TEXT, precio REAL NOT NULL,
  iva REAL NOT NULL DEFAULT 15,   -- ISV Honduras
  created_at INTEGER
);

CREATE TABLE facturas (
  id TEXT PRIMARY KEY, numero TEXT NOT NULL UNIQUE,
  cliente_id TEXT NOT NULL, fecha INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador',  -- borrador|enviada|pagada
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
```

Totales siempre calculados en runtime — nunca almacenados.

---

## 6. Datos Mock (Honduras)

5 clientes hondureños, 8 productos/servicios con ISV 15%, 5 facturas en distintos estados. Disponibles en `src/db/mockData.ts` y cargables desde Ajustes → "Cargar datos de ejemplo".

---

## 7. Fases

### Fase 0 — Scaffolding ✅
### Fase 1 — Ajustes y DB ✅
### Fase 2 — Clientes y Productos ✅
### Fase 3 — Facturas (lista + crear + detalle) ✅
### Fase 4 — PDF y pulido UI ✅

### Fase 5 — Calidad y distribución 🔲
- [ ] Validaciones completas (precio > 0, cliente seleccionado antes de abrir crear)
- [ ] Empty states con CTA en todas las listas
- [ ] Manejo de errores visible al usuario (toasts o banners, no solo Alert)
- [ ] Probar en dispositivo físico Android
- [ ] EAS Build → APK `preview` para QA
- [ ] EAS Build → APK `production`
- [ ] (Opcional) build iOS / TestFlight

### Fase 6 — Funcionalidades adicionales 🔲
- [ ] Editar factura existente (actualmente solo se puede ver y cambiar estado)
- [ ] Logo del negocio dentro del PDF
- [ ] Buscar / filtrar facturas por cliente o número
- [ ] Buscar clientes y productos en las listas
- [ ] Exportar / importar datos (backup JSON)
- [ ] Backup Supabase (extensión futura)

---

## 8. Convenciones del Proyecto

- **Sin headers de Stack** — todas las pantallas usan `headerShown: false`
- **Sin Alert de confirmación en acciones principales** — guardar es directo; Alert solo para destructivas (eliminar)
- **Moneda**: siempre `L.` — no configurable
- **ISV**: 15% por defecto en productos y en el formulario manual
- **Totales**: calculados en render con `calcInvoiceTotals()`, nunca en DB
- **Estilos**: `gap` entre siblings, `borderCurve: 'continuous'`, `boxShadow` CSS string
- **Listas**: siempre `LegendList`, nunca `ScrollView + .map()`
- **Imágenes**: siempre `expo-image`, nunca RN `Image`
