# 📚 Documentación Técnica: Smilbot Backend

Bienvenido a la documentación oficial del backend de **Smilbot**. Este espacio reúne las especificaciones funcionales, diagramas de arquitectura, modelos de base de datos y referencias de endpoints del sistema.

---

## 🗺️ Mapa de Documentación

```text
docs/
├── README.md                          <-- 📖 Estás aquí (Índice general)
├── features/                          <-- 🚀 Especificaciones por Funcionalidad
│   ├── cartas-y-gacha.md              <-- Catálogo de cartas, rarezas y probabilidades de tirada
│   ├── usuarios-y-economia.md         <-- Cuentas, balances, dailyBalance e inventario
│   ├── mercado-p2p.md                 <-- Sistema de compra/venta de cartas entre jugadores por servidor
│   └── telemetria-y-ledger.md         <-- Libro de transacciones, rachas, leaderboards y telemetría
└── architecture/                      <-- 🏗️ Decisiones y Patrones de Arquitectura
    └── image-hosting.md               <-- Patrón Provider para imágenes (Local, Cloudinary, Supabase)
```

---

## 🚀 Módulos y Features

| Documento | Descripción Principal |
| :--- | :--- |
| 🎴 [**Cartas y Gacha**](./features/cartas-y-gacha.md) | Sistema de 5 rarezas, probabilidades de tirada ($roll \in [0, 999]$), catálogo y subida de cartas. |
| 👤 [**Usuarios y Economía**](./features/usuarios-y-economia.md) | Manejo de balances, cooldown y rachas de `dailyBalance` (23h a 48h), inventario y estadísticas de perfil. |
| 🛒 [**Mercado P2P**](./features/mercado-p2p.md) | Mercado por servidor de Discord con estados de oferta (`ACTIVE`, `SOLD`, `CANCELLED`) y escrow de cartas. |
| 📋 [**Telemetría y Ledger**](./features/telemetria-y-ledger.md) | Auditoría inmutable de transacciones, histórico de movimientos, leaderboards y snapshot de migración. |
| 🖼️ [**Hosting de Imágenes**](./architecture/image-hosting.md) | Abstracción multi-proveedor para almacenamiento de imágenes en Local, Cloudinary o Supabase. |

---

## 🛠️ Guía Rápida de Comandos

```bash
# Desarrollo local (con nodemon y recarga automática)
npm run dev

# Iniciar servidor en producción
npm run start

# Simular migración de estadísticas y snapshot de apertura (sin modificar la BD)
npm run backfill:dry

# Aplicar migración de estadísticas y snapshot de apertura en MongoDB
npm run backfill

# Migrar imágenes entre proveedores (ej. de local a Supabase)
node scripts/migrateImages.js --from=local --to=supabase
```

---

## 🌐 Resumen General de Rutas de la API

* **`/card`**: Gestión de cartas, filtros por rareza (`/card/mythic`, etc.) y creación/eliminación.
* **`/user`**: Usuarios, reclamo de `dailyBalance`, tiradas de gacha `/card/random`, inventario `/cards` y estadísticas `/stats`.
* **`/market`**: Listado de ofertas activas por servidor `/offers`, publicación, compra `/buy` y cancelación.
* **`/leaderboard`**: Rankings globales de rachas (`/streaks`), riqueza (`/wealth`) y cartas coleccionadas (`/cards`).
