import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}`);
};
