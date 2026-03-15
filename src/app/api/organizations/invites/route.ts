import { proxyRequest } from '@/lib/proxy-request';

export const GET = (req: Request) =>
  proxyRequest(req, '/organizations/members/invites');
