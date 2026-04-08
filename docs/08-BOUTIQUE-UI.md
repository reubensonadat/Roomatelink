# 08 - Boutique UI Standard

Roommate Link is designed to feel like a "Personal Concierge," not a generic management tool. We enforce a high-fidelity **"Boutique-Grade"** UI standard across every screen.

## 📏 The 12px/22px Geometry Rule
To maintain visual balance and "breathability," we follow a strict spacing hierarchy:
- **Inner Padding:** Standard atoms (buttons, small cards) use a base of `12px` (3 units).
- **Outer Margins:** Major feature blocks and page containers use `22px` for mobile guttering.
- **Corner Radii:** Cards and modals use `1rem` (16px) or `1.5rem` (24px) to soften the institutional feel of the data.

## 🎞️ Framer Motion Standards
Static page jumps are forbidden. All transitions must use **Spring Physics** for an organic, tactile feel.
- **Page Transitions:** Users should feel like they are "sliding" into a new room. We use `x: 100% -> 0` with a damping of 25.
- **Micro-interactions:** Tapping a questionnaire option should trigger a subtle `scale: 0.98` followed by an immediate progress bar advance.

## 🎨 Semantic Theming
We avoid hardcoded hex codes in JSX. All colors must use Tailwind semantic classes:
- **`bg-background`:** Slate-50.
- **`bg-card`:** Pure white with subtle borders.
- **`text-foreground`:** Deep slate (for high contrast readability).

## 🏗️ Atomic Architecture
Following the "Syntax Translator" philosophy in `.roomodes`, UI components are tiered:

1.  **UI Atoms (`src/components/ui/`):** Generic, unaware of the app. (e.g., `Button`, `Spinner`, `PillToggle`).
2.  **Feature Molecules (`src/components/features/`):** Specific to Roommate Link but "dumb" in logic. (e.g., `MatchCard`, `QuestionDisplay`).
3.  **The Orchestrator (Pages):** Responsible for data fetching and laying out the components.

## 🧊 Aesthetic Hallmarks
- **Glassmorphism:** Use of `backdrop-blur-md` and low-opacity borders on sticky headers and bottom sheets.
- **Loading Fidelity:** We replace generic spinners with custom "Boutique Loaders" (e.g., `DrawingHouseLoader`) to reassure users during high-latency matching calculations.
