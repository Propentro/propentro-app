import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = (req: Request, { params }: Ctx) =>
  params.then(({ id }) => proxyRequest(req, `/v1/organizations/roles/${id}`));

export const PATCH = (req: Request, { params }: Ctx) =>
  params.then(({ id }) => proxyRequest(req, `/v1/organizations/roles/${id}`));

export const DELETE = (req: Request, { params }: Ctx) =>
  params.then(({ id }) => proxyRequest(req, `/v1/organizations/roles/${id}`));
