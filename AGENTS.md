# AGENTS.md - Reglas e Instrucciones para Agentes de IA en Backend Smilbot

Bienvenido al **Backend API de Smilbot**, un servicio REST modular desarrollado en Node.js (ES Modules) con Express.js y MongoDB (Mongoose), encargado de la persistencia de datos, auditoría contable (Ledger), transacciones atómicas, catálogo de cartas gacha, mercado P2P y analíticas de usuarios.

Este documento establece los principios de trabajo, la arquitectura del proyecto y las reglas obligatorias que todos los agentes de IA deben seguir al realizar cualquier cambio, refactorización o nueva implementación en el backend.

---

## 🚨 Regla de Oro: Definición de Terminado (Definition of Done)

> **NINGUNA tarea, cambio o implementación se considera completada sin haber actualizado o creado la documentación correspondiente en la Bóveda Centralizada de Obsidian.**

### 📚 Bóveda Centralizada de Obsidian (Single Source of Truth)
- **Ruta de la Bóveda:** `F:\smilbot-project\smilbot-vault` (disponible vía servidor MCP `obsidian_vault` o en disco).
- Esta bóveda es la **única fuente de verdad compartida** entre el **Backend API** y el **Bot de Discord**.

Antes de entregar una respuesta final o cerrar un cambio:
1. **Contratos de API REST:** Si agregaste, modificaste o eliminaste endpoints, parámetros, query params o payloads de respuesta, actualiza la nota correspondiente en `F:\smilbot-project\smilbot-vault\Backend API\` y actualiza `.env.example` si requiere nuevas variables.
2. **Modelos y Lógica de Negocio:** Si modificaste esquemas de Mongoose (`User`, `Card`, `MarketOffer`, `Transaction`) o lógica contable/probabilidades, actualiza `F:\smilbot-project\smilbot-vault\Modelos y Contratos\`.
3. Si agregaste una nota nueva a Obsidian, enlázala en `00 - Inicio.md` y en `README.md`.

---

## 📁 Estructura del Backend

- `controllers/`: Controladores que manejan la lógica de petición/respuesta (`userController`, `cardController`, `marketController`, `leaderboardController`).
- `models/`: Esquemas de Mongoose (`User.js`, `Card.js`, `MarketOffer.js`, `Transaction.js`).
- `routers/`: Definición y enrutamiento de endpoints Express.
- `services/`: Lógica de negocio reusable y cálculos agregados.
- `libs/`: Utilidades y librerías transversales (ej. `libs/imageHosting` con patrón Provider para Cloudinary, Supabase y Local).
- `openspec/`: Especificaciones y configuraciones de OpenSpec.
- `.agents/`: Reglas, skills y flujos de trabajo para agentes de IA.
- **Documentación Técnica:** Centralizada externamente en `F:\smilbot-project\smilbot-vault`.

---

## 🛠️ Directrices Técnicas

- **Stack**: Node.js (ES Modules, `import/export`), Express.js, MongoDB con Mongoose.
- **Integridad Contable**: Cada variación de saldo o compra/venta debe registrarse inmutablemente en `Transaction` con su respectivo `type` y `metadata`.
- **Transacciones Atómicas**: Las operaciones complejas como compra en el mercado P2P deben ejecutarse dentro de una sesión transaccional de MongoDB para garantizar atomicidad.
- **Variables de Entorno**: Cualquier nueva variable requerida debe registrarse en `.env.example` con un valor de ejemplo o explicación.
- **Consistencia**: Respeta las convenciones existentes de nombrado (camelCase para controladores/servicios, PascalCase para modelos).
