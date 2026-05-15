// visitor-approval-result / visitor-approval-rejected — Flex Message แจ้งผลอนุมัติ / ปฏิเสธ

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexBubble } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface ApprovalResultParams {
  approved: boolean;
  bookingCode: string;
  dateTime: string;
  approverName: string;
  approvedAt: string;
  rejectedReason?: string;
}

export async function buildApprovalResultMessage(
  params: ApprovalResultParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const stateId = params.approved
    ? "visitor-approval-result"
    : "visitor-approval-rejected";
  const template = (await getFlexTemplateFromDB(stateId))!;

  const vars: Record<string, string> = {
    bookingCode: params.bookingCode,
    dateTime: params.dateTime,
    approverName: params.approverName,
    approvedAt: params.approvedAt,
    ...(params.rejectedReason ? { rejectedReason: params.rejectedReason } : {}),
  };

  const bubble = buildFlexBubble(template, vars, options);

  return {
    type: "flex",
    altText: params.approved
      ? `นัดหมาย ${params.bookingCode} อนุมัติแล้ว ✅`
      : `นัดหมาย ${params.bookingCode} ถูกปฏิเสธ ❌`,
    contents: bubble,
  };
}
