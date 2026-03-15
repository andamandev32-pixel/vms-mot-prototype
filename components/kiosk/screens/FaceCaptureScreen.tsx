"use client";

import { ChevronLeft, Camera, User, Video, VideoOff, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface FaceCaptureScreenProps {
  locale: "th" | "en";
  wifiEnabled: boolean;
  onConfirm: (wifiAccepted: boolean) => void;
  onBack: () => void;
  /** WiFi SSID from kiosk config */
  wifiSsid?: string;
  /** WiFi validity label from kiosk config */
  wifiValidUntil?: string;
}

export default function FaceCaptureScreen({ locale, wifiEnabled, onConfirm, onBack, wifiSsid, wifiValidUntil }: FaceCaptureScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camState, setCamState] = useState<"idle" | "streaming" | "captured" | "no-face" | "error">("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [wifiAccepted, setWifiAccepted] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCamState("idle");
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 320 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState("streaming");
    } catch {
      setCamState("error");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropSize = Math.min(vw, vh);
    const sx = (vw - cropSize) / 2;
    const sy = (vh - cropSize) / 2;
    ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    setCamState("captured");
    stopStream();
  }, [stopStream]);

  /** Simulate "no face detected" scenario for demo */
  const simulateNoFace = useCallback(() => {
    setCamState("no-face");
    setCapturedImage(null);
    stopStream();
  }, [stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const isCaptured = camState === "captured";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={() => { stopStream(); onBack(); }} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <Camera size={14} className="text-[#1B2B5E]" />
        <h1 className="text-[11px] font-bold text-[#1B2B5E]">
          {locale === "th" ? "ถ่ายภาพใบหน้า" : "Face Capture"}
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center pt-2 px-3 gap-2">
        {/* Camera / Captured frame */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
            {camState === "streaming" && (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            {isCaptured && capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
            {(camState === "idle" || camState === "error") && (
              <User size={36} className="text-gray-600" />
            )}
            {camState === "no-face" && (
              <div className="flex flex-col items-center gap-1">
                <AlertTriangle size={28} className="text-amber-400" />
              </div>
            )}
          </div>

          {/* Face guide overlay */}
          {!isCaptured && camState !== "no-face" && (
            <div className="absolute inset-2">
              <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-[#2E3192] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-[#2E3192] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-[#2E3192] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-[#2E3192] rounded-br-lg" />
            </div>
          )}

          {/* Captured checkmark */}
          {isCaptured && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">✓</div>
            </div>
          )}

          {/* Scanning animation */}
          {camState === "streaming" && (
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2E3192] to-transparent animate-[scanLine_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Status text */}
        <div className="text-center space-y-0.5">
          {camState === "no-face" ? (
            <>
              <h2 className="text-[11px] font-bold text-amber-600">
                {locale === "th" ? "ไม่พบใบหน้า" : "No face detected"}
              </h2>
              <p className="text-[8px] text-gray-400">
                {locale === "th" ? "กรุณาถ่ายภาพใหม่ให้เห็นใบหน้าชัดเจน" : "Please retake with face clearly visible"}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[11px] font-bold text-[#1B2B5E]">
                {isCaptured
                  ? (locale === "th" ? "ถ่ายภาพสำเร็จ" : "Photo Captured")
                  : (locale === "th" ? "กรุณามองกล้อง" : "Please look at the camera")}
              </h2>
              <p className="text-[8px] text-gray-400">
                {isCaptured
                  ? (locale === "th" ? "ตรวจสอบภาพและยืนยัน" : "Review and confirm")
                  : camState === "streaming"
                  ? (locale === "th" ? "จัดใบหน้าให้อยู่ในกรอบ" : "Position your face within the frame")
                  : camState === "error"
                  ? (locale === "th" ? "ไม่สามารถเปิดกล้องได้" : "Cannot access camera")
                  : (locale === "th" ? "กดเปิดกล้องหรือใช้ปุ่มจำลอง" : "Open camera or use simulate button")}
              </p>
            </>
          )}
        </div>

        {/* WiFi option — only show when captured AND purpose allows WiFi */}
        {isCaptured && wifiEnabled && (
          <div className="w-full max-w-[220px] p-2 rounded-xl bg-gradient-to-br from-[#2E4A8A]/5 to-[#1B2B5E]/5 border border-[#2E4A8A]/10 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Wifi size={12} className="text-[#2E4A8A]" />
              <span className="text-[9px] font-bold text-[#1B2B5E]">
                {locale === "th" ? "WiFi สำหรับผู้มาติดต่อ" : "Guest WiFi"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] text-gray-400">
              <span>{wifiSsid || "MOTS-Guest"}</span>
              <span>{locale === "th" ? `ถึง ${wifiValidUntil || "16:30 น."}` : `until ${wifiValidUntil || "16:30"}`}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setWifiAccepted(true)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                  wifiAccepted
                    ? "bg-[#2E4A8A] text-white shadow"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Wifi size={10} />
                {locale === "th" ? "รับ WiFi" : "Accept"}
              </button>
              <button
                onClick={() => setWifiAccepted(false)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                  !wifiAccepted
                    ? "bg-gray-600 text-white shadow"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <WifiOff size={10} />
                {locale === "th" ? "ไม่ต้องการ" : "No thanks"}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {camState === "idle" && (
            <button
              onClick={startCamera}
              className="w-full py-2 rounded-xl bg-[#1B2B5E] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1B2B5E]/90 active:scale-[0.98] transition-all"
            >
              <Video size={13} />
              {locale === "th" ? "เปิดกล้อง Webcam" : "Open Webcam"}
            </button>
          )}
          {camState === "streaming" && (
            <>
              <button
                onClick={capturePhoto}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#252880] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all"
              >
                <Camera size={13} />
                {locale === "th" ? "ถ่ายภาพ" : "Capture Photo"}
              </button>
              {/* Demo: simulate no face */}
              <button
                onClick={simulateNoFace}
                className="w-full py-1 rounded-xl text-[8px] text-gray-300 hover:text-gray-500 transition-all"
              >
                Demo: {locale === "th" ? "จำลองไม่พบใบหน้า" : "Simulate no face"}
              </button>
            </>
          )}
          {isCaptured && (
            <>
              <button
                onClick={() => { stopStream(); onConfirm(wifiEnabled ? wifiAccepted : false); }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all"
              >
                ✓ {locale === "th" ? "ยืนยันและดำเนินการต่อ" : "Confirm & Continue"}
              </button>
              <button
                onClick={startCamera}
                className="w-full py-1 rounded-xl text-[9px] text-gray-500 hover:bg-gray-50 transition-all"
              >
                {locale === "th" ? "ถ่ายใหม่" : "Retake"}
              </button>
            </>
          )}
          {camState === "no-face" && (
            <>
              <button
                onClick={startCamera}
                className="w-full py-2 rounded-xl bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all"
              >
                <Camera size={13} />
                {locale === "th" ? "ถ่ายภาพใหม่" : "Retake Photo"}
              </button>
            </>
          )}
          {camState === "error" && (
            <button
              onClick={startCamera}
              className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-[10px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-all"
            >
              <VideoOff size={12} />
              {locale === "th" ? "ลองเปิดกล้องอีกครั้ง" : "Retry Camera"}
            </button>
          )}

          {/* Demo fallback */}
          {!isCaptured && camState !== "no-face" && (
            <button
              onClick={() => { stopStream(); onConfirm(wifiEnabled ? wifiAccepted : false); }}
              className="w-full py-1 rounded-xl text-[9px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              {locale === "th" ? "จำลองถ่ายภาพ (Demo)" : "Simulate Capture (Demo)"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
