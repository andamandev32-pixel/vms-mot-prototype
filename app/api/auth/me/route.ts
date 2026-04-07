import { NextRequest } from "next/server";
import { requireAuth, isAuthUser, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const result = await requireAuth(request);
  if (!isAuthUser(result)) return result;
  return apiSuccess({ user: result });
}
