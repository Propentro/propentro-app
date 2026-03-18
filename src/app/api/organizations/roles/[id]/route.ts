import { proxyRequest } from '@/lib/proxy-request';

export const PATCH = (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  params.then(({ id }) => proxyRequest(req, `/v1/organizations/roles/${id}`));

export const DELETE = (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  params.then(({ id }) => proxyRequest(req, `/v1/organizations/roles/${id}`));
