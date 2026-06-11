# mb-api

Backend API de **MyBusiness** — NestJS + PostgreSQL, multi-tenant.

Prefijo global: `/api`

## Requisitos

- Node.js 20+
- PostgreSQL 15+ (o Docker)

## Inicio rápido

### 1. PostgreSQL

```bash
docker compose up -d
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Migraciones

Con `RUN_MIGRATIONS_ON_START=true` en `.env` (recomendado en dev), las migraciones corren al iniciar la API. También puedes ejecutarlas manualmente **después** de levantar Postgres:

```bash
npm run migration:run
```

> **Orden importante:** primero `docker compose up -d`, luego migrar, luego `npm run start:dev`. Si levantas la API antes de migrar, el seed fallará con `relation "platform_admins" does not exist`.

### 5. Seed (opcional — también corre al iniciar la app)

Crea el admin de plataforma **solo si** `platform_admins` está vacía:

```bash
npm run seed
```

Credenciales por defecto:

| Campo    | Valor                  |
|----------|------------------------|
| Email    | `admin@mybusiness.com` |
| Password | `admin123`             |

### 6. Desarrollo

```bash
npm run start:dev
```

API en `http://localhost:3000/api`

## Integración con mb-web

En `mb-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Panel admin: `http://localhost:5173/admin/login`

## Endpoints del panel admin

| Método | Ruta                      | Auth           |
|--------|---------------------------|----------------|
| POST   | `/api/admin/auth/login`   | Público        |
| POST   | `/api/admin/auth/logout`  | `admin_token`  |
| GET    | `/api/admin/auth/me`      | `admin_token`  |
| GET    | `/api/admin/metrics`      | `admin_token`  |
| GET    | `/api/admin/tenants`      | `admin_token`  |
| GET    | `/api/admin/plans`        | `admin_token`  |

Cookie de admin: `admin_token` (httpOnly, sameSite=lax en desarrollo).

## Auth de tenant users

Rutas existentes bajo `/api/auth/*` con cookie `access_token` (módulo `src/auth/`).

## Roles del sistema

El registro de tenants requiere el rol `client`. Los roles (`owner`, `admin`, `client`) están definidos en código (`RoleRepository`) — no se seedean en la base de datos.

## Scripts

| Script              | Descripción                          |
|---------------------|--------------------------------------|
| `npm run start:dev` | Servidor en modo watch               |
| `npm run migration:run` | Ejecutar migraciones             |
| `npm run migration:revert` | Revertir última migración   |
| `npm run seed`      | Seed idempotente del platform admin  |
| `npm run build`     | Compilar para producción             |

## Estructura

```
src/
├── admin/          # Panel de plataforma (/api/admin/**)
├── auth/           # Auth tenant users (/api/auth/**)
├── common/         # Guards, constants, decorators
├── database/       # TypeORM entities y migraciones
├── seeds/          # Seed idempotente platform admin
├── users/          # Repositorio de usuarios tenant-scoped
└── role/           # Roles y permisos en memoria
```

## Datos de prueba

No se seedean planes, tenants ni usuarios. Para probar el dashboard, inserta registros manualmente en `plans` y `tenants`.

Ejemplo de plan:

```sql
INSERT INTO plans (id, name, price_monthly, max_users, max_products, features)
VALUES ('starter', 'Starter', 29.00, 5, 100, '["catalogo","pedidos"]');
```
