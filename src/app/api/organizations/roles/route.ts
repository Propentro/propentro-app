import { proxyRequest } from '@/lib/proxy-request';

export const GET = (req: Request) =>
  proxyRequest(req, '/v1/organizations/roles');
export const POST = (req: Request) =>
  proxyRequest(req, '/v1/organizations/roles');
