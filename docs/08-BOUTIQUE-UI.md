# 08 - Boutique UI Standard

Roommate Link is designed to feel like a "Personal Concierge," not a generic management tool. We enforce a high-fidelity **"Boutique-Grade"** UI standard across every screen.

## 📏 The 22px-24px Geometry Rule
To maintain visual balance and "breathability," we follow a strict spacing hierarchy:
- **Inner Padding:** Standard atoms (buttons, small cards) use a base of `12px` (3 units).
- **Outer Margins:** Major feature blocks and page containers use `22px` for mobile guttering.
- **Corner Radii:** Cards and modals use `rounded-[2rem]` (32px) or `rounded-[2.5rem]` (40px) to soften the institutional feel of the data.

**The Purge of Pills:**
- **FORBIDDEN:** `rounded-full` (pill shapes) on primary interactive elements
- **REQUIRED:** `rounded-[2rem]` or `rounded-[2.5rem]` for boutique feel
- **Rationale:** Pill shapes feel generic and mass-produced. 22px-24px rounded rectangles feel premium and intentional.

## 🎞️ Framer Motion Standards
Static page jumps are forbidden. All transitions must use **Spring Physics** for an organic, tactile feel.
- **Page Transitions:** Users should feel like they are "sliding" into a new room. We use `x: 100% -> 0` with a damping of 25.
- **Micro-interactions:** Tapping a questionnaire option should trigger a subtle `scale: 0.98` followed by an immediate progress bar advance.
- **Bottom-Up Pops:** Modals and sheets should slide up from the bottom with iOS-style spring physics.

## 🎨 Semantic Theming
We avoid hardcoded hex codes in JSX. All colors must use Tailwind semantic classes:
- **`bg-background`:** Slate-50.
- **`bg-card`:** Pure white with subtle borders.
- **`text-foreground`:** Deep slate (for high contrast readability).

### Color Palette
- **Primary:** `Indigo-600` (#4f46e5) — Trust and action.
- **Surface:** `Slate-50` (#f8fafc) — Clean and readable.
- **Lock/Premium:** `Amber-500` (#f59e0b) — Value and status.
- **Success:** `Emerald-500` (#10b981) — Positive feedback.
- **Error:** `Rose-500` (#f43f5e) — Error states.

## 🏗️ Atomic Architecture
Following the "Syntax Translator" philosophy in `.roomodes`, UI components are tiered:

1.  **UI Atoms (`src/components/ui/`):** Generic, unaware of the app. (e.g., `Button`, `Spinner`, `PillToggle`).
2.  **Feature Molecules (`src/components/dashboard/`):** Specific to Roommate Link but "dumb" in logic. (e.g., `MatchCard`, `QuestionDisplay`).
3.  **The Orchestrator (Pages):** Responsible for data fetching and laying out the components.

## 🧊 Aesthetic Hallmarks

### Glassmorphism
- **Backdrop Blur:** Use `backdrop-blur-xl` for premium depth
- **Subtle Borders:** `border border-border/80` for definition
- **Low Opacity:** `bg-card/50` for layered effects

### Loading Fidelity
We replace generic spinners with custom "Boutique Loaders" to reassure users during high-latency operations:
- **`PremiumAuthLoader`:** Elegant pulsing animation for authentication
- **`DrawingHouseLoader`:** House drawing animation for calculation phase
- **`OrbitalLoader`:** Orbital motion for general loading states
- **`GooeyLoader`:** Gooey animation for playful interactions
- **`ClassicLoader`:** Classic spinner for simple states

### Visual Depth
- **Shadows:** `shadow-premium` for elevated elements
- **Borders:** `border-border/80` for subtle definition
- **Gradients:** Subtle gradients for premium feel
- **Transparency:** Controlled opacity for layered effects

## 📱 Mobile-First Design

### Touch Targets
- **Minimum Size:** 44px x 44px for all interactive elements
- **Spacing:** 22px margins for comfortable touch
- **Feedback:** Visual feedback on all interactions

### Responsive Breakpoints
- **Mobile:** Default (< 640px)
- **Tablet:** `sm:` (640px+)
- **Desktop:** `md:` (768px+)
- **Large Desktop:** `lg:` (1024px+)

### Typography Scale
- **Headings:** `text-2xl` to `text-4xl` for titles
- **Body:** `text-base` for main content
- **Small:** `text-sm` for secondary text
- **Tiny:** `text-xs` for labels

## 🎯 Component Standards

### Buttons
- **Primary:** `bg-indigo-600 text-white rounded-[2rem] px-6 py-3`
- **Secondary:** `bg-white text-indigo-600 border border-indigo-600 rounded-[2rem] px-6 py-3`
- **Ghost:** `text-indigo-600 hover:bg-indigo-50 rounded-[2rem] px-4 py-2`
- **States:** Hover, active, disabled states for all buttons

### Cards
- **Container:** `bg-card rounded-[2.5rem] border border-border/80 shadow-premium`
- **Padding:** `p-6` for standard cards
- **Hover:** `hover:border-primary/30` transition effect

### Modals
- **Container:** `bg-card rounded-[2.5rem] border border-border/80 shadow-premium`
- **Animation:** Bottom-up slide with spring physics
- **Backdrop:** `bg-black/50 backdrop-blur-sm`

### Inputs
- **Container:** `bg-background border border-border rounded-[1.5rem] px-4 py-3`
- **Focus:** `focus:outline-none focus:ring-2 focus:ring-indigo-500`
- **Error:** `border-rose-500` for error states

## 🎨 Design Patterns

### The Boutique Card
```tsx
<div className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border/80 p-6 shadow-premium relative overflow-hidden group">
  {/* Content */}
</div>
```

### The Premium Button
```tsx
<button className="bg-indigo-600 text-white rounded-[2rem] px-6 py-3 font-medium hover:bg-indigo-700 transition-colors">
  {/* Label */}
</button>
```

### The Glass Header
```tsx
<div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/80">
  {/* Header content */}
</div>
```

## ⚡ Performance Standards

### Animation Performance
- **GPU Accelerated:** Use `transform` and `opacity` for smooth animations
- **Avoid Layout Triggers:** Don't animate `width`, `height`, `top`, `left`
- **Will Change:** Use `will-change` sparingly for complex animations

### Loading States
- **Skeleton Screens:** Show skeleton UI during data fetch
- **Progressive Loading:** Load content progressively
- **Optimistic Updates:** Update UI immediately, sync in background

### Image Optimization
- **WebP Format:** Use WebP for better compression
- **Lazy Loading:** Load images on demand
- **Responsive Images:** Serve appropriate sizes

## 🎯 Accessibility Standards

### Keyboard Navigation
- **Tab Order:** Logical tab order for all interactive elements
- **Focus Indicators:** Visible focus states for keyboard users
- **Shortcuts:** Keyboard shortcuts for common actions

### Screen Readers
- **ARIA Labels:** Proper ARIA labels for interactive elements
- **Semantic HTML:** Use semantic HTML elements
- **Alt Text:** Descriptive alt text for images

### Color Contrast
- **Minimum Ratio:** 4.5:1 for normal text
- **Large Text:** 3:1 for large text (18px+)
- **Color Independence:** Don't rely on color alone

## 🚨 Anti-Patterns (FORBIDDEN)

### Generic Pill Shapes
```tsx
// ❌ FORBIDDEN
<button className="rounded-full px-6 py-3">Button</button>

// ✅ REQUIRED
<button className="rounded-[2rem] px-6 py-3">Button</button>
```

### Hardcoded Colors
```tsx
// ❌ FORBIDDEN
<div style={{ backgroundColor: '#4f46e5' }}>Content</div>

// ✅ REQUIRED
<div className="bg-indigo-600">Content</div>
```

### Generic Spinners
```tsx
// ❌ FORBIDDEN
<div className="animate-spin">Loading...</div>

// ✅ REQUIRED
<PremiumAuthLoader />
```

### No Animations
```tsx
// ❌ FORBIDDEN
<div>Content</div>

// ✅ REQUIRED
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## 📐 Spacing System

### Scale
- **0:** 0px
- **1:** 4px
- **2:** 8px
- **3:** 12px
- **4:** 16px
- **5:** 20px
- **6:** 24px
- **8:** 32px
- **10:** 40px
- **12:** 48px
- **16:** 64px

### Usage
- **Inner Padding:** `p-6` (24px)
- **Outer Margins:** `my-6` (24px)
- **Gap Between Elements:** `gap-4` (16px)
- **Section Spacing:** `space-y-6` (24px)

## 🎨 Typography System

### Font Weights
- **Regular:** `font-normal` (400)
- **Medium:** `font-medium` (500)
- **Semibold:** `font-semibold` (600)
- **Bold:** `font-bold` (700)

### Font Sizes
- **Tiny:** `text-xs` (12px)
- **Small:** `text-sm` (14px)
- **Base:** `text-base` (16px)
- **Large:** `text-lg` (18px)
- **XL:** `text-xl` (20px)
- **2XL:** `text-2xl` (24px)
- **3XL:** `text-3xl` (30px)
- **4XL:** `text-4xl` (36px)

### Line Heights
- **Tight:** `leading-tight` (1.25)
- **Normal:** `leading-normal` (1.5)
- **Relaxed:** `leading-relaxed` (1.625)
- **Loose:** `leading-loose` (2)

## 🔍 Icon Standards

### Icon Library
- **Primary:** Lucide React for consistent icon style
- **Custom:** Custom icons in `src/components/ui/CustomIcons.tsx`

### Icon Sizes
- **Small:** `w-4 h-4` (16px)
- **Medium:** `w-5 h-5` (20px)
- **Large:** `w-6 h-6` (24px)
- **XL:** `w-8 h-8` (32px)

### Icon Usage
- **Consistent:** Use consistent icon sizes throughout
- **Meaningful:** Icons should have clear meaning
- **Accessible:** Include aria-label for screen readers

## 🎯 Loading States

### Skeleton Loading
```tsx
<div className="animate-pulse bg-muted rounded-[2rem] h-20" />
```

### Progress Indicators
```tsx
<div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
  <motion.div
    className="h-full bg-indigo-600"
    initial={{ width: 0 }}
    animate={{ width: progress }}
  />
</div>
```

### Spinners
```tsx
<PremiumAuthLoader />
<OrbitalLoader />
<DrawingHouseLoader />
```

## 🚨 Troubleshooting

### Issue: UI feels generic
**Solution:** Replace pill shapes with 22px-24px rounded rectangles, add glassmorphism effects

### Issue: Animations feel jerky
**Solution:** Use spring physics, avoid layout-triggering properties, use GPU acceleration

### Issue: Loading states are boring
**Solution:** Replace generic spinners with boutique loaders, add skeleton screens

### Issue: Mobile experience is poor
**Solution:** Increase touch targets, improve spacing, optimize for touch interactions

### Issue: Accessibility issues
**Solution:** Add ARIA labels, improve color contrast, ensure keyboard navigation works

## 🔄 Future Enhancements

### Planned Features
- **Dark Mode:** Full dark mode support with smooth transitions
- **Custom Themes:** Allow users to customize color schemes
- **Animation Library:** Expand animation library with more boutique animations
- **Micro-interactions:** Add more delightful micro-interactions

### Performance Improvements
- **Code Splitting:** Lazy load components for faster initial load
- **Image Optimization:** Implement advanced image optimization
- **Bundle Size:** Reduce bundle size for faster loading
- **Caching:** Implement aggressive caching strategies

### Accessibility Improvements
- **Voice Control:** Add voice control support
- **Gesture Support:** Add gesture-based interactions
- **High Contrast Mode:** High contrast mode for visually impaired users
- **Reduced Motion:** Respect reduced motion preferences
