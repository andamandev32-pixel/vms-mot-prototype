"use client";

import { ChevronLeft, Building2, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisitPurposeOption } from "@/lib/kiosk/kiosk-types";
import { mockKioskPurposes, purposeDepartmentMap as defaultPurposeDeptMap } from "@/lib/kiosk/kiosk-mock-data";
import { departments } from "@/lib/mock-data";
import { useState, useCallback } from "react";

interface SelectPurposeScreenProps {
  locale: "th" | "en";
  onSelect: (purpose: VisitPurposeOption) => void;
  onBack: () => void;
  /** Purposes resolved from kiosk config (overrides default mockKioskPurposes) */
  purposes?: VisitPurposeOption[];
  /** Purpose→dept mapping resolved from kiosk config */
  purposeDeptMap?: Record<string, string[]>;
}

const activeDepartments = departments.filter((d) => d.isActive);

export default function SelectPurposeScreen({ locale, onSelect, onBack, purposes, purposeDeptMap }: SelectPurposeScreenProps) {
  const [step, setStep] = useState<"purpose" | "department">("purpose");
  const [selectedPurpose, setSelectedPurpose] = useState<VisitPurposeOption | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);

  const resolvedPurposes = purposes ?? mockKioskPurposes;
  const resolvedDeptMap = purposeDeptMap ?? defaultPurposeDeptMap;

  // Get departments available for the selected purpose
  const getDepartmentsForPurpose = useCallback((purposeId: string) => {
    const deptIds = resolvedDeptMap[purposeId];
    if (!deptIds) return activeDepartments; // fallback: show all
    return activeDepartments.filter((d) => deptIds.includes(d.id));
  }, [resolvedDeptMap]);

  const handleSelectPurpose = (p: VisitPurposeOption) => {
    setSelectedPurpose(p);
    const availableDepts = getDepartmentsForPurpose(p.id);
    // Auto-select if only 1 department
    if (availableDepts.length === 1) {
      setSelectedDept(availableDepts[0].id);
      setTimeout(() => onSelect(p), 200);
    } else {
      setTimeout(() => setStep("department"), 150);
    }
  };

  const handleSelectDept = (deptId: string) => {
    setSelectedDept(deptId);
    if (selectedPurpose) {
      setTimeout(() => onSelect(selectedPurpose), 200);
    }
  };

  const selectedPurposeObj = selectedPurpose;

  // Departments filtered for the selected purpose
  const purposeDepartments = selectedPurpose
    ? getDepartmentsForPurpose(selectedPurpose.id)
    : activeDepartments;

  // Get unique floors sorted (from filtered departments)
  const floors = [...new Set(purposeDepartments.map((d) => d.floor))].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""));
    const numB = parseInt(b.replace(/\D/g, ""));
    return numA - numB;
  });

  const filteredDepartments = floorFilter
    ? purposeDepartments.filter((d) => d.floor === floorFilter)
    : purposeDepartments;

  // ── Step 1: Purpose selection (FIRST) ──
  if (step === "purpose") {
    return (
      <div className="flex flex-col h-full bg-white">
        <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
          <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-[11px] font-bold text-[#1B2B5E]">
              {locale === "th" ? "เลือกรายการเข้าพื้นที่" : "Select Visit Purpose"}
            </h1>
            <p className="text-[8px] text-gray-400">
              {locale === "th" ? "Select Visit Purpose" : "Choose the purpose of your visit"}
            </p>
          </div>
        </header>

        {/* Purpose grid */}
        <main className="px-3 py-1.5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1">
            {resolvedPurposes.map((p) => {
              const isSelected = selectedPurpose?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPurpose(p)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border-2 transition-all text-center active:scale-[0.97]",
                    isSelected
                      ? "border-[#2E3192] bg-[#2E3192]/5 shadow-md"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                  )}
                >
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <p className={cn(
                      "text-[9px] font-bold leading-tight",
                      isSelected ? "text-[#2E3192]" : "text-[#1B2B5E]"
                    )}>
                      {p.name}
                    </p>
                    <p className="text-[7px] text-gray-400 leading-tight">
                      {p.nameEn}
                    </p>
                  </div>
                  {p.wifiEnabled && (
                    <span className="flex items-center gap-0.5 text-[7px] text-blue-400">
                      <Wifi size={8} /> WiFi
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── Step 2: Department selection (only if multiple departments) ──
  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={() => { setStep("purpose"); setFloorFilter(null); }} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <Building2 size={14} className="text-[#1B2B5E]" />
        <div>
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "เลือกหน่วยงานที่ติดต่อ" : "Select Department"}
          </h1>
          <p className="text-[8px] text-gray-400">
            {locale === "th" ? "Select Department" : "Choose the department to visit"}
          </p>
        </div>
      </header>

      {/* Selected purpose badge */}
      {selectedPurposeObj && (
        <div className="mx-3 mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B2B5E]/5 border border-[#1B2B5E]/10">
          <span className="text-sm shrink-0">{selectedPurposeObj.icon}</span>
          <p className="text-[9px] text-[#1B2B5E] font-medium truncate">
            {selectedPurposeObj.name}
          </p>
          <span className="text-[8px] text-gray-400 shrink-0">{selectedPurposeObj.nameEn}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Floor filter — vertical left column */}
        <div className="flex flex-col gap-0.5 px-1 py-1.5 border-r border-gray-100 overflow-y-auto shrink-0">
          <button
            onClick={() => setFloorFilter(null)}
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[7px] font-bold whitespace-nowrap transition-all",
              !floorFilter
                ? "bg-[#2E3192] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {locale === "th" ? "ทั้งหมด" : "All"}
          </button>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setFloorFilter(floorFilter === floor ? null : floor)}
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[7px] font-bold whitespace-nowrap transition-all",
                floorFilter === floor
                  ? "bg-[#2E3192] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {floor}
            </button>
          ))}
        </div>

        {/* Department grid */}
        <main className="flex-1 px-2 py-1.5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1">
            {filteredDepartments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => handleSelectDept(dept.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-lg border transition-all text-left active:scale-[0.98]",
                  selectedDept === dept.id
                    ? "border-[#2E3192] bg-[#2E3192]/5 shadow-md"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                )}
              >
                <p className={cn(
                  "text-[8px] font-bold leading-tight",
                  selectedDept === dept.id ? "text-[#2E3192]" : "text-[#2E3192]"
                )}>
                  {dept.name}
                </p>
                <p className="text-[6.5px] text-gray-400 leading-tight truncate w-full">{dept.nameEn}</p>
                <span className="text-[6px] text-gray-300">{dept.floor}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
