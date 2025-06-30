# KameGameBackend

## Setup

### Base de datos (Postgres)

Iniciar una instancia de postgres con docker

```
docker run --name drizzle-postgres -e POSTGRES_PASSWORD=mypassword -d -p 5432:5432 postgres
```

Crear el archivo `.env` con el siguiente contenido:

```
DATABASE_URL=postgres://postgres:mypassword@localhost:5432/postgres
```

Aplicar las migraciones:

```
npx drizzle-kit migrate
```

Para más información: [ver esta guía](https://orm.drizzle.team/docs/guides/postgresql-local-setup)

### Servidor

Instalar las dependencias:

```
npm i
```

Iniciar el servidor:

```
npm run dev
```
