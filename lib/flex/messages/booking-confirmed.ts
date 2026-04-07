// visitor-booking-confirmed — Flex Message ยืนยันการจองนัดหมาย + QR Code

import { getFlexTemplate } from "@/lib/line-flex-template-data";
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

export function buildBookingConfirmedMessage(
  params: BookingConfirmedParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-booking-confirmed")!;
  return buildFlexMessage(
    template,
    { ...params },
    `นัดหมาย ${params.bookingCode} ยืนยันแล้ว`,
    options
  );
}
