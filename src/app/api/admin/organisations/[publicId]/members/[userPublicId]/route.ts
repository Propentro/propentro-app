import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ publicId: string; userPublicId: string }> };

export const DELETE = async (req: Request, ctx: Ctx) => {
  const { publicId, userPublicId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/organisations/${publicId}/members/${userPublicId}`
  );
};
