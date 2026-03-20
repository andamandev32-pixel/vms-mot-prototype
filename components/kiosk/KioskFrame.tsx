"use client";

import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HardwareDevice } from "@/lib/kiosk/kiosk-types";
import { getDeviceInfo } from "@/lib/kiosk/kiosk-device-map";

interface KioskFrameProps {
  children: React.ReactNode;
  activeDevice?: HardwareDevice | null;
  showLabels?: boolean;
  className?: string;
  machineName?: string;
  version?: string;
  onSettingsClick?: () => void;
}

/*
 * KioskFrame — proportional to real kiosk reference
 *
 * Layout:
 *   Total width  = 360px
 *   Upper body   = camera(30px) + content row (screen 9:16 + device panel 68px)
 *   Bottom base  = 38% of upper height → gray recessed panel
 *
 * Screen: portrait 9:16 via aspect-ratio CSS
 * Body : white / light-gray gradient
 * Devices: black panel, right side
 * Base : gray gradient with recessed counter
 */
export default function KioskFrame({
  children,
  activeDevice = null,
  machineName = "KIOSK-01",
  version = "v1.0.0",
  className,
  onSettingsClick,
}: KioskFrameProps) {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="relative" style={{ width: 360 }}>
        {/* ── Upper body — white shell ── */}
        <div className="relative bg-gradient-to-b from-white to-[#EDEDED] rounded-t-[20px] shadow-2xl border border-gray-300 overflow-hidden">
          {/* Camera — dark pill centered */}
          <div className="flex justify-center py-2">
            <div
              className={cn(
                "w-11 h-[14px] rounded-full flex items-center justify-center transition-all duration-500",
                activeDevice === "camera"
                  ? "bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.6)]"
                  : "bg-gray-800"
              )}
            >
              <div
                className={cn(
                  "w-[7px] h-[7px] rounded-full",
                  activeDevice === "camera" ? "bg-white animate-pulse" : "bg-gray-600"
                )}
              />
            </div>
          </div>

          {/* Content row: Screen + Device panel */}
          <div className="flex px-2 pb-2 gap-[6px]">
            {/* Screen — 9:16 portrait */}
            <div
              className="flex-1 rounded-md border-[3px] border-[#1a1a1a] overflow-hidden relative bg-white"
              style={{ aspectRatio: "9 / 16" }}
            >
              {/* Content fills screen exactly */}
              <div className="absolute inset-0 overflow-hidden">
                {children}
              </div>

              {/* Bottom status bar */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#2E3192]/90 flex items-center justify-between px-2 z-20">
                <span className="text-[7px] text-white/70 font-medium">{machineName}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] text-white/50">{version}</span>
                  {onSettingsClick && (
                    <button
                      onClick={onSettingsClick}
                      className="flex items-center justify-center text-white/30 hover:text-white/80 transition-colors"
                      title="Settings"
                    >
                      <Settings size={8} />
                    </button>
                  )}
                </div>
              </div>

              {/* On-screen device overlay */}
              {activeDevice && <DeviceOverlay device={activeDevice} />}
            </div>

            {/* Right device panel — black */}
            <div className="w-[68px] bg-[#1a1a1a] rounded-md flex flex-col items-center py-3 gap-1">
              <DeviceSlot device="qr-reader" active={activeDevice === "qr-reader"} />
              <DeviceSlot device="id-reader" active={activeDevice === "id-reader"} />
              <DeviceSlot device="passport-reader" active={activeDevice === "passport-reader"} />
              <DeviceSlot device="printer" active={activeDevice === "printer"} />
            </div>
          </div>
        </div>

        {/* ── Bottom base — gray panel ── */}
        <div
          className="bg-gradient-to-b from-[#B8B8B8] to-[#A8A8A8] rounded-b-[20px] shadow-lg border border-gray-300 border-t-[3px] border-t-gray-400/60"
          style={{ height: 180 }}
        >
          {/* Recessed counter area */}
          <div className="mx-4 mt-3 h-[calc(100%-20px)] rounded-t-lg bg-gradient-to-b from-[#C8C8C8] to-[#BCBCBC] border border-gray-400/40 shadow-inner" />
        </div>
      </div>
    </div>
  );
}

/* ── Device Slot ── */
function DeviceSlot({ device, active }: { device: HardwareDevice; active?: boolean }) {
  const info = getDeviceInfo(device);
  if (!info) return null;

  const slotStyles: Record<string, string> = {
    "qr-reader": "w-10 h-10 rounded-md",
    "id-reader": "w-12 h-7 rounded-sm",
    "passport-reader": "w-10 h-10 rounded-md",
    printer: "w-12 h-7 rounded-sm",
  };

  return (
    <div className="flex flex-col items-center flex-1 justify-center">
      <div
        className={cn(
          "flex items-center justify-center border-2 transition-all duration-500",
          slotStyles[device],
          active
            ? "bg-gray-600 border-[#F97316] shadow-[0_0_10px_rgba(46,49,146,0.5)]"
            : "bg-gray-700/50 border-gray-600/40"
        )}
      >
        <span className={cn("text-xs", active ? "opacity-80" : "opacity-30")}>{info.icon}</span>
      </div>
    </div>
  );
}

/* ── On-Screen Device Overlay ── */
function DeviceOverlay({ device }: { device: HardwareDevice }) {
  const info = getDeviceInfo(device);
  if (!info) return null;

  const positionMap: Record<string, { position: string; arrowDir: "up" | "right" }> = {
    camera: { position: "top-2 left-1/2 -translate-x-1/2", arrowDir: "up" },
    "qr-reader": { position: "top-[15%] right-2", arrowDir: "right" },
    "id-reader": { position: "top-[38%] right-2", arrowDir: "right" },
    "passport-reader": { position: "top-[58%] right-2", arrowDir: "right" },
    printer: { position: "top-[78%] right-2", arrowDir: "right" },
  };

  const config = positionMap[device] || { position: "top-1/2 right-2", arrowDir: "right" };

  return (
    <div className={cn("absolute z-30", config.position)}>
      <div className="flex flex-col items-center gap-1">
        <div className="px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[9px] font-bold whitespace-nowrap shadow-[0_4px_14px_rgba(46,49,146,0.5)]">
          {info.icon} {info.name}
        </div>
        {config.arrowDir === "right" ? (
          <div className="flex items-center animate-[bounceRight_1s_ease-in-out_infinite]">
            <div className="flex gap-0.5 items-center text-[#F97316] drop-shadow-[0_0_6px_rgba(46,49,146,0.5)]">
              <span className="text-sm font-bold opacity-40">›</span>
              <span className="text-base font-bold opacity-70">›</span>
              <span className="text-lg font-bold">›</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-[bounceUp_1s_ease-in-out_infinite]">
            <div className="flex flex-col items-center text-[#F97316] drop-shadow-[0_0_6px_rgba(46,49,146,0.5)]">
              <span className="text-lg font-bold leading-none">‹</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
