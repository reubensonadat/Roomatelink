Roommate Link - Design System
Core Philosophy
Minimalism First: Clean, uncluttered interfaces focused entirely on the user's immediate task.
Subtle Glassmorphism: Soft frosted glass effects (backdrop-blur) used sparingly for floating elements like navigation bars and modal sheets, never overwhelming the content.
Thematic Consistency: Native Light Mode and Dark Mode support built seamlessly into the onboarding flow.
Color Palette
The brand colors are designed to be subtle and premium. We avoid aggressive neon tones in favor of muted, elegant hues.

Primary Indigo: hsl(244, 75%, 59%) — Used lightly for active states and primary actions.
Subtle Violet: hsl(258, 90%, 66%) — Used for secondary accents.
Background (Light): Pure White #FFFFFF with Zinc-50 #fafafa accents.
Background (Dark): Deep Zinc #09090b with Zinc-900 #18181b accents.
Typography
Headings: Extra bold, tight tracking (tracking-tight).
Body Text: Minimalist, high legibility, slightly muted (text-foreground/60) to create a strong visual hierarchy without dominating the screen.
Responsive Navigation Architecture
As established in the architectural review, navigation scales radically between viewport dimensions:

Mobile (< 768px): Floating bottom Tab Bar (tubelight-navbar), keeping navigation within thumb's reach and maximizing horizontal screen real estate for cards.
Desktop (>= 768px): Fixed Left Sidebar navigation. This is the industry standard for web applications, efficiently utilizing widespread horizontal space while mimicking native desktop apps.
Component Laws
Buttons: Fully rounded capsules (rounded-full), massive tap targets, high contrast (Foreground on Background).
Onboarding Graphics: Floating centrally on mobile, left-aligned on desktop. Massive bottom margins ensure content is never obscured by fixed controls.
Floating Controls: Avoid floating utility buttons (like theme toggles) on critical pages. Integrate choices linearly into the flow to reduce choice fatigue.
This is the first one
