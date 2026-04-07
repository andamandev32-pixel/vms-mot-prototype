// visitor-checkout — Flex Message ขอบคุณเมื่อ Check-out

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface CheckoutParams {
  entryCode?: string;
  checkinAt: string;
  checkoutAt: string;
  duration: string;
}

export async function buildCheckoutMessage(
  params: CheckoutParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("visitor-checkout"))!;
  return buildFlexMessage(
    template,
    { ...params },
    "Check-out สำเร็จ — ขอบคุณที่มาเยือน",
    options
  );
}
