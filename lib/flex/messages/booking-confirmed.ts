// visitor-booking-confirmed — Flex Message ยืนยันการจองนัดหมาย + QR Code

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface BookingConfirmedParams {
  bookingCode: string;
  purposeName: string;
  date: string;
  timeSlot: string;
  hostName: string;
  location: string;
}

export async function buildBookingConfirmedMessage(
  params: BookingConfirmedParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("visitor-booking-confirmed"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `นัดหมาย ${params.bookingCode} ยืนยันแล้ว`,
    options
  );
}
