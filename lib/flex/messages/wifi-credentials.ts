// visitor-wifi-credentials — Flex Message ส่ง WiFi สำหรับผู้มาติดต่อ

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface WifiCredentialsParams {
  wifiSSID: string;
  wifiPassword: string;
  expiry: string;
  entryCode?: string;
}

export async function buildWifiCredentialsMessage(
  params: WifiCredentialsParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("visitor-wifi-credentials"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `WiFi: ${params.wifiSSID}`,
    options
  );
}
