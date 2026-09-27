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
- `INFRA_HUB_API_APPLICATION_NAME`
- `TICKET_HUB_API_SERVICE_CLIENT_ID`
- `TICKET_HUB_API_SERVICE_CLIENT_SECRET`

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

### `INFRA_HUB_API_APPLICATION_NAME`

Nombre exacto de la aplicación "infra-hub-api" en `iam-api`; tiene que
coincidir con el mismo valor configurado como `INFRA_HUB_API_APPLICATION_NAME`
en `infra-hub-api`. `ticket-hub-api` lo manda como header `x-application-name`
al loguearse contra `iam-api` (`POST /apps-users/login`).

### `TICKET_HUB_API_SERVICE_CLIENT_ID` / `TICKET_HUB_API_SERVICE_CLIENT_SECRET`

Credenciales de un "apps-user" creado en `iam-api` (`POST /apps-users`,
admin-only) — es el mecanismo real de `iam-api` para credenciales de servicio
(machine-to-machine), no un internal user humano. El `clienteSecret` solo se
muestra una vez, en el momento de crear el apps-user; guardalo ahí. Es la
identidad propia de `ticket-hub-api`, que se loguea con estas credenciales
contra `iam-api` pidiendo distintas aplicaciones según lo que necesite en
cada caso (header `x-application-name`): `infra-hub-api` para ejecutar
operaciones de infraestructura, o `ticket-hub` para resolver la lista de
posibles asignados. `AppUserAuthService` cachea un JWT por cada nombre de
aplicación pedido.
