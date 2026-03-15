/**
 * Kiosk Audio Configuration — TTS messages per state
 *
 * Flutter dev: Use with flutter_tts package
 * → Set language to "th-TH" or "en-US" based on locale
 */

import type { AudioCue, KioskStateType } from "./kiosk-types";

/** Audio cues mapped to state transitions */
export const audioCues: Partial<Record<KioskStateType, AudioCue>> = {
  PDPA_CONSENT: {
    th: "กรุณาอ่านและยอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล คะ",
    en: "Please read and accept the privacy policy.",
  },
  SELECT_ID_METHOD: {
    th: "เลือกเอกสารการยืนยันตัวตน คะ",
    en: "Please select your identification method.",
  },
  ID_VERIFICATION: {
    th: "กรุณายืนยันตัวตน คะ",
    en: "Please verify your identity.",
  },
  SELECT_PURPOSE: {
    th: "เลือกรายการเข้าพื้นที่ คะ",
    en: "Please select your visit purpose.",
  },
  FACE_CAPTURE: {
    th: "กรุณาถ่ายภาพใบหน้า คะ",
    en: "Please look at the camera for face photo.",
  },
  SUCCESS: {
    th: "ทำรายการเสร็จเรียบร้อยค่ะ",
    en: "Registration completed successfully.",
  },
  QR_SCAN: {
    th: "สแกน QR Code นัดหมาย คะ",
    en: "Please scan your appointment QR Code.",
  },
  ERROR: {
    th: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง คะ",
    en: "An error occurred. Please try again.",
  },
  TIMEOUT: {
    th: "หมดเวลาทำรายการ กรุณาเริ่มใหม่ คะ",
    en: "Session timed out. Please start again.",
  },
};

/** Get audio cue for current state */
export function getAudioCue(stateType: KioskStateType): AudioCue | undefined {
  return audioCues[stateType];
}

/**
 * Hook for Web Speech API (browser TTS)
 * Call this in React component to play audio
 */
export function speakText(text: string, lang: "th" | "en" = "th"): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel(); // Stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "th" ? "th-TH" : "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

/** Stop ongoing speech */
export function stopSpeech(): void {
  if (typeof window === "undefined") return;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
