import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/organizations/${id}`);
};

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/organizations/${id}`);
};
