import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const DELETE = async (req: Request, ctx: Ctx) => {
  const { id, userId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/organizations/${id}/members/${userId}`
  );
};
