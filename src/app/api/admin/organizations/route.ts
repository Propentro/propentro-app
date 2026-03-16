import { adminProxyRequest } from '@/lib/admin-proxy-request';

export const GET = (req: Request) =>
  adminProxyRequest(req, '/v1/admin/organizations');

export const POST = (req: Request) =>
  adminProxyRequest(req, '/v1/admin/organizations');
