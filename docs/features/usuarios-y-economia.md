# 👤 Feature: Usuarios, Economía e Inventario

Este documento describe el funcionamiento de los **usuarios, su balance económico, el inventario de cartas y las mecánicas de recompensas diarias** en el backend de **Smilbot**.

---

## 🎯 1. Concepto General
Cada jugador de Discord está representado por un documento `User`. La economía se basa en monedas acumulables mediante reclamos diarios (`dailyBalance`) o ventas en el mercado, las cuales se gastan en compras de sobres (`rollRandomCard`) o adquisiciones en el mercado P2P.

---

## 🗄️ 2. Modelo de Datos (`User`)

```typescript
interface UserCard {
  cardId: ObjectId | string;   // Referencia a la carta
  count: number;               // Cantidad de copias en posesión (min: 0)
}

interface UserSchema {
  _id: ObjectId | string;
  discordId: string;           // ID único de usuario en Discord
  username: string;            // Nombre de usuario en Discord
  balance: number;             // Saldo actual de monedas (default: 0)
  cards: UserCard[];           // Subdocumentos de inventario agrupado
  lastDaily: Date;             // Última fecha de reclamo del daily
  lastTimeCommand: Date;       // Alias retrocompatible de lastDaily

  // --- Telemetría y Rachas ---
  dailyStreak: number;         // Racha actual consecutiva
  maxDailyStreak: number;      // Racha récord alcanzada
  totalDailiesClaimed: number; // Total histórico de reclamos
  totalCoinsEarned: number;    // Total histórico de monedas ganadas
  totalCoinsSpent: number;     // Total histórico de monedas gastadas
  cardsOpenedCount: number;    // Total de cartas abiertas por gacha
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚙️ 3. Reglas de Negocio

### A. Reclamo Diario (`dailyBalance`)
* **Recompensa:** `+100` monedas.
* **Cooldown de uso:** Requiere un mínimo de **23 horas** desde el último reclamo.
* **Ventana de Racha:**
  * **23h a 48h:** Mantiene y suma `+1` a la racha (`dailyStreak++`).
  * **> 48h:** Se rompe la racha y se reinicia a `1`.
* **Registro contable:** Genera una transacción inmutable `DAILY_CLAIM` en el Ledger.

### B. Tirada de Gacha (`POST /user/:id/card/random`)
* **Coste:** `100` monedas (`ROLL_COST`).
* **Requisito:** `user.balance >= 100`.
* **Efecto:** Descuenta saldo, añade la carta al inventario, incrementa `cardsOpenedCount`, `totalCoinsSpent` y registra `CARD_BUY` con el número de tirada `roll` en la metadata.

---

## 🌐 4. Endpoints de Usuario (`/user`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/user` | Lista todos los usuarios registrados. |
| `GET` | `/user/:id` | Obtiene los datos de un usuario por su `discordId`. |
| `POST` | `/user` | Registra un nuevo usuario (`{ discordId, username }`). |
| `POST` | `/user/id` | Obtiene o crea un usuario automáticamente a partir del body. |
| `DELETE` | `/user/:id` | Elimina un usuario. |
| `POST` | `/user/:id/dailyBalance` | Ejecuta el reclamo diario y actualiza la racha. |
| `POST` | `/user/:id/card/random` | Compra y tira un sobre de carta gacha (100 monedas). |
| `GET` | `/user/:id/cards` | Retorna el inventario consolidado agrupando duplicados (`count: N`). |
| `GET` | `/user/:id/cards/number` | Retorna el conteo de cartas agrupado por rareza (`type`). |
| `POST` | `/user/:id/card/:cardId` | Añade una carta manualmente al inventario. |
| `DELETE`| `/user/:id/card/:cardId` | Remueve una carta del inventario. |
| `POST` | `/user/:id/balance/:amount` | Ajuste administrativo: añade saldo (`ADMIN_ADJUST`). |
| `DELETE`| `/user/:id/balance/:amount` | Ajuste administrativo: descuenta saldo (`ADMIN_ADJUST`). |
| `GET` | `/user/:id/stats` | Estadísticas globales del jugador para perfiles y telemetría. |
| `GET` | `/user/:id/transactions` | Historial paginado de movimientos del Ledger (`?page=1&limit=10`). |
