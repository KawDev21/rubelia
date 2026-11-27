# Design System: Rubelia Bimbel Management Portal

**Skill:** stitch-design-taste

---

## Configuration — Style Calibration

| Dial              | Level | Description                                                                                                                                                      |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creativity**    | `5`   | Balanced institutional warmth with crisp modern hierarchy. Approachable for guardians of all ages while remaining authoritative for Owner and Staff operations.  |
| **Density**       | `6`   | Daily-App Balanced on mobile views (Mentor & Guardian tasks); structured tabular efficiency on desktop views (500+ active student records, finance, scheduling). |
| **Variance**      | `5`   | Asymmetric 2-column split on desktop authentication and Bento overview summaries; predictable, scannable forms and strict single-column stack on mobile.         |
| **Motion Intent** | `5`   | Subtle spring-physics tactile feedback, skeletal shimmer loaders, and live session status pulses. Hardware-accelerated `transform` and `opacity` only.           |

---

## 1. Visual Theme & Atmosphere

A bright, trustworthy academic operations workspace designed for immediate comprehension across generations — from university-student mentors checking in on smartphones to parents verifying monthly tuition and administrators managing 500+ active students. Surfaces remain airy and glare-free (`80%` soft canvas and pure white), anchored by deep maritime navy typography and navigation (`12%`), energized by calibrated Rubelia gold-yellow primary actions (`6%`), and punctuated sparingly by soft rose micro-tags (`2%`). Every screen prioritizes legibility, unambiguous action hierarchy, and zero visual clutter.

## 2. Color Palette & Roles

### Surface & Neutral Foundation (80% Viewport Share)

- **Canvas Mist** (`#F8FAFC`) — Primary application background surface. Cool-neutral Slate-50 base that separates elevated white containers cleanly without visual fatigue.
- **Pure Surface** (`#FFFFFF`) — Card, form sheet, table container, and modal fill.
- **Subtle Well** (`#F1F5F9`) — Table header backgrounds, secondary pill fills, and inactive tab tracks.
- **Whisper Slate Border** (`rgba(203, 213, 225, 0.65)` / `#E2E8F0`) — Structural `1px` dividers and card outlines.
- **Diffused Harbor Shadow** (`0 16px 32px -12px rgba(15, 23, 42, 0.06)`) — Tinted to Deep Harbor Navy, never harsh black.

### Structural Anchor & Typography — Biru Dongker (12% Viewport Share)

- **Deep Harbor Navy** (`#0F172A`) — Primary text, desktop sidebar surface, active table values, and high-contrast label ink on top of Rubelia Gold buttons. Replaces pure black everywhere.
- **Oxford Navy** (`#1E293B`) — Elevated dark surface accents, hover states on dark navigation, and secondary headers.
- **Maritime Slate** (`#475569`) — Body copy, form labels, and table cell descriptions.
- **Muted Compass** (`#64748B`) — Timestamps, helper captions, and placeholder text.

### Primary Brand Accent — Kuning Rubelia (6% Viewport Share)

- **Rubelia Gold** (`#E2A829`) — Primary CTA button fill, active navigation indicator bar, and brand identity highlight. Calibrated saturation (`76%`, strictly below the `80%` cap) so it feels warm and authoritative rather than neon. **Mandatory pairing:** always use **Deep Harbor Navy** (`#0F172A`) text/icons on top of Rubelia Gold — white text on yellow is strictly forbidden for contrast safety.
- **Warm Amber Hover** (`#CA8A04`) — Hover/pressed state for primary buttons and focus ring borders.
- **Sunlit Wash** (`#FEF9C3`) — Soft highlight surface for active current-session banners or selected invoice rows, paired with `#713F12` or `#0F172A` text.

### Contextual Micro-Accent — Pink Lembut (2% Viewport Share)

- **Blush Petal Tint** (`#FFF1F2`) paired with **Muted Rose Ink** (`#BE123C`, saturation `74%`) — Reserved strictly for micro-semantic roles: `Bimba` early-childhood level badge, urgent broadcast indicator pill, `Alpha` truancy alert badge, and inline form validation errors. Never used as a large section background or primary button fill.

### Supporting Semantic Status Tokens (Functional Feedback Only)

- **Verified Sage** (`#ECFDF5` fill / `#047857` text) — Paid (`Lunas`) status, valid GPS check-in within radius, and `Hadir` attendance pill.
- **Pending Ochre** (`#FFFBEB` fill / `#B45309` text) — Awaiting payment verification (`Menunggu Verifikasi`), schedule request pending, and late check-in indicator.

### Banned Colors

- Pure Black (`#000000`) — always use Deep Harbor Navy (`#0F172A`).
- White text (`#FFFFFF`) on Yellow surfaces — fails WCAG contrast.
- Purple/Violet neon gradients or outer button glows.
- Oversaturated neon yellows (`#FFFF00`) or hot magenta pinks above `80%` saturation.
- Mixing warm brownish grays with cool slate grays.

## 3. Typography Rules

- **Display & Headings:** `Outfit` (weights `600`, `700`) — Friendly geometric precision suited for education, track-tight (`-0.02em`), line-height `1.2`.
- **Body & UI Controls:** `Plus Jakarta Sans` (weights `400`, `500`, `600`) — High x-height for effortless reading by guardians on small mobile screens, relaxed leading (`1.6`), max line width `65ch` on prose blocks.
- **Monospace (Tabular & Generated Credentials):** `JetBrains Mono` (weights `500`, `600`) — Mandatory for generated student emails (`R26110001@rubelia.com`), Rupiah currency figures (`Rp 350.000`), attendance timestamps (`15:02 WIB`), GPS distance readouts (`34 m`), and grade scores (`88`).
- **Fluid Type Scale:**
    - Page Title: `clamp(1.5rem, 2.5vw, 2rem)`
    - Section Heading: `clamp(1.125rem, 1.8vw, 1.375rem)`
    - Body / Input Text: `1rem` (`16px` minimum on mobile inputs to prevent iOS Safari auto-zoom)
    - Metadata / Badges: `0.8125rem` (`13px`)

### Banned Fonts

- `Inter` — banned across all screens.
- All serif fonts (`Times New Roman`, `Georgia`, `Garamond`, or decorative serifs) — banned in software portals and dashboards.

## 4. Component Stylings

- **Buttons:**
    - _Primary:_ Rubelia Gold (`#E2A829`) fill, Deep Harbor Navy (`#0F172A`) `600`-weight text, `0.75rem` (`12px`) border radius, zero outer glow, `-1px translateY` / `scale(0.98)` tactile active push, minimum height `44px`.
    - _Secondary:_ Pure Surface (`#FFFFFF`) fill, `1px` Whisper Slate Border, Deep Harbor Navy text, Subtle Well (`#F1F5F9`) hover.
    - _Destructive / Reject:_ Blush Petal Tint (`#FFF1F2`) fill with Muted Rose Ink (`#BE123C`) text, upgrading to solid `#BE123C` with white text on confirmation modals.
- **Navigation Shell:**
    - _Desktop (`>= 1024px`):_ Deep Harbor Navy (`#0F172A`) left sidebar (`260px` fixed width) with crisp white/slate-300 labels and a `3px` Rubelia Gold left accent bar + `#1E293B` fill on the active route.
    - _Mobile (`< 1024px`):_ Clean sticky top bar (`56px`) paired with a thumb-friendly bottom navigation bar (`64px` height, max 4–5 primary destinations per role) + slide-over drawer for secondary menus.
- **Cards & Data Tables:**
    - Rounded corners (`1rem` / `16px` for operational density; `1.5rem` / `24px` for login and hero summary panels).
    - Pure Surface (`#FFFFFF`) with `1px` `#E2E8F0` border. On high-density 500-row student/invoice views, use clean horizontal row dividers (`border-top: 1px solid #F1F5F9`) instead of nesting cards inside cards.
    - Sticky search/filter toolbar above tables with server-side pagination.
- **Forms & Inputs:**
    - Explicit label positioned above every input (`0.375rem` gap), helper caption optional, inline error message below in Muted Rose Ink (`#BE123C`).
    - Input height `44px` minimum, `0.625rem` radius, `2px` Rubelia Gold focus ring (`rgba(226, 168, 41, 0.35)`). Floating labels are banned.
    - Generated credential preview boxes (on student/staff creation) include a one-tap copy button with monospace formatting.
- **Attendance & Geolocation Widget (Mentor View):**
    - Prominent session card showing current session slot (`Sesi 1 — 14:00–15:30`), live GPS distance badge in `JetBrains Mono` (`Valid: 28m dari Rubelia` in Verified Sage or `Di luar area: 240m` in Blush Petal), and one-tap segmented student status toggles (`Hadir`, `Sakit`, `Izin`, `Alpha`) sized at `44px` touch height so mentors can mark 15–20 students on a phone in under 30 seconds.
- **Loaders & Empty States:**
    - Skeletal shimmer blocks matching exact row/card heights — circular spinners are banned.
    - Composed empty states using clean `lucide-react` line iconography + clear next-step explanation (for example: "Semua tagihan SPP sudah lunas. Tagihan berikutnya terbit tanggal 28.").

## 5. Authentication Entry Screen (Root `/` Login)

Since the public marketing site lives separately, `/` serves directly as the Rubelia Portal Login:

- **Asymmetric Split (`>= 1024px`):** Left panel (`45%`) in Deep Harbor Navy (`#0F172A`) featuring the Rubelia brand mark, a subtle geometric architectural grid accent in Rubelia Gold (`#E2A829`), and clear operational guidance (login format reminder for Guardians, Mentors, and Staff). Right panel (`55%`) on Canvas Mist (`#F8FAFC`) housing the elevated Pure Surface login card.
- **Mobile (`< 1024px`):** Compact Navy header band with Rubelia mark above a clean full-width single-column login card (`min-height: 100dvh`), zero horizontal scroll, and prominent password-visibility toggle for birth-date initial passwords.

## 6. Layout Principles

- **CSS Grid First:** Structural layouts use explicit CSS Grid templates (`2fr 1fr` asymmetric dashboard splits, `repeat(auto-fit, ...)` summary strips). Never use `calc()` percentage flexbox hacks.
- **No Overlapping Elements:** Text never overlaps images or badges; every component occupies a dedicated grid cell or stack slot.
- **No Generic 3-Equal-Card Marketing Rows:** Dashboard summaries use asymmetric 2-column Bento splits (for example, `65%` Today's Active Sessions / Unpaid Invoices list paired with `35%` Quick Action & Status rail).
- **Viewport Height Safety:** Always use `min-h-[100dvh]`, never `h-screen`, preventing iOS Safari address-bar clipping.
- **Containment:** Operational content contained within `max-width: 1360px` with responsive padding (`1rem` mobile, `1.75rem` tablet, `2.5rem` desktop).

## 7. Responsive Rules

- **Mobile-First Collapse (`< 768px`):** Every multi-column grid collapses into a single vertical stack (`width: 100%`, `padding: 1rem`, `gap: 1rem`). Wide tables convert to scannable stacked record cards or cleanly bounded horizontal table containers without breaking page viewport width.
- **Zero Page Overflow:** Document-level horizontal scroll at `375px` or `390px` is a critical defect.
- **Touch Ergonomics:** Every button, status pill toggle, checkbox row, and pagination control enforces a minimum `44px x 44px` hit area. Primary action buttons span full width on mobile forms.
- **PWA Readiness:** Safe-area inset padding (`env(safe-area-inset-bottom)`) applied to mobile bottom navigation for home-screen installed Web Push users on Android and iOS.

## 8. Motion & Interaction (Code-Phase Intent)

- **Spring Physics:** Interactive drawers, modals, and active tab indicators use gentle spring transitions (`stiffness: 120, damping: 22`) rather than flat linear easing.
- **Purposeful Micro-Loops:** Subtle pulse dot on active ongoing class sessions (`Sedang Berlangsung`) and pending verification counters; shimmer sweep on skeleton rows during Inertia partial reloads.
- **Hardware Acceleration:** Animate exclusively `transform` and `opacity`. Never animate `height`, `width`, `top`, or `left`.

## 9. Anti-Patterns (Strictly Banned)

- No emojis anywhere in UI labels, notifications, badges, empty states, or code — use `lucide-react` icons exclusively.
- No `Inter` or serif fonts anywhere.
- No pure black (`#000000`) text, borders, or shadows.
- No white text on yellow backgrounds.
- No neon glows, purple/violet AI gradients, or gradient headline text.
- No custom mouse cursors.
- No circular loading spinners — use skeletal shimmers.
- No `h-screen` — always `min-h-[100dvh]`.
- No fabricated metrics, fake uptime numbers, or `LABEL // YEAR` headers — every counter and chart must reflect real SQLite records or explicit empty states.
- No generic placeholder personas ("John Doe", "Acme") in seeds or previews — use realistic Indonesian student, guardian, and mentor names.
