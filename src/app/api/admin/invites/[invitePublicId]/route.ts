import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ invitePublicId: string }> };

export const DELETE = async (req: Request, ctx: Ctx) => {
  const { invitePublicId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/invites/${invitePublicId}`
  );
};
