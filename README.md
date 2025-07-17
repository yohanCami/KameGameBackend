# KameGameBackend

## Setup

### Base de datos (Postgres)

Iniciar una instancia de postgres con docker

```console
$ docker run --name drizzle-postgres -e POSTGRES_PASSWORD=mypassword -d -p 5432:5432 postgres

# si el container ya está siendo utilizado, utilice este comando
$ docker start drizzle-postgres
```

> Nota: el daemon de Docker debe estár corriendo antes de ejecutar este comando. Para más información, ver [esta guia](https://docs.docker.com/engine/daemon/start/).

Crear el archivo `.env` con el siguiente contenido:

```
DATABASE_URL=postgres://postgres:mypassword@localhost:5432/postgres
JWT_SECRET=supersecreto
```

> Nota: se necesita este archivo para que el backend como encontrar y loggear en la base de datos, y para definir el JSON Web Token para gestionar de forma segura la autenticación de usuarios.

Aplicar las migraciones:

```
npx drizzle-kit migrate
```

> Nota: este comando crea/actualiza la estructura de la base de datos. Para más información, ver [esta guía](https://orm.drizzle.team/docs/guides/postgresql-local-setup)

### Servidor

Instalar las dependencias:

```
npm install
```

Iniciar el servidor:

```
npm run dev
```

## Documentación

Todas las rutas tienen el mismo formato para la respuesta:

```
{
  error: true | any | null;
  data: any | null;
  message: string;
  status: number;
}
```

### /user

- `POST /user/signup`

**Input:** Espera que el `body` de la petición tenga la siguiente forma:

```typescript
type SignupParams = {
	name: string
	password: string
}
```

**Ejemplos:**

Registro exitoso:

```sh
curl -X POST http://localhost:3000/user/signup -H 'Content-Type: application/json' -d '{"name": "Pedro", "password": "12345"}'
```

```json
{
	"error": null,
	"data": null,
	"message": "sign up successfull",
	"status": 201
}
```

Error por tener una contraseña con menos de 5 caracteres:

```sh
curl -X POST http://localhost:3000/user/signup -H 'Content-Type: application/json' -d '{"name": "Pedro", "password": "abc"}'
```

```json
{
	"data": null,
	"message": "error parsing signup details",
	"error": [
		{
			"origin": "string",
			"code": "too_small",
			"minimum": 5,
			"inclusive": true,
			"path": ["password"],
			"message": "Too small: expected string to have >=5 characters"
		}
	],
	"status": 400
}
```

Error por usuario ya existente:

```sh
curl -X POST http://localhost:3000/user/signup -H 'Content-Type: application/json' -d '{"name": "Pedro", "password": "abcdefg"}'
```

```json
{
	"data": null,
	"message": "user already exists",
	"error": true,
	"status": 400
}
```

- `POST /user/login`

**Input:** Espera que el `body` de la petición tenga la siguiente forma:

```typescript
type LoginParams = {
	name: string
	password: string
}
```

**Ejemplos:**

Login exitoso:

```sh
curl -X POST http://localhost:3000/user/login -H 'Content-Type: application/json' -d '{"name": "Pedro", "password": "12345"}'
```

```json
{
	"error": null,
	"data": {
		"accessToken": "<token>"
	},
	"message": "login successfull",
	"status": 200
}
```

> Puede ingresar con el usuario `admin` y la contraseña `admin123` para utilizar una cuenta con
> permisos de administración

Contraseña incorrecta:

```sh
curl -X POST http://localhost:3000/user/login -H 'Content-Type: application/json' -d '{"name": "Pedro", "password": "123453"}'
```

```json
{
	"data": null,
	"message": "incorrect username or password",
	"error": true,
	"status": 400
}
```

- `GET /user`

**Input:** Espera recibir el token en el header `Authorization`, con el valor `Bearer <token>`

**Ejemplos:**

Con un token válido (el que aparece en `accessToken` en la petición de login):

```sh
curl http://localhost:3000/user -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": {
		"name": "Pedro",
		"yugiPesos": 0
	},
	"message": "",
	"status": 200
}
```

Con un token incorrecto:

```sh
curl http://localhost:3000/user -H 'Authorization: Bearer <token incorrecto>'
```

```json
{
	"data": null,
	"message": "invalid token",
	"error": true,
	"status": 400
}
```

Falta el header con el token:

```sh
curl http://localhost:3000/user
```

```json
{
	"data": null,
	"message": "not authenticated, please login to access this resource",
	"error": true,
	"status": 401
}
```

- `PATCH /user/funds`

**Input:** Espera recibir el token en el header y que el body de la petición contenga la cantidad a recargar:

> La cantidad debe ser positiva

**Ejemplos**

Token correcto, usuario con 3000 yugiPesos actuales:

```sh
curl -X PATCH http://localhost:3000/user/funds -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"amount": 1000}'
```

```json
{
	"error": null,
	"data": {
		"name": "sebas",
		"yugiPesos": 4000
	},
	"message": "funds updated",
	"status": 200
}
```

Token incorrecto:

```sh
curl -X PATCH http://localhost:3000/user/funds -H 'Authorization: Bearer <token incorrecto>' -H 'Content-Type: application/json' -d '{"amount": 1000}'
```

```json
{
	"data": null,
	"message": "invalid token",
	"error": true,
	"status": 400
}
```

### /cards

- `GET /cards`

**Input:** Puede recibir parámetros en la url con la siguiente forma:

```typescript
type CardSearchSchema = {
	page: number
	itemsPerPage: number
	itemName?: string | undefined
	cardAttribute?:
		| "DARK"
		| "DIVINE"
		| "EARTH"
		| "FIRE"
		| "LIGHT"
		| "WATER"
		| "WIND"
		| undefined
}
```

> Por defecto, `page=1` y `itemsPerPage=20`, todos los parámetros son opcionales

**Ejemplos:**

Sin parámetros:

```sh
curl http://localhost:3000/cards
```

```json
{
  "error": null,
  "data": {
    "results": [
      {
        "id": 27553701,
        "name": "Absolute King - Megaplunder",
        "price": 147273,
        "imageUrl": "https://ygocards.blob.core.windows.net/cards/27553701.jpg",
        "attribute": "EARTH",
        "stock": 44,
        "attack": 2000
      },
      {
        "id": 97127906,
        "name": "Alien Shocktrooper",
        "price": 28999,
        "imageUrl": "https://ygocards.blob.core.windows.net/cards/97127906.jpg",
        "attribute": "EARTH",
        "stock": 5,
        "attack": 1900
      },
      ...
    ],
    "totalPages": 11
  },
  "message": "",
  "status": 200
}
```

Con todos los parámetros:

```sh
curl 'http://localhost:3000/cards?page=2&itemsPerPage=1&itemName=king&cardAttribute=EARTH'
```

```
{
  "error": null,
  "data": {
    "results": [
      {
        "id": 22910685,
        "name": "Green Phantom King",
        "price": 7000,
        "imageUrl": "https://ygocards.blob.core.windows.net/cards/22910685.jpg",
        "attribute": "EARTH",
        "stock": 49,
        "attack": 500
      }
    ],
    "totalPages": 2
  },
  "message": "",
  "status": 200
}
```

No encuentra resultados:

```sh
curl http://localhost:3000/cards?itemName=king&cardAttribute=FIRE
```

```json
{
	"error": null,
	"data": {
		"results": [],
		"totalPages": 0
	},
	"message": "",
	"status": 200
}
```

- `GET /cards/<id>`

**Input:** el id de la carta en `<id>`

**Ejemplos:**

Encontró la carta con ese id:

```sh
curl http://localhost:3000/cards/22910685
```

```json
{
	"error": null,
	"data": {
		"id": 22910685,
		"name": "Green Phantom King",
		"price": 7000,
		"imageUrl": "https://ygocards.blob.core.windows.net/cards/22910685.jpg",
		"attribute": "EARTH",
		"stock": 49,
		"attack": 500
	},
	"message": "",
	"status": 200
}
```

No encontró la carta:

```sh
curl http://localhost:3000/cards/123
```

```json
{
	"error": null,
	"data": null,
	"message": "",
	"status": 200
}
```

- `POST /cards`

**Input:** Necesita el header `Authorization` con el token del usuario logueado y espera recibir la carta en el body con el siguiente formato

```typescript
type CreateCard = {
	name: string
	price: number
	imageUrl: string
	attribute: "DARK" | "DIVINE" | "EARTH" | "FIRE" | "LIGHT" | "WATER" | "WIND"
	attack: number
	id?: number | undefined
	stock?: number | undefined
}
```

**Ejemplos:**

Usuario que no es admin:

```sh
curl -X POST http://localhost:3000/cards -H 'Authorization: Bearer <token no admin>'
```

```json
{
	"data": null,
	"message": "unauthorized",
	"error": true,
	"status": 403
}
```

Creación de carta exitoso (token de un usuario que es admin):

```sh
curl -X POST http://localhost:3000/cards -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{
  "name": "ejemplo",
  "price": 1,
  "imageUrl": "https://google.com",
  "attribute": "DARK",
  "attack": 5,
  "stock": 2
  }'
```

```json
{
	"error": null,
	"data": null,
	"message": "card created",
	"status": 200
}
```

- `PATCH /cards/<id>`

**Input:** Espera recibir el id de la carta en `<id>` y los nuevos datos de la carta en el `body`
con el siguiente formato:

```typescript
type UpdateCard = {
	name?: string | undefined
	price?: number | undefined
	imageUrl?: string | undefined
	attribute?:
		| "DARK"
		| "DIVINE"
		| "EARTH"
		| "FIRE"
		| "LIGHT"
		| "WATER"
		| "WIND"
		| undefined
	stock?: number | undefined
	attack?: number | undefined
}
```

**Ejemplos:**

```sh
curl -X PATCH http://localhost:3000/cards/22910685 -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{
  "name": "changed"
  }'
```

```json
{
	"error": null,
	"data": null,
	"message": "card updated",
	"status": 200
}
```

- `DELETE /cards/<id>`

### /packs

- `GET /packs`

**Input:** Puede recibir parámetros en la URL con la siguiente forma:

```ts
type PackSearchSchema = {
	page: number
	itemsPerPage: number
	itemName?: string
	rarity?: "COMMON" | "RARE" | "SUPER RARE" | "ULTRA RARE"
}
```

> Por defecto, `page=1` y `itemsPerPage=20`. Todos los parámetros son opcionales.

**Ejemplos:**

```sh
curl http://localhost:3000/packs
```

```json
{
	"error": null,
	"data": {
		"results": [
			{
				"id": 1,
				"name": "Rare Beasts",
				"price": 5000,
				"imageUrl": "https://example.com/pack1.png",
				"rarity": "rare",
				"discount": 0.15
			}
		],
		"totalPages": 1
	},
	"message": "",
	"status": 200
}
```

---

- `GET /packs/<id>`

**Input:** el ID del paquete en `<id>`

```sh
curl http://localhost:3000/packs/1
```

```json
{
	"error": null,
	"data": {
		"id": 1,
		"name": "Rare Beasts",
		"price": 5000,
		"imageUrl": "https://example.com/pack1.png",
		"rarity": "rare",
		"discount": 0.15
	},
	"message": "",
	"status": 200
}
```

---

- `POST /packs`

**Input:** Necesita el header `Authorization` con el token de un usuario administrador. El `body` debe tener la siguiente forma:

```ts
type CreatePack = {
	name: string
	price: number
	imageUrl: string
	rarity: "COMMON" | "RAR" | "SUPER RARE" | "ULTRA RARE"
	discount?: number
}
```

**Ejemplo:**

```sh
curl -X POST http://localhost:3000/packs -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{
  "name": "Epic Warriors",
  "price": 8000,
  "imageUrl": "https://example.com/pack.png",
  "rarity": "ultra-rare"
}'
```

```json
{
	"error": null,
	"data": null,
	"message": "pack created",
	"status": 200
}
```

---

- `PATCH /packs/<id>`

**Input:** Espera el ID del pack en la URL y un body parcial con los campos a actualizar:

```ts
type UpdatePack = {
	name?: string
	price?: number
	imageUrl?: string
	rarity?: "common" | "rare" | "super-rare" | "ultra-rare"
	discount?: number
}
```

**Ejemplo:**

```sh
curl -X PATCH http://localhost:3000/packs/1 -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{ "discount": 0.3 }'
```

```json
{
	"error": null,
	"data": null,
	"message": "pack updated",
	"status": 200
}
```

---

- `DELETE /packs/<id>`

**Input:** Espera recibir el ID del pack en la URL:

```sh
curl -X DELETE http://localhost:3000/packs/1 -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": null,
	"message": "pack deleted",
	"status": 200
}
```

### /cart

Todas las rutas de `/cart` requieren el header `Authorization` con el token del usuario logueado.

- `GET /cart`

Carrito vacío:

```sh
curl http://localhost:3000/cart -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": {
		"cards": [],
		"packs": []
	},
	"message": "",
	"status": 200
}
```

Carrito con una carta:

```sh
curl http://localhost:3000/cart -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": {
		"cards": [
			{
				"id": 22910685,
				"name": "Green Phantom King",
				"price": 7000,
				"imageUrl": "https://ygocards.blob.core.windows.net/cards/22910685.jpg",
				"attribute": "EARTH",
				"stock": 49,
				"attack": 500,
				"quantity": 1
			}
		],
		"packs": []
	},
	"message": "",
	"status": 200
}
```

- `POST /cart`

**Input:** Espera recibir los items a agregar al carrito en el `body` con el siguiente formato:

```typescript
type ItemAddParams =
	| {
			quantity: number
			cardId?: number | undefined
			packId?: number | undefined
	  }
	| {
			items: {
				quantity: number
				cardId?: number | undefined
				packId?: number | undefined
			}[]
	  }
```

> Es decir, puede recibir un único item o una lista de items a agregar.

> `quantity` es opcional, por defecto 1

> Si el item a agregar ya está en el carrito, suma `quantity` a la cantidad actual de ese item en
> el carrito

**Ejemplos:**

```sh
curl -X POST http://localhost:3000/cart -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{ "cardId": 22910685 }'
```

```json
{
	"error": null,
	"data": null,
	"message": "item(s) added",
	"status": 200
}
```

- `PUT /cart`

Esta ruta actualiza la cantidad

**Input:** Espera recibir el id del item y la cantidad de ese item en el carrito con el siguiente
formato:

```typescript
type ItemCountUpdateParams = {
	quantity: number
	cardId?: number | undefined
	packId?: number | undefined
}
```

> Reemplaza la cantidad actual del item en el carrito con el `quantity` recibido en los parámetros

**Ejemplos:**

```sh
curl -X PUT http://localhost:3000/cart -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"quantity": 5, "cardId": 22910685 }'
```

```json
{
	"error": null,
	"data": null,
	"message": "item updated",
	"status": 200
}
```

- `DELETE /cart/<category>/<id>`

**Input:** Espera recibír la categoría del item (`card` o `pack`) en `<category>` y el id del item
a eliminar del carrito

**Ejemplos:**

```sh
curl -X DELETE http://localhost:3000/cart/card/22910685 -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": null,
	"message": "item deleted",
	"status": 200
}
```

- `DELETE /cart`

Limpia el carrito (elimina todos los items del carrito)

```sh
curl -X DELETE http://localhost:3000/cart -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": null,
	"message": "cart cleared",
	"status": 200
}
```

- `GET /cart/buy`

Realiza la compra de los items en el carrito

**Ejemplos:**

Carrito vacío

```sh
curl http://localhost:3000/cart/buy -H 'Authorization: Bearer <token>'
```

```json
{
	"data": null,
	"message": "the cart is empty, nothing to buy",
	"error": true,
	"status": 400
}
```

Usuario sin suficientes YugiPesos:

```sh
curl http://localhost:3000/cart/buy -H 'Authorization: Bearer <token>'
```

```json
{
	"data": null,
	"message": "You don't have enough balance. Need at least 2917900 YP",
	"error": true,
	"status": 400
}
```

Carrito con cartas sin suficiente stock:

```sh
curl http://localhost:3000/cart/buy -H 'Authorization: Bearer <token>'
```

```json
{
	"data": null,
	"message": "the cart includes cards that don't have enough stock",
	"error": true,
	"status": 400
}
```

Compra exitosa:

```sh
curl http://localhost:3000/cart/buy -H 'Authorization: Bearer <token>'
```

```json
{
	"error": null,
	"data": null,
	"message": "purchase completed",
	"status": 200
}
```
