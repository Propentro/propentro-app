import { proxyRequest } from '@/lib/proxy-request';

export const GET = (req: Request) =>
  proxyRequest(req, '/organizations/settings');
export const PATCH = (req: Request) =>
  proxyRequest(req, '/organizations/settings');
