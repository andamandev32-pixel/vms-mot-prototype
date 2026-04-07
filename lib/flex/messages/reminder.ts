// visitor-reminder — Flex Message แจ้งเตือนนัดหมายล่วงหน้า

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface ReminderParams {
  date: string;
  timeSlot: string;
  hostName: string;
  location: string;
}

export function buildReminderMessage(
  params: ReminderParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-reminder")!;
  return buildFlexMessage(
    template,
    { ...params },
    `แจ้งเตือนนัดหมาย ${params.date}`,
    options
  );
}
