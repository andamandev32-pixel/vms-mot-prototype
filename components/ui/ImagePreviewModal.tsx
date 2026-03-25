"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { X, Download, Loader2 } from "lucide-react";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

/** ลายน้ำ "APDev" ทั้งภาพ — tiled, หมุน -30°, opacity ~22% */
function addWatermarkAndDownload(src: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark settings
      const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
      const fontSize = Math.max(24, Math.round(diagonal * 0.045));
      const stepX = fontSize * 5;
      const stepY = fontSize * 3.5;
      const angle = (-30 * Math.PI) / 180;

      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw tiled watermark with padding beyond canvas for rotation coverage
      const pad = diagonal * 0.5;
      for (let y = -pad; y < canvas.height + pad; y += stepY) {
        for (let x = -pad; x < canvas.width + pad; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          // White text with stroke for visibility on all backgrounds
          ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
          ctx.fillText("APDev", 0, 0);
          ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
          ctx.lineWidth = 1;
          ctx.strokeText("APDev", 0, 0);
          ctx.restore();
        }
      }

      // Export and download
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Failed to create blob")); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export function ImagePreviewModal({ open, onClose, src, alt }: ImagePreviewModalProps) {
  const [downloading, setDownloading] = useState(false);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const ext = src.split(".").pop() || "png";
      const name = alt.replace(/[^a-zA-Z0-9ก-๙\s-]/g, "").trim().replace(/\s+/g, "_");
      await addWatermarkAndDownload(src, `${name}_APDev.${ext === "jpg" ? "png" : ext}`);
    } catch (err) {
      console.error("Watermark download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [src, alt]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative animate-in fade-in zoom-in-95 flex flex-col items-center gap-4 max-w-[94vw] max-h-[94vh]">
        {/* Top action bar */}
        <div className="flex items-center gap-3 self-end">
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-white/90 text-gray-800 hover:bg-white shadow-lg
              disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {downloading ? "กำลังบันทึก..." : "บันทึกภาพ"}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-lg transition-all"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image */}
        <div className="overflow-auto rounded-2xl shadow-2xl bg-white/5">
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[82vh] object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Caption */}
        <p className="text-white/60 text-sm font-medium">{alt}</p>
      </div>
    </div>
  );
}
