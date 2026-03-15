import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ publicId: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { publicId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/users/${publicId}/reactivate`
  );
};
