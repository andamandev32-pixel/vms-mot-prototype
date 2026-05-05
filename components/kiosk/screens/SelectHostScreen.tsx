"use client";

import { ChevronLeft, Globe, Search, SkipForward, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { HostStaffOption, VisitPurposeOption } from "@/lib/kiosk/kiosk-types";
import { staffMembers } from "@/lib/mock-data";

interface SelectHostScreenProps {
  locale: "th" | "en";
  selectedPurpose?: VisitPurposeOption;
  selectedDepartmentId?: number;
  /** บังคับเลือก host (จากกฎ purpose×department.requirePersonName) — ถ้า true จะซ่อนปุ่มข้าม */
  required?: boolean;
  onSelect: (host: HostStaffOption) => void;
  onSkip: () => void;
  onBack: () => void;
  onChangeLocale?: () => void;
}

function toHostOption(s: typeof staffMembers[number]): HostStaffOption {
  return {
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    position: s.position,
    departmentId: s.department.id,
    departmentName: s.department.name,
    avatarUrl: s.avatar,
  };
}

export default function SelectHostScreen({
  locale,
  selectedPurpose,
  selectedDepartmentId,
  required = false,
  onSelect,
  onSkip,
  onBack,
  onChangeLocale,
}: SelectHostScreenProps) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<number | null>(null);

  const allHosts = useMemo(
    () => staffMembers.filter((s) => s.status === "active").map(toHostOption),
    []
  );

  const hostsForDept = useMemo(() => {
    if (!selectedDepartmentId) return allHosts;
    const filtered = allHosts.filter((h) => h.departmentId === selectedDepartmentId);
    return filtered.length > 0 ? filtered : allHosts;
  }, [allHosts, selectedDepartmentId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hostsForDept;
    return hostsForDept.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.nameEn.toLowerCase().includes(q) ||
        (h.position || "").toLowerCase().includes(q)
    );
  }, [hostsForDept, query]);

  const handlePick = (host: HostStaffOption) => {
    setPickedId(host.id);
    setTimeout(() => onSelect(host), 200);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>
        <UserRound size={14} className="text-[#1B2B5E]" />
        <div className="flex-1">
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "เลือกผู้ที่ต้องการพบ" : "Select Host Staff"}
            {required && (
              <span className="ml-1 text-red-500" title={locale === "th" ? "บังคับเลือก" : "Required"}>*</span>
            )}
          </h1>
          <p className="text-[8px] text-gray-400">
            {required
              ? locale === "th" ? "ตามกฎต้องระบุเจ้าหน้าที่ผู้รับติดต่อ" : "Required by policy — must select a host"
              : locale === "th" ? "เลือกเจ้าหน้าที่ผู้รับติดต่อ (ไม่บังคับ)" : "Choose the staff you wish to meet (optional)"}
          </p>
        </div>
        {onChangeLocale && (
          <button
            onClick={onChangeLocale}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300 text-[9px] font-bold text-[#2E3192] hover:bg-gray-50"
          >
            <Globe size={9} />
            {locale === "th" ? "EN" : "TH"}
          </button>
        )}
      </header>

      {/* Selected purpose context */}
      {selectedPurpose && (
        <div className="mx-3 mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B2B5E]/5 border border-[#1B2B5E]/10">
          <span className="text-sm shrink-0">{selectedPurpose.icon}</span>
          <p className="text-[9px] text-[#1B2B5E] font-medium truncate">{selectedPurpose.name}</p>
          <span className="text-[8px] text-gray-400 shrink-0">{selectedPurpose.nameEn}</span>
        </div>
      )}

      {/* Search */}
      <div className="px-3 mt-1.5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-[#2E3192]">
          <Search size={11} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === "th" ? "ค้นหาชื่อ / ตำแหน่ง" : "Search name / position"}
            className="flex-1 bg-transparent outline-none text-[10px] text-[#1B2B5E] placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Host list */}
      <main className="flex-1 px-3 py-1.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-[10px]">
            {locale === "th" ? "ไม่พบเจ้าหน้าที่" : "No staff found"}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((h) => {
              const isPicked = pickedId === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => handlePick(h)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-left active:scale-[0.99]",
                    isPicked
                      ? "border-[#2E3192] bg-[#2E3192]/5 shadow-md"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-[#1B2B5E]/10 flex items-center justify-center shrink-0">
                    <UserRound size={13} className="text-[#1B2B5E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[10px] font-bold leading-tight truncate",
                        isPicked ? "text-[#2E3192]" : "text-[#1B2B5E]"
                      )}
                    >
                      {h.name}
                    </p>
                    <p className="text-[7.5px] text-gray-400 leading-tight truncate">{h.nameEn}</p>
                    {h.position && (
                      <p className="text-[7.5px] text-gray-500 leading-tight truncate">
                        {h.position}
                        {h.departmentName ? ` · ${h.departmentName}` : ""}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Skip footer — ซ่อนถ้า required */}
      {required ? (
        <footer className="px-3 py-2 border-t border-red-100 bg-red-50">
          <p className="text-center text-[9px] font-medium text-red-600">
            {locale === "th"
              ? "วัตถุประสงค์/แผนกที่เลือกบังคับให้ระบุเจ้าหน้าที่ผู้รับติดต่อ"
              : "Selected purpose/department requires specifying a host staff"}
          </p>
        </footer>
      ) : (
        <footer className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onSkip}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-[10px] font-bold text-gray-500 hover:bg-gray-100 active:scale-[0.99]"
          >
            <SkipForward size={11} />
            {locale === "th" ? "ข้าม (ไม่ระบุผู้ที่ต้องการพบ)" : "Skip (no specific host)"}
          </button>
        </footer>
      )}
    </div>
  );
}
