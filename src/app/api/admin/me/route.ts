import { adminProxyRequest } from '@/lib/admin-proxy-request';

export const GET = (req: Request) =>
  adminProxyRequest(req, '/v1/admin/me');
