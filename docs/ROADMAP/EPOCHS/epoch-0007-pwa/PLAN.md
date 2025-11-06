# PLAN — Epoch 0007: Progressive Web App (PWA)

## Context
With routing, debug tools, and UI primitives in place, we can now add full PWA capabilities to make the app installable and partially offline-capable.  
The PWA epoch ensures the app behaves like a native install on mobile and desktop while maintaining best-practice caching and manifest configuration.

## Objectives
- Add a manifest (`app/manifest.webmanifest`) with proper metadata, colors, and icons.
- Integrate `next-pwa` for service-worker generation and caching strategies.
- Provide responsive app icons (maskable, monochrome, Apple Touch).
- Create a custom “Install App” prompt using our existing `Modal` and `Button` primitives.
- Pass Lighthouse PWA installability and offline checks in Vercel Preview.

## Deliverables
- Web App Manifest with verified metadata.
- Service worker configuration (via next-pwa).
- App icons and Apple Touch icons.
- Custom install prompt and fallback instructions for iOS.
- README and ROADMAP updates documenting usage.

## Proposed PR sequence within this epoch
1) **PR 1 — Plan & Status (this PR):** add PLAN.md and STATUS.yaml only.  
2) **PR 2 — Manifest & Icons:** create manifest and icons; update layout meta tags.  
3) **PR 3 — Service Worker Config:** integrate `next-pwa`, verify caching.  
4) **PR 4 — Install Prompt UI:** custom modal for “Add to Home Screen”.  
5) **PR 5 — Verify & Close:** documentation, README, ROADMAP updates.

## Acceptance Criteria (Definition of Done)
- App installable via browser’s native prompt on Android/desktop.  
- Custom install modal appears when `beforeinstallprompt` fires.  
- Works offline for cached routes (home, dashboard, login).  
- Manifest and icons validated in Lighthouse audit.  
- Docs and README updated with PWA configuration notes.

## Out of Scope
- Push notifications (may be handled in a later epoch).  
- Full background sync or advanced Workbox recipes.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md  
- Previous epoch: /docs/ROADMAP/EPOCHS/epoch-0006-ui-primitives/  
- next-pwa docs: https://github.com/shadowwalker/next-pwa  
- Lighthouse PWA checklist: https://web.dev/pwa-checklist/
