"use client";

import { Shield } from "lucide-react";

/**
 * Rich Menu State 1: Pre-Registration
 * Shown when user first adds the LINE OA as friend (before registration).
 * Simple banner: Logo + "ลงทะเบียนผู้ใช้งาน / Registration Now" button
 * Reference: Screenshot 1 — ADVICS pre-registration rich menu
 */
export default function NewFriendRichMenu({ onRegister }: { onRegister?: () => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto">
        {/* Rich Menu Container */}
        <div className="bg-white shadow-[0_-6px_30px_rgba(0,0,0,0.15)] overflow-hidden border-t border-gray-200">
          {/* Main Content — Logo + Registration Button */}
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Logo area */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Shield size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-primary-800 tracking-tight leading-tight">eVMES MOT</h3>
                <p className="text-[10px] text-text-muted leading-tight truncate">Visitor Management System</p>
              </div>
            </div>

            {/* Registration Button */}
            <button onClick={onRegister} className="flex-shrink-0">
              <div className="bg-[#06C755] hover:bg-[#05b34c] active:scale-95 transition-all text-white rounded-xl px-4 py-2.5 shadow-md cursor-pointer">
                <p className="text-[10px] font-medium text-white/80 leading-tight">ลงทะเบียนผู้ใช้งาน</p>
                <p className="text-sm font-bold leading-tight">Registration Now</p>
              </div>
            </button>
          </div>

          {/* Bottom Menu Bar — simulates LINE menu tab */}
          <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-t border-gray-200">
            <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" />
                <rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" />
                <rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" />
                <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-500">MENU ▾</span>
          </div>
        </div>
      </div>
    </div>
  );
}
