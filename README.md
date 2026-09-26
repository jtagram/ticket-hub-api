# ticket-hub-api

## Variables de entorno

La app requiere las siguientes variables de entorno para arrancar (definidas y
validadas en `src/common/config/env.validation.ts`; si falta alguna, el
proceso no arranca):

- `PORT`
- `LOG_LEVEL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `INFRA_HUB_API_URL`
- `IAM_API_URL`
- `TICKET_HUB_APPLICATION_NAME`

## Cómo obtener cada una

### `PORT`

Puerto en el que escucha el proceso de Nest.

### `LOG_LEVEL`

Nivel de log de Pino: `trace`, `debug`, `info`, `warn`, `error` o `fatal`.

### `POSTGRES_USER` / `POSTGRES_PASSWORD`

Credenciales del Secret `postgres-credentials` de PostgreSQL (ver
`wiki-hub/microk8s/microk8s.secrets.md`).

### `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME`

Datos de conexión a la base de datos propia de `ticket-hub-api`: host y
puerto son los del Service de PostgreSQL dentro del namespace del cluster,
y el nombre es el de la base creada específicamente para `ticket-hub-api`.

### `INFRA_HUB_API_URL`

URL a la que `ticket-hub-api` llama para ejecutar operaciones de
infraestructura (Service de `infra-hub-api` dentro del cluster, o su URL
pública si corre fuera).

### `IAM_API_URL`

URL de `iam-api`, usada para resolver datos de usuarios/roles y para pedirle
por HTTP (`GET /auth/public-key`) la clave pública RSA con la que se validan
los tokens que emite `iam-api`.

### `TICKET_HUB_APPLICATION_NAME`

Nombre exacto (columna `name`) de la aplicación "ticket-hub" tal como está
registrada en la base de datos de `iam-api` (tabla `apps_applications`).
Lo usa `RolesGuard` para verificar que el token recibido fue emitido para
esta aplicación.
