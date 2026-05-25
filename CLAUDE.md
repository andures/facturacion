# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**facturacion** is a cross-platform invoicing app (Android APK + iOS + Web) built with Expo Router. All data is stored **locally** on the device using SQLite — no login, no cloud (Supabase backup is a future extension). See `docs/development-plan.md` for the full product plan.

## Development Commands

```bash
npm start                          # Start Metro dev server
npm run android                    # Open on Android emulator/device
npm run ios                        # Open on iOS simulator
npm run web                        # Open in browser

eas build --platform android --profile preview   # Build APK for testing
eas build --platform android --profile production # Build production APK
```

## Architecture

### Navigation — 4 bottom tabs
Defined in `app/(tabs)/_layout.tsx` using `Tabs` from `expo-router`:

| Tab | Folder/File | Purpose |
|-----|-------------|---------|
| Clientes | `app/(tabs)/clientes/` | Client list + CRUD |
| Facturas | `app/(tabs)/facturas/` | Invoice list + create/edit |
| Productos | `app/(tabs)/productos/` | Product catalog + CRUD |
| Ajustes | `app/(tabs)/ajustes.tsx` | Logo, business name, invoice prefix |

Each tab folder has its own `_layout.tsx` Stack for sub-navigation (list → detail → form).

### Local Data
- **SQLite** (`expo-sqlite`) — tables: `clientes`, `productos`, `facturas`, `lineas_factura`
- Queries live in `src/db/` — one file per entity
- DB initializes at app startup in `app/_layout.tsx` via `initDb()`
- **Invoice totals are always computed at runtime** — never stored in the DB
- **Zustand + AsyncStorage** (`src/store/settings.ts`) — logo path, business name, invoice prefix, next number

### Logo / Image
- `expo-image-picker` — lets user pick from gallery
- `expo-file-system` — copies to `documentDirectory/logo.jpg`
- Path stored in Zustand settings store
- Rendered with `expo-image` in invoice header

### Shared Utilities (`src/utils/`)
- `totals.ts` — `calcInvoiceTotals(lines)` returns `{ subtotal, vat, total }`
- `invoice-number.ts` — `generateInvoiceNumber(prefix, nextNumber)` → `"F-2026-001"`

## Code Rules

**Rendering safety**
- Never `{value && <Comp />}` when `value` can be `0` or `""` — use ternary or `!!value`
- All string literals inside `<View>` must be wrapped in `<Text>`

**Lists** — Always `LegendList` from `@legendapp/list`, never `ScrollView` with `.map()`

**Images** — Always `expo-image`, never RN `Image`

**Animations** — Only `transform` and `opacity` (GPU); `.get()/.set()` on shared values

**State** — Derive totals in render; dispatch updater `setState(prev => ...)` when state depends on current value

**Styling** — `gap` between siblings; `borderCurve: 'continuous'` with `borderRadius`; `boxShadow` CSS string for shadows

**Imports** — UI primitives from `src/components/` (re-exports), not directly from `react-native`

## Agent Skills

- `.agents/skills/vercel-react-native-skills/AGENTS.md` — 35+ rules with code examples
- `.agents/skills/react-native-best-practices/SKILL.md` — FPS, TTI, bundle, memory
