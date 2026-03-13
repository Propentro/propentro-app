import { proxyRequest } from '@/lib/proxy-request';

export const POST = (req: Request) =>
  proxyRequest(req, '/organizations/members/invite');
