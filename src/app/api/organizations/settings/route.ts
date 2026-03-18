import { proxyRequest } from '@/lib/proxy-request';

export const GET = (req: Request) =>
  proxyRequest(req, '/v1/organizations/settings');
export const PATCH = (req: Request) =>
  proxyRequest(req, '/v1/organizations/settings');
