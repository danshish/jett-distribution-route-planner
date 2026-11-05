# Jett Pal — Development & Fix History

**Project:** Jett Pal  
**Repository:** danshish/jett-distribution-route-planner  
**Audit snapshot:** 5 November 2026  
**Latest verified release build at audit:** v3.7.3, Android version code 41

## Why this log exists

This document records development work that can be traced to GitHub commit history. It is intended to support testing, maintenance, handover and future buyer due diligence.

**Counting note:** A review of the latest 100 commits found 50 commits whose messages relate to fixes, repairs, restorations or feature improvements. This is a count of relevant commits, **not 50 independently verified bug fixes**. Some commits are version-number bumps for the corresponding code changes. A commit proves that code was changed; it does not prove the feature passed real-device testing.

## Current product areas represented in the codebase

- Route planning and delivery-stop management
- UK address lookup and address import from CSV/Excel/Google Sheets
- Local address caching and offline-map support
- MapLibre map display and Valhalla offline-routing integration
- GPS tracking, route progress, turn guidance and rerouting work
- Driver and vehicle management tools
- Delivery and stock-related operational screens
- Supabase authentication and password recovery code

## Development timeline

### 1–2 November 2026 — app stability, imports and offline-map foundations

- Improved Android build compatibility and Gradle/Java configuration.
- Added and corrected Excel import handling.
- Added detection of address columns in spreadsheet imports.
- Added offline map loading diagnostics and delivery-stop map coordinates.
- Started the offline navigation flow and Valhalla native-module integration.
- Corrected Android password-reset deep-link handling.
- Removed a map annotation implementation that had caused crashes while the map approach was being stabilised.

### 3–4 November 2026 — GPS and offline navigation development

- Added live, high-accuracy GPS tracking and next-stop guidance.
- Added heading indication to the offline GPS marker.
- Added expanded offline-map controls, including 2D/3D options and building extrusion.
- Continued Valhalla offline-routing integration and Android build fixes.

### 5 November 2026 — navigation refinement

- Added road-following route drawing and direction arrows.
- Added GPS route snapping and road-instruction preview work.
- Improved live navigation camera positioning and zoom behaviour.
- Added support for GPS-to-single-address offline navigation.
- Corrected route overlay visibility above offline map styling.
- Added accessible zoom and GPS-recentre controls.
- Preserved manual zoom during live GPS updates.
- Kept route GeoJSON visible at high zoom and preserved camera centre.
- Added live rerouting and a visible navigation compass.
- Restored Valhalla routing archive import and status controls.

## Selected traceable GitHub changes

| Date (UTC) | Change |
|---|---|
| 1 Nov 2026 | Password recovery deep-link handling |
| 2 Nov 2026 | Excel import reliability and address-column detection |
| 2 Nov 2026 | Offline map diagnostics and Valhalla module preparation |
| 4 Nov 2026 | Live GPS tracking, next-stop guidance and heading indicator |
| 4 Nov 2026 | Expanded offline map controls |
| 5 Nov 2026 | Road-following route and turn-direction guidance |
| 5 Nov 2026 | Single-address offline navigation |
| 5 Nov 2026 | GPS-centred camera, zoom and route visibility corrections |
| 5 Nov 2026 | Live rerouting and compass |
| 5 Nov 2026 | Valhalla import controls restored |

## Build evidence at audit

- GitHub Actions run **42055795311** completed successfully on 5 November 2026.
- The run uploaded an artifact named **Jett-Pal-APK**.
- The successful build corresponded to the Valhalla import-controls restoration commit.
- The artifact was present and not expired at the time of the audit.
- The recorded app configuration was v3.7.3, Android version code 41.

A successful CI build confirms that the APK was produced and uploaded. It does not establish that every feature works correctly on every phone.

## Known verification gaps at audit

These are items to verify before describing Jett Pal as production-ready or presenting it to an acquirer:

1. Complete real-device testing of offline routing, map imports, GPS tracking, rerouting and compass behaviour.
2. Confirm whether the latest APK has been installed and tested on the target Moto g17.
3. Verify Supabase authentication and password recovery end-to-end using a fresh build.
4. The README at audit still stated that operational data synchronisation between devices/cloud was not yet implemented. Confirm and update this documentation when that changes.
5. Verify multi-company data separation, company roles and permissions before offering Jett Pal to multiple businesses.
6. Test delivery completion, proof-of-delivery capture, reports, backup/restore and offline data reconciliation.
7. Review security, privacy, third-party licences, service-provider terms and production hosting.

## How to maintain this history

For each future change, record:

- Date and app version/build number
- Problem or requested feature
- What changed
- GitHub commit or pull request
- Android build result
- Device and test steps
- Test result: Not tested / Passed / Failed
- Known limitations or follow-up work

**Important:** Never mark a fix as passed solely because a GitHub commit or successful APK build exists. Record the real-device test separately.
