import { proxyRequest } from '@/lib/proxy-request';

export const PATCH = (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => params.then(({ id }) => proxyRequest(req, `/organizations/members/${id}`));
