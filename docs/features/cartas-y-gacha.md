# 🎴 Feature: Cartas, Colección y Sistema Gacha

Este documento describe la especificación y funcionamiento del sistema de **cartas coleccionables y tiradas aleatorias (Gacha)** en el backend de **Smilbot**.

---

## 🎯 1. Concepto General
El bot permite coleccionar cartas digitales clasificadas en 5 niveles de rareza. Los usuarios pueden obtener cartas mediante tiradas aleatorias (Gacha / Rolls), intercambiarlas o comprarlas en el mercado.

---

## 🎲 2. Rarezas y Probabilidades del Gacha

El sistema utiliza un generador criptográficamente seguro (`crypto.randomInt(0, 1000)`) que asigna una tirada entre `0` y `999`.

| Tipo | Rareza | Probabilidad | Rango de Tirada (`roll`) | Color Representativo |
| :---: | :--- | :---: | :---: | :---: |
| **4** | **Mythic** (Mítica) | **0.5%** | `0 - 4` | 🔴 Rojo / Arcoíris |
| **3** | **Legendary** (Legendaria) | **2.0%** | `5 - 24` | 🟡 Dorado / Amarillo |
| **2** | **Epic** (Épica) | **10.0%** | `25 - 124` | 🟣 Púrpura / Morado |
| **1** | **Rare** (Rara) | **30.0%** | `125 - 424` | 🔵 Azul |
| **0** | **Common** (Común) | **57.5%** | `425 - 999` | ⚪ Gris / Blanco |

### Algoritmo de Tirada (`getRandomCard`)
1. Genera un número entero $roll \in [0, 999]$.
2. Determina el `type` de rareza según el rango alcanzado.
3. Selecciona una carta aleatoria entre todas las cartas existentes de esa rareza en la base de datos.
4. Retorna la carta seleccionada junto con el valor exacto del `roll`.

---

## 🗄️ 3. Modelo de Datos (`Card`)

```typescript
interface CardSchema {
  _id: ObjectId | string;
  name: string;             // Nombre único de la carta
  description: string;      // Descripción o lore
  type: number;             // 0: Common, 1: Rare, 2: Epic, 3: Legendary, 4: Mythic
  imageUrl: string;         // URL pública de la imagen
  imagePublicId?: string;   // ID del proveedor de imágenes (para borrado remoto)
  author?: string;          // Creador o artista de la carta
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🌐 4. Endpoints de Cartas (`/card`)

### 1. Listar todas las cartas
* **GET** `/card`
* **Respuesta (200 OK):** Array con todas las cartas ordenadas por rareza (`type: 1`).

### 2. Obtener una carta por ID
* **GET** `/card/:id`
* **Respuesta (200 OK):** Objeto de la carta.

### 3. Obtener carta aleatoria por rareza específica
* **GET** `/card/mythic`
* **GET** `/card/legendary`
* **GET** `/card/epic`
* **GET** `/card/rare`
* **GET** `/card/common`

### 4. Crear nueva carta (Admin / Multipart)
* **POST** `/card`
* **Headers:** `Content-Type: multipart/form-data`
* **Body:**
  * `data`: JSON string con `{ "name": "...", "description": "...", "type": "rare", "author": "..." }`
  * `image`: Archivo de imagen binario
* **Respuesta (201 Created):** Objeto de la carta creada con `imageUrl` y `imagePublicId`.

### 5. Eliminar carta
* **DELETE** `/card/:id`
* **Efecto:** Elimina la carta de la base de datos y borra su imagen asociada del proveedor de hosting configurado.
