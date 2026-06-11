# Prompt: Implementar backend MyBusiness (NestJS + PostgreSQL + Multi-tenancy)

> Copiar y pegar este documento completo como instrucción para implementar o completar el proyecto `mb-api`, conectándolo al frontend `mb-web` existente y eliminando los mocks del panel admin.

---

## Objetivo

Completar el backend **`mb-api`** con **NestJS** y **PostgreSQL** para una plataforma SaaS **multi-tenant** llamada **MyBusiness**, de modo que el panel de administración de plataforma (`/admin` en el frontend) funcione con **datos reales** en lugar de mocks.

**Alcance inmediato:** endpoints del admin de plataforma (auth, métricas, tenants, planes).

**Fuera de alcance inmediato (solo modelar/preparar):** login de tenants, register-tenant, billing/Stripe, subdominios en producción.

---

## Contexto de los proyectos

| Proyecto | Stack | Puerto | Descripción |
|----------|-------|--------|-------------|
| `mb-web` | Next.js 15 + MUI | `5173` | Frontend con panel admin en `/admin` |
| `mb-api` | NestJS + PostgreSQL | `3000` | Backend API con prefijo global `/api` |

El frontend consume la API con **axios** (`withCredentials: true`) desde `NEXT_PUBLIC_API_URL`.

---

## Módulo Auth existente (OBLIGATORIO reutilizar)

En `mb-api` **ya existe** un módulo `auth` con arquitectura por capas. **No crear uno nuevo desde cero**: extenderlo y ajustarlo a PostgreSQL + multi-tenancy.

### Estructura actual

```
src/auth/
├── auth.module.ts
├── application/
│   └── services/
│       └── auth.service.ts
├── infrastructure/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── interfaces/
│       └── index.ts          # SessionUser, SessionUserAddress
└── strategies/
    └── jwt.strategy.ts
```

### Comportamiento actual del módulo (tenant users)

- Rutas bajo `@Controller('auth')` → `/api/auth/*`
- Login/register con JWT en cookie (`COOKIE_NAME` desde `common/constants`, típicamente `access_token`)
- `JwtStrategy` extrae token de **cookie** o **Bearer**
- `AuthService`: bcrypt, `signToken`, `validateUser`, `findById`, forgot/reset password
- `SessionUser`: `{ id, name, email, phone, role, permissions, address? }`
- Guards: `AuthGuard('jwt')`, `JwtPermissionsGuard`, `@RequiredPermission`

### Qué hacer con este módulo

1. **Conservar** la estructura de carpetas, patrones de DTOs, guards y el flujo cookie + JWT.
2. **Adaptar** repositorios y queries a **PostgreSQL** (TypeORM o Prisma). El código actual referencia patrones MongoDB (`$gt`, `isObjectId`) — migrar a SQL.
3. **Agregar `tenantId`** al flujo de auth de tenants (login/register scoped por tenant). No romper la API existente; extender.
4. **No mezclar** auth de platform admin con auth de tenant users:
   - Tenant users → cookie `access_token` + rutas `/api/auth/*` (módulo existente)
   - Platform admin → cookie `admin_token` + rutas `/api/admin/auth/*` (nuevo sub-módulo o extensión del auth existente reutilizando JwtModule/bcrypt)

Reutilizar de `AuthModule` donde aplique: `JwtModule`, `PassportModule`, helpers de cookie, bcrypt, validación con class-validator.

---

## Arquitectura multi-tenant

**Modelo:** base de datos compartida con columna `tenant_id` en entidades tenant-scoped.

### Dos capas de identidad (separadas)

| Capa | Tabla | Cookie JWT | Rutas | Descripción |
|------|-------|------------|-------|-------------|
| Platform Admin | `platform_admins` | `admin_token` | `/api/admin/**` | Operador del SaaS. Sin `tenant_id`. |
| Tenant Users | `users` | `access_token` | `/api/auth/**` + resto tenant-scoped | Usuarios dentro de cada cliente. |

### Entidades mínimas

**Globales (sin tenant_id):**

- `platform_admins` — `id` (uuid), `email` (unique), `passwordHash`, `name`, `createdAt`, `updatedAt`
- `plans` — `id` (`trial` \| `starter` \| `pro` \| `enterprise`), `name`, `priceMonthly`, `maxUsers`, `maxProducts`, `features` (jsonb o text[])

**Tenant-scoped:**

- `tenants` — `id` (uuid), `name`, `slug` (unique), `planId` (FK), `status` (`active` \| `trial` \| `suspended` \| `cancelled`), `trialEndsAt` (nullable), `createdAt`, `updatedAt`
- `users` — `id`, `tenantId` (FK), `email`, `passwordHash`, `name`, `phone`, `role`, `enabled`, campos reset password, `createdAt`

**MRR por tenant:** derivado de `plans.priceMonthly` cuando `tenants.status = 'active'`; `0` si `trial`, `suspended` o `cancelled`.

**Plans y tenants:** NO se seedean. El admin de plataforma los creará desde el panel (fase futura) o manualmente vía API. Solo deben existir las tablas y la lógica de lectura para el dashboard.

---

## Contrato API con el frontend (panel admin)

El frontend `mb-web` espera exactamente estos endpoints. Las respuestas deben coincidir en forma y tipos.

### Endpoints

| Método | Ruta | Auth | Request | Response |
|--------|------|------|---------|----------|
| `POST` | `/api/admin/auth/login` | Público | `{ email, password }` | `{ admin: PlatformAdmin }` + Set-Cookie `admin_token` |
| `POST` | `/api/admin/auth/logout` | Cookie `admin_token` | — | `{ ok: true }` + Clear-Cookie |
| `GET` | `/api/admin/auth/me` | Cookie `admin_token` | — | `{ admin: PlatformAdmin }` o `401` |
| `GET` | `/api/admin/metrics` | Cookie `admin_token` | — | `PlatformMetrics` |
| `GET` | `/api/admin/tenants` | Cookie `admin_token` | — | `{ tenants: TenantSummary[] }` |
| `GET` | `/api/admin/plans` | Cookie `admin_token` | — | `{ plans: PlatformPlan[] }` |

### Tipos TypeScript (contrato)

```typescript
type PlanId = "trial" | "starter" | "pro" | "enterprise";
type TenantStatus = "active" | "trial" | "suspended" | "cancelled";

interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
}

interface PlatformPlan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxProducts: number;
  features: string[];
  tenantCount: number;
}

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  status: TenantStatus;
  ownerEmail: string;
  userCount: number;
  createdAt: string;        // ISO 8601
  trialEndsAt: string | null;
  mrr: number;
}

interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalMrr: number;
  totalRevenue: number;       // totalMrr * 12
  revenueByPlan: { plan: string; revenue: number; count: number }[];
  tenantsGrowth: { month: string; count: number }[];  // últimos 6 meses, labels en español: Ene, Feb, Mar...
}
```

### Formato de errores

El frontend lee `error.response.data.message`:

```json
{ "message": "Credenciales inválidas" }
```

Usar excepciones NestJS (`UnauthorizedException`, `BadRequestException`, etc.) con mensaje en español cuando corresponda.

---

## Autenticación Platform Admin

### Cookie `admin_token`

- `httpOnly: true`
- `sameSite: 'lax'` en desarrollo, `'none'` + `secure: true` en producción
- `path: '/'`
- `maxAge`: 8 horas (configurable vía `ADMIN_JWT_EXPIRES_IN`)

### JWT admin

- Secret: `ADMIN_JWT_SECRET` (distinto de `JWT_SECRET` de tenants)
- Payload: `{ sub: adminId, email, name }`
- Guard dedicado: `JwtAdminGuard` — lee **solo** cookie `admin_token`, no interfiere con `JwtStrategy` de tenants

### Login admin

```
POST /api/admin/auth/login
Body: { "email": "...", "password": "..." }
→ 200 { "admin": { "id", "email", "name" } }
→ Set-Cookie: admin_token=...
→ 401 { "message": "Credenciales inválidas" }
```

Reutilizar bcrypt y patrones de `AuthService.setCookie` / `AuthController.setCookie`, adaptados a `admin_token`.

---

## Seed (ÚNICO permitido)

**Solo** crear el usuario administrador de la plataforma al iniciar la aplicación si **no existe** ningún registro en `platform_admins`.

### Comportamiento idempotente

- Ejecutar en `OnModuleInit` de un `SeedService` o script `npm run seed`
- Si ya existe al menos un `platform_admin` → no hacer nada
- Si la tabla está vacía → crear uno con variables de entorno

### Variables de entorno del seed

```env
ADMIN_EMAIL=admin@mybusiness.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Platform Admin
```

- Password hasheado con bcrypt (mismo cost que tenant users)
- Log en consola solo al crear: `Platform admin seeded: admin@mybusiness.com`

### NO seedear

- ❌ Planes
- ❌ Tenants de demo
- ❌ Users de demo
- ❌ Roles (salvo que el módulo auth existente ya lo requiera para funcionar — en ese caso documentar, pero no poblar datos de negocio)

El admin creará tenants, planes y demás datos desde el panel o vía API.

---

## Lógica de negocio por endpoint

### `GET /api/admin/metrics`

Calcular desde PostgreSQL:

- `totalTenants` — COUNT tenants
- `activeTenants` — COUNT WHERE status = 'active'
- `trialTenants` — COUNT WHERE status = 'trial'
- `totalMrr` — SUM(plan.priceMonthly) WHERE tenant.status = 'active'
- `totalRevenue` — totalMrr × 12
- `revenueByPlan` — agrupar tenants activos por plan: `{ plan: plan.name, revenue, count }`
- `tenantsGrowth` — tenants creados por mes, últimos 6 meses, label mes en español (`Ene`, `Feb`, …)

Si no hay tenants/planes, devolver ceros y arrays vacíos (no error).

### `GET /api/admin/tenants`

Listar todos los tenants con:

- `ownerEmail` — email del user owner (primer user con rol owner/admin del tenant, o campo dedicado si se modela)
- `userCount` — COUNT users WHERE tenantId
- `mrr` — calculado según plan + status
- Orden sugerido: `createdAt DESC`

### `GET /api/admin/plans`

Listar planes con `tenantCount` = COUNT tenants por `planId`.

Si no hay planes en DB → `{ plans: [] }`.

---

## CORS y cookies (crítico para integración)

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

```typescript
app.enableCors({
  origin: config.get('CORS_ORIGIN', 'http://localhost:5173'),
  credentials: true,
});
app.use(cookieParser());
```

Global prefix: `app.setGlobalPrefix('api')`.

---

## Variables de entorno (.env)

```env
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mybusiness
# o: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# JWT tenant users (módulo auth existente)
JWT_SECRET=change-me-tenant-jwt
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE=604800000

# JWT platform admin
ADMIN_JWT_SECRET=dev-admin-secret-change-in-production
ADMIN_JWT_EXPIRES_IN=8h

# Seed único — platform admin
ADMIN_EMAIL=admin@mybusiness.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Platform Admin

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Estructura de módulos sugerida

Completar `mb-api` respetando lo existente y agregando:

```
mb-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── database/                    # TypeORM o Prisma + migraciones
│   ├── common/                      # guards, decorators, constants, filters
│   ├── auth/                        # EXISTENTE — adaptar a PostgreSQL + tenantId
│   ├── admin/                       # NUEVO — panel plataforma
│   │   ├── admin.module.ts
│   │   ├── admin-auth.controller.ts
│   │   ├── admin-auth.service.ts
│   │   ├── admin-tenants.controller.ts
│   │   ├── admin-metrics.controller.ts
│   │   ├── admin-plans.controller.ts
│   │   ├── guards/
│   │   │   └── jwt-admin.guard.ts
│   │   └── dto/
│   ├── tenants/
│   ├── plans/
│   ├── users/                       # si no existe completo, crear tenant-scoped
│   └── seeds/
│       └── seed.service.ts          # SOLO platform admin
├── docker-compose.yml               # postgres (opcional)
├── .env.example
└── README.md
```

---

## Requisitos técnicos

- NestJS 10+, TypeScript strict
- PostgreSQL 15+
- ORM: TypeORM o Prisma (elegir uno, migraciones versionadas, **no** `synchronize: true` en producción)
- Validación: class-validator + class-transformer
- Passwords: bcrypt
- `@nestjs/config` con validación de env
- Scripts npm: `start:dev`, `migration:run`, `seed` (seed idempotente solo admin)
- README con: levantar Postgres, migrar, seed, `start:dev`, credenciales admin, verificación con frontend

---

## Integración con el frontend (pasos post-backend)

Una vez implementado el backend:

### 1. Actualizar `mb-web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Eliminar mocks en el frontend

- Borrar `mb-web/src/app/api/admin/**` (Route Handlers mock de Next.js)
- Borrar `mb-web/src/lib/mockData.ts`
- Mantener `mb-web/src/lib/adminApi.ts` con `withCredentials: true`

### 3. Verificación manual

1. Levantar PostgreSQL + migraciones + seed
2. `npm run start:dev` en `mb-api` (puerto 3000)
3. `npm run dev` en `mb-web` (puerto 5173)
4. Ir a `http://localhost:5173/admin/login`
5. Login: `admin@mybusiness.com` / `admin123`
6. Dashboard debe mostrar métricas reales (ceros si DB vacía salvo admin)
7. Crear manualmente un plan y un tenant vía DB o API futura → deben aparecer en el panel

---

## Checklist de entregables

- [ ] PostgreSQL conectado con migraciones
- [ ] Módulo `auth` existente adaptado a PostgreSQL (sin romper contrato tenant)
- [ ] Módulo `admin` con todos los endpoints del contrato
- [ ] Cookie `admin_token` funcionando cross-origin con frontend :5173
- [ ] Seed idempotente: **solo** `platform_admins` si tabla vacía
- [ ] Sin seeds de planes, tenants ni users de demo
- [ ] README completo
- [ ] Frontend conectado sin mocks

---

## Notas para el implementador

1. Priorizar que el **panel admin funcione end-to-end** aunque tenants/plans estén vacíos.
2. El módulo `auth` en `src/auth/` es la base para tenant auth — **reutilizar y ajustar**, no reemplazar.
3. Platform admin y tenant users son dominios distintos: dos cookies, dos secrets JWT, dos guards.
4. Multi-tenancy: toda query tenant-scoped futura debe filtrar por `tenant_id`; el admin de plataforma accede cross-tenant solo vía rutas `/api/admin/**`.
5. Mensajes de error en español para login admin y validaciones.
