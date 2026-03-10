# VMS Prototype — Copilot Instructions

## Project Overview

**Visitor Management System (VMS)** prototype for the Thailand Ministry of Tourism and Sports (MOTS).
Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript. **Frontend-only prototype** — all data is hardcoded/mock, no backend or API integration.

## Architecture: 4 Sub-Applications

The app is split into 4 independent "surfaces" under `app/`, each with its own layout hierarchy:

| Surface | Path | Target | Layout pattern |
|---------|------|--------|----------------|
| **Mobile (LINE)** | `/mobile` | Visitors & Officers via LINE LIFF | `max-w-md` centered, Rich Menu nav |
| **Web** | `/web` | Admin/staff desktop | Fixed sidebar (`pl-[240px]`) + Topbar |
| **Kiosk** | `/kiosk` | Touch-screen kiosk | Full-screen dark purple, large touch targets |
| **Counter** | `/counter` | Security guard station | Desktop-like, PIN login |

Entry point `/` (`app/page.tsx`) is a launcher linking to all 4 surfaces.

### Route Group Pattern
Each surface uses `(app)` route groups to separate login pages from authenticated layouts:
- `app/mobile/page.tsx` → LINE registration (public)
- `app/mobile/(app)/layout.tsx` → wraps authenticated pages with `VisitorRichMenu`
- `app/mobile/officer/layout.tsx` → wraps officer pages with `OfficerRichMenu`

## Design System & Theming

### Color Tokens (Tailwind v4 `@theme` in `app/globals.css`)
- **Primary**: Royal Purple scale (`primary-50` → `primary-900`, base `#6A0DAD`)
- **Accent**: Gold scale (`accent-50` → `accent-600`, base `#D4AF37`)
- **Status**: `success` / `warning` / `error` / `info` with `-light` variants
- **Neutral**: `bg`, `surface`, `border`, `text-primary`, `text-secondary`, `text-muted`

Use design tokens, not raw hex values. Example: `bg-primary-500`, `text-accent`, `border-border`.

### Typography
Font stack: `Inter` + `Noto Sans Thai` (loaded via Google Fonts import in `globals.css`).
All UI is **bilingual** (Thai primary, English secondary).

### Component Library (`components/ui/`)
Built with `class-variance-authority` (CVA) + `cn()` utility from `lib/utils.ts`:
- `Button` — variants: `primary`, `secondary`, `destructive`, `outline`, `ghost`, `link`, `kiosk`
- `Badge` — variants: `pending`, `approved`, `rejected`, `checkedin`, `checkout`
- `StatusBadge` — wraps Badge with `VisitStatus` type: auto-maps status to label/color, supports `showEnglish`, `showDot`, `size`
- `Card` — composable: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Input` — supports `label`, `error`, `leftIcon`, `rightIcon`
- `SearchInput` — debounced search input with icon, clearable, `size` variants
- `ConfirmModal` — reusable modal: variants `danger`, `warning`, `info`, `success`; supports `loading`, `hideCancel`
- `VmsLogo` — SVG shield logo with size/darkMode props

### Pattern: Creating New UI Components
```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myVariants = cva("base-classes", {
  variants: { variant: { default: "...", special: "..." } },
  defaultVariants: { variant: "default" },
});

// Use forwardRef, expose VariantProps, use cn() for className merging
```

## Key Conventions

### File & Code Patterns
- **All pages are client components** (`"use client"`) — this is a static prototype, no SSR data fetching
- **Icons**: `lucide-react` exclusively — import individual icons: `import { Home } from "lucide-react"`
- **Path aliases**: `@/*` maps to project root (e.g., `@/components/ui/Button`, `@/lib/utils`)
- **Navigation**: Rich Menu components replace traditional bottom nav (LINE LIFF style) — see `components/mobile/VisitorRichMenu.tsx` and `OfficerRichMenu.tsx`
- **Mock data**: Centralized in `lib/mock-data.ts` — types, visitors, staff, appointments, departments, blocklist, notifications, dashboard stats, helper filters
- **Thai dates**: Use `lib/thai-date.ts` — `formatThaiDate()`, `formatThaiTime()`, `formatThaiDateTime()`, `formatAppointmentSummary()`, Buddhist Era conversion
- **Status rendering**: Use `StatusBadge` component with `VisitStatus` type — auto-resolves Thai/English label and color

### Kiosk-Specific Patterns
- Extra-large touch targets (min `h-20`, `rounded-[3rem]`)
- Dark purple gradient backgrounds with glassmorphism (`bg-white/10 backdrop-blur-xl`)
- Multi-step flows managed with `useState` for step tracking
- Auto-redirect with countdown timer on success pages

### Web App Patterns
- Layout: `Sidebar` (fixed left 240px) + `Topbar` (sticky top with title prop)
- Tables use raw `<table>` with Tailwind classes (no table library)
- Action buttons inline in table rows

### Mobile Patterns
- Constrained to `max-w-md` via mobile layout
- Bottom padding `pb-[180px]` to clear Rich Menu overlay
- LINE-style UI: green accents for LINE connections, rich menu grid navigation

## Commands
```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint
```

## Dependencies (Minimal)
- `next` 16, `react` 19, `tailwindcss` 4 (via `@tailwindcss/postcss`)
- `class-variance-authority` + `clsx` + `tailwind-merge` (styling)
- `lucide-react` (icons)
- No state management library, no API client, no database
