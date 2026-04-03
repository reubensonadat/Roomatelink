# Volume 09: Progressive Web App (PWA)

Roommate Link is built to look exactly like an App Store application on iOS and Android when students optionally "Add to Home Screen". We use Vite PWA plugin to build the underlying `manifest.json`.

## 1. Native Bypassing (The Look)
To prevent Safari/Chrome from showing the URL bar natively:
- `display: "standalone"` is set perfectly in `vite.config.ts`.
- `theme_color` drives the status bar at the very top of smartphones to match the application's header. If the background header is `bg-background` (which dynamically adjusts), setting `<meta name="theme-color" content="#ffffff">` dynamically based on Theme state creates a seamless glass effect into the notch/dynamic island.

## 2. The Custom Prompt
Apple physically refuses to let developers auto-prompt the user to "Add to Homescreen" via JavaScript triggers. 
Therefore, `InstallPrompt.tsx` explicitly checks:
```typescript
const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
```
If `true`, it displays a manual prompt saying "Tap the Share icon -> Add to Home Screen."
If it's Android/Chrome, we intercept the `beforeinstallprompt` event and mount our own beautiful CSS banner at the bottom of the screen instead of relying on the browser's ugly default dropdown.

## 3. Caching and Service Workers
Because it uses Workbox under the hood, images inside `public/avatars` and core CSS are cached securely to the disk of the phone. When the user opens the PWA without an internet connection, it mounts instantly.
When we push updates to Cloudflare Pages, the PWA silently downloads the new JS chunk in the background and will prompt the user to "Update App" upon their next match refresh.
