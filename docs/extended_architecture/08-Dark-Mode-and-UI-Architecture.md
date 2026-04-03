# Volume 08: Dark Mode and UI Architecture

Because Roommate Link is an institutional "app-like" experience running in browsers, the UI demands strict precision. A jarring flash of white in Dark Mode destroys the premium feel immediately.

## 1. The Tailwind Theme Rule (Strict No `bg-white`)
We explicitly modified the `tailwind.config.js` to map semantic CSS variables to our color schemes.

**Never, ever use these utility classes directly:**
- ❌ `bg-white`
- ❌ `bg-slate-50`
- ❌ `text-slate-900`
- ❌ `text-slate-400`

**Always use the semantic variables:**
- ✅ `bg-background` (Used for the absolute parent wrapper of the page `min-h-screen bg-background`).
- ✅ `bg-card` (Used for the rounded white panels, floating hubs, modals).
- ✅ `bg-muted` (Used for grayed-out input boxes or lightly shaded avatar backgrounds).
- ✅ `text-foreground` (Used for main Title Text, deeply contrasting relative to `background`).
- ✅ `text-muted-foreground` (Used for subtitles, hints, small descriptions).

## 2. Global Dark Mode Toggle
The system relies on `<html class="dark">` inside the core `index.html`. 
Inside `SettingsPage.tsx`, the "Theme" toggle directly injects or removes the `dark` class from `document.documentElement` and caches the user's preference to `localStorage.getItem('theme')`.
Because Tailwind relies entirely on this class definition dynamically flipping CSS custom properties (`var(--background)` to dark hex colors), the entire app instantaneously shifts. No re-renders required!

## 3. Fallback Loaders and Hydration Spinners
When the app first loads, React takes milliseconds to hydrate. Before React takes over, `index.html` displays a static loading spinner. 
We must ensure the `body` tag inside `index.html` is exactly mapped to `background-color: #0f172a;` (if dark mode) or `#f8fafc` manually via an inline script to prevent the "White Flash of Death" before Tailwind CSS finishes loading on slow 3G networks. 

## 4. `lucide-react` Icon Scaling
Our iconography (`lucide-react`) relies on `currentColor`. Therefore, if you are struggling to make an icon appear properly on dark mode, ensure its parent container leverages `text-foreground` or manually define `className="text-primary"`. Do not explicitly give an icon a black fill.
