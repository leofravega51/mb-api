import { ConfigService } from '@nestjs/config';

export function getRootDomain(config: ConfigService): string {
  return config.get<string>('ROOT_DOMAIN', 'localhost');
}

export function getAppPort(config: ConfigService): string {
  return config.get<string>('APP_PORT', '5173');
}

export function buildTenantSiteUrl(slug: string, config: ConfigService): string {
  const root = getRootDomain(config);
  const port = getAppPort(config);

  if (root === 'localhost' || root.startsWith('localhost:')) {
    const resolvedPort = root.includes(':') ? root.split(':')[1] : port;
    return `http://${slug}.localhost:${resolvedPort}`;
  }

  return `https://${slug}.${root}`;
}
