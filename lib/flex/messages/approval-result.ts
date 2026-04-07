// visitor-approval-result — Flex Message แจ้งผลอนุมัติ / ปฏิเสธ

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexBubble } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";
import type { FlexTemplateConfig } from "@/lib/line-flex-template-data";

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
  const template = (await getFlexTemplateFromDB("visitor-approval-result"))!;

  // Override template for rejection case
  const effectiveTemplate: FlexTemplateConfig = params.approved
    ? template
    : {
        ...template,
        headerTitle: "นัดหมายถูกปฏิเสธ ❌",
        headerColor: "red",
        statusBadgeText: "ปฏิเสธ",
        statusBadgeType: "rejected",
        rows: [
          ...template.rows,
          ...(params.rejectedReason
            ? [
                {
                  id: "r-reason",
                  label: "เหตุผล",
                  variable: "rejectedReason",
                  previewValue: "",
                  enabled: true,
                  sortOrder: 10,
                },
              ]
            : []),
        ],
        infoBox: params.approved
          ? template.infoBox
          : {
              text: "หากต้องการเข้าพบ กรุณาสร้างนัดหมายใหม่",
              color: "orange" as const,
              enabled: true,
            },
        buttons: params.approved
          ? template.buttons
          : [
              {
                id: "b-rebook",
                label: "สร้างนัดหมายใหม่",
                variant: "green" as const,
                enabled: true,
                sortOrder: 1,
              },
            ],
      };

  const vars: Record<string, string> = {
    bookingCode: params.bookingCode,
    dateTime: params.dateTime,
    approverName: params.approverName,
    approvedAt: params.approvedAt,
    ...(params.rejectedReason ? { rejectedReason: params.rejectedReason } : {}),
  };

  const bubble = buildFlexBubble(effectiveTemplate, vars, options);

  return {
    type: "flex",
    altText: params.approved
      ? `นัดหมาย ${params.bookingCode} อนุมัติแล้ว ✅`
      : `นัดหมาย ${params.bookingCode} ถูกปฏิเสธ ❌`,
    contents: bubble,
  };
}
