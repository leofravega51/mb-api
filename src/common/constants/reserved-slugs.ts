/** Subdominios reservados de la plataforma (no pueden usarse como slug de tenant). */
export const RESERVED_TENANT_SLUGS = new Set([
  'www',
  'admin',
  'api',
  'app',
  'static',
  'mail',
  'cdn',
  'status',
  'support',
  'help',
  'docs',
  'blog',
]);

export const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
