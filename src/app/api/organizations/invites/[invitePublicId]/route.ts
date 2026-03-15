import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ invitePublicId: string }> };

export const DELETE = async (req: Request, ctx: Ctx) => {
  const { invitePublicId } = await ctx.params;
  return proxyRequest(
    req,
    `/organizations/members/invites/${invitePublicId}`
  );
};
