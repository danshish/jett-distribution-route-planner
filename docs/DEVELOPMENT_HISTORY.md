# Jett Pal — Development & Fix History

**Project:** Jett Pal  
**Repository:** danshish/jett-distribution-route-planner  
**Audit snapshot:** 5 November 2026  
**Latest verified release build at audit:** v3.7.3, Android version code 41

## Why this log exists

This document records development work that can be traced to GitHub commit history. It is intended to support testing, maintenance, handover and future buyer due diligence.

**Counting note:** The complete GitHub default-branch commit ledger below contains **182 commits**, dated 2026-10-20 through 2026-11-05 (UTC). This includes feature work, fixes, refactors, version bumps, uploads and documentation. It is a source-control history, **not a count of independently verified bug fixes**. A commit proves that code was changed; it does not prove the feature passed real-device testing.

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


## Complete GitHub commit history

The table below records every commit returned by GitHub's default-branch commit history at the audit snapshot, newest first. Each short SHA links to its full GitHub commit record. Commit messages are reproduced as recorded; they are not independent proof of feature completion or test success.

| Date (UTC) | Commit | GitHub commit message |
|---|---|---|
| 2026-11-05 | [`fde15be`](https://github.com/danshish/jett-distribution-route-planner/commit/fde15be9c5fea7c81f6c93d559ab779e3235d7e1) | Add Jett Pal development and fix history |
| 2026-11-05 | [`82884a3`](https://github.com/danshish/jett-distribution-route-planner/commit/82884a380658eda8a4bb667d50d870d4b4f26ec2) | Restore Valhalla import controls on offline maps screen |
| 2026-11-05 | [`15be2e6`](https://github.com/danshish/jett-distribution-route-planner/commit/15be2e62b4c4f7a1c7f8ce0927a284cd2a6c9630) | Bump Jett Pal to 3.7.3 build 41 |
| 2026-11-05 | [`ea750be`](https://github.com/danshish/jett-distribution-route-planner/commit/ea750beefeb6de487c12e491bc3f587f61714626) | Add live rerouting and visible navigation compass |
| 2026-11-05 | [`1fcfbf7`](https://github.com/danshish/jett-distribution-route-planner/commit/1fcfbf76f553195a3b0beb4bc03ee5544c6523c5) | Bump Jett Pal to 3.7.2 for high-zoom route visibility |
| 2026-11-05 | [`7517a7a`](https://github.com/danshish/jett-distribution-route-planner/commit/7517a7a26b51e9a8c584fde13c2de86fdba10e4f) | Keep route GeoJSON rendered at high zoom and preserve camera centre |
| 2026-11-05 | [`08de0c4`](https://github.com/danshish/jett-distribution-route-planner/commit/08de0c4d9bb884dcf36c38eefdfb6ab837b23279) | Bump Jett Pal to 3.7.1 for route-safe zoom controls |
| 2026-11-05 | [`8f38683`](https://github.com/danshish/jett-distribution-route-planner/commit/8f38683fc170805f32b8083c14ebc4d6434c2b41) | Make zoom controls camera-only to preserve route layers |
| 2026-11-05 | [`98ad688`](https://github.com/danshish/jett-distribution-route-planner/commit/98ad6887e8fb99c76dede68b7e99cf63bcb45b69) | Bump Jett Pal to 3.7.0 with accessible map controls |
| 2026-11-05 | [`ee4a45f`](https://github.com/danshish/jett-distribution-route-planner/commit/ee4a45febf678cdc3c77cac185de8541627eb082) | Preserve manual zoom while live GPS updates |
| 2026-11-05 | [`85e3a1c`](https://github.com/danshish/jett-distribution-route-planner/commit/85e3a1c4fd2be642b772121eeea65aebfb8f97ba) | Add accessible map zoom and GPS recenter controls |
| 2026-11-05 | [`cbe3819`](https://github.com/danshish/jett-distribution-route-planner/commit/cbe3819473fa8d834410336ce93b84491a125eca) | Bump Jett Pal to 3.6.9 for GPS-centred navigation camera |
| 2026-11-05 | [`12c903f`](https://github.com/danshish/jett-distribution-route-planner/commit/12c903f9edff3f22421c981445b189ae3373c965) | Keep navigation camera centred on GPS for route visibility |
| 2026-11-05 | [`e8c16dd`](https://github.com/danshish/jett-distribution-route-planner/commit/e8c16ddfc507754d3d08a9a6896445bc63118780) | Bump Jett Pal to 3.6.8 for forward camera positioning |
| 2026-11-05 | [`24afb10`](https://github.com/danshish/jett-distribution-route-planner/commit/24afb10598da12cd451985759e87e3f84983a993) | Offset navigation camera ahead of GPS marker |
| 2026-11-05 | [`3d671cc`](https://github.com/danshish/jett-distribution-route-planner/commit/3d671cc4f55b883269dfa7d6755e133c22090a1a) | Bump Jett Pal to 3.6.7 for visible route overlay |
| 2026-11-05 | [`d9ff9c7`](https://github.com/danshish/jett-distribution-route-planner/commit/d9ff9c7bc5dddd4c698fa665b6041b1aae8949a5) | Force navigation route layers above offline map styling |
| 2026-11-05 | [`8845b7d`](https://github.com/danshish/jett-distribution-route-planner/commit/8845b7d41fb185dfa972d570cfccbf9bbe680362) | Bump Jett Pal to 3.6.6 for single-address routing |
| 2026-11-05 | [`225ca85`](https://github.com/danshish/jett-distribution-route-planner/commit/225ca852117fc256db3e84557f2552f31f032ebe) | Support GPS-to-single-address offline navigation route |
| 2026-11-05 | [`8fed5a9`](https://github.com/danshish/jett-distribution-route-planner/commit/8fed5a9a378f83a200e5f12ebd351f37ef68be9e) | Bump Jett Pal to 3.6.5 for MapLibre v11 camera fix |
| 2026-11-05 | [`ed49002`](https://github.com/danshish/jett-distribution-route-planner/commit/ed490022da30f2e80f6a370b1dc3d23f45cfad68) | Migrate offline navigation camera to MapLibre v11 API |
| 2026-11-05 | [`155a856`](https://github.com/danshish/jett-distribution-route-planner/commit/155a8561e09d65d2394fd0f830f5c6496d5ff4d5) | Bump Jett Pal to 3.6.4 for GPS-controlled offline camera |
| 2026-11-05 | [`cbc2eaa`](https://github.com/danshish/jett-distribution-route-planner/commit/cbc2eaa72064231de9c89cda85f04487f7103cf6) | Control offline navigation camera directly from live GPS |
| 2026-11-05 | [`885a953`](https://github.com/danshish/jett-distribution-route-planner/commit/885a953d9262b31bca95a32246479a4e18ad174f) | Bump Jett Pal to 3.6.3 for offline navigation camera fix |
| 2026-11-05 | [`98c8011`](https://github.com/danshish/jett-distribution-route-planner/commit/98c80111726c4f9be8feafee1d9f2124acfaaf15) | Fix offline navigation camera zoom and GPS recentering |
| 2026-11-05 | [`ac2b3ca`](https://github.com/danshish/jett-distribution-route-planner/commit/ac2b3cabfda74bbf4dd28c6ddcd6abb464bf8a3a) | Bump Jett Pal to 3.6.2 for navigation improvements |
| 2026-11-05 | [`fcb2a05`](https://github.com/danshish/jett-distribution-route-planner/commit/fcb2a05edfd6f064061a82286cbcec507701c4f4) | Improve offline navigation zoom and on-map turn directions |
| 2026-11-05 | [`b29347f`](https://github.com/danshish/jett-distribution-route-planner/commit/b29347f559a28fd7a7a69cf1f2df4defe562279e) | Guard live map camera until map is ready |
| 2026-11-05 | [`b0c15fe`](https://github.com/danshish/jett-distribution-route-planner/commit/b0c15fede1537729024e421f09f119c2cb0c0b0b) | Drive map camera from live GPS coordinates |
| 2026-11-05 | [`e80d4a8`](https://github.com/danshish/jett-distribution-route-planner/commit/e80d4a8fc247997b1b1481798551984270b03888) | Fix live navigation camera zoom and route direction arrows |
| 2026-11-05 | [`6829b43`](https://github.com/danshish/jett-distribution-route-planner/commit/6829b439f69713031b2681ae7b3a334d4c128484) | Add route direction arrows, GPS route snapping and road instruction preview |
| 2026-11-05 | [`e3971cb`](https://github.com/danshish/jett-distribution-route-planner/commit/e3971cb5b12d881ee0526ee136c9c03311134eb6) | Draw road-following delivery route on offline map |
| 2026-11-05 | [`51582e6`](https://github.com/danshish/jett-distribution-route-planner/commit/51582e67afe82bf2be1722f431e784f5c962cb21) | Show failed delivery address lookups and clarify delivery action |
| 2026-11-05 | [`3523c73`](https://github.com/danshish/jett-distribution-route-planner/commit/3523c7372d11547067af73e37e25429f81a9ae9f) | Fix CSV and Excel filename validation regex |
| 2026-11-05 | [`6100a57`](https://github.com/danshish/jett-distribution-route-planner/commit/6100a574820e1c31ff24e9df5592fe6d3512f9cf) | Correct address detection regular expressions |
| 2026-11-05 | [`5e1f11f`](https://github.com/danshish/jett-distribution-route-planner/commit/5e1f11f92eacdaa4ff39cb128e1bcb662e552485) | Auto-detect address column in CSV Excel and Google Sheets imports |
| 2026-11-05 | [`273b111`](https://github.com/danshish/jett-distribution-route-planner/commit/273b111e87febdc34eedb289328c0790d9c7df62) | Restore Valhalla routing archive import and status controls |
| 2026-11-04 | [`0a047f8`](https://github.com/danshish/jett-distribution-route-planner/commit/0a047f87c4abd5a9a3eb320b519c20db137fa5aa) | Bump Android app version to 3.6.1 (29) |
| 2026-11-04 | [`d7592b9`](https://github.com/danshish/jett-distribution-route-planner/commit/d7592b9c376fe170b5037ad13353a8c0ae6a6b74) | Add live heading arrow to offline GPS marker |
| 2026-11-04 | [`a7c3345`](https://github.com/danshish/jett-distribution-route-planner/commit/a7c33459d239de98038a2471c37ec0af6c5422c3) | Rebuild Jett Pal with configured permanent signing secrets |
| 2026-11-04 | [`eeda6e0`](https://github.com/danshish/jett-distribution-route-planner/commit/eeda6e0155edcc96f291f9ba3c98df9d1245e5f7) | Use permanent signing key for every Jett Pal APK |
| 2026-11-04 | [`b5d27b9`](https://github.com/danshish/jett-distribution-route-planner/commit/b5d27b9c4743416834d8eb2cab2c332590fa8333) | Fix Android signing Gradle pattern matching |
| 2026-11-04 | [`5148f45`](https://github.com/danshish/jett-distribution-route-planner/commit/5148f454f5c26486c0129685f7f97ee0bad4f8dc) | Add permanent Android release signing configuration |
| 2026-11-04 | [`5213322`](https://github.com/danshish/jett-distribution-route-planner/commit/5213322dbd842eba83d5f080edb15c9447120519) | Prepare Jett Pal for stable Android release signing |
| 2026-11-04 | [`55d46b1`](https://github.com/danshish/jett-distribution-route-planner/commit/55d46b1f2618246bc3a810b44a2255b1ee6cbb4f) | Add live high-accuracy GPS tracking and next-stop guidance |
| 2026-11-04 | [`4b9fb6f`](https://github.com/danshish/jett-distribution-route-planner/commit/4b9fb6f0f08f31cfda97e600c44ebe0739d9b411) | Hide bottom navigation in expanded offline map |
| 2026-11-04 | [`697d8b0`](https://github.com/danshish/jett-distribution-route-planner/commit/697d8b0d8e7d027920b596337cf2669150c82ab3) | Add offline map 2D/3D controls, building extrusion and enlarge view |
| 2026-11-02 | [`c6f5c76`](https://github.com/danshish/jett-distribution-route-planner/commit/c6f5c764749e8b5433c97bd2a1e24106ca221c1d) | Restore main APK build Java version |
| 2026-11-02 | [`1eb6388`](https://github.com/danshish/jett-distribution-route-planner/commit/1eb6388f9c0861d2925b5d9a700d75ee18516e20) | Prepare offline routing branch for Valhalla Java 21 |
| 2026-11-02 | [`d39d82f`](https://github.com/danshish/jett-distribution-route-planner/commit/d39d82fef4410bbe3e6044d553fff6ddca22fcf5) | Bump Android build to 3.5.9 |
| 2026-11-02 | [`a54b784`](https://github.com/danshish/jett-distribution-route-planner/commit/a54b78475e4c5b110a706e615640564ea38b60a8) | Add first-stage offline GPS route progress screen |
| 2026-11-02 | [`9d31482`](https://github.com/danshish/jett-distribution-route-planner/commit/9d31482cbaa4cbdc5765540a07e87c8acd1e4479) | Bump Android build to 3.5.8 |
| 2026-11-02 | [`55a072a`](https://github.com/danshish/jett-distribution-route-planner/commit/55a072a6d226773f6c169051903e916283dc0540) | Fit all located delivery stops in map view |
| 2026-11-02 | [`e7b63fc`](https://github.com/danshish/jett-distribution-route-planner/commit/e7b63fcc8d93903499a3f3301f05f7a00a1823a0) | Bump Android build to 3.5.7 |
| 2026-11-02 | [`2cb8d21`](https://github.com/danshish/jett-distribution-route-planner/commit/2cb8d21617db799b4200c453414a47f7408b7162) | Render delivery stop pins with GeoJSON map layers |
| 2026-11-02 | [`2aea9ed`](https://github.com/danshish/jett-distribution-route-planner/commit/2aea9edf74a97225a57d63f765de7b8033f065d0) | Bump Android build to 3.5.6 |
| 2026-11-02 | [`eb37d68`](https://github.com/danshish/jett-distribution-route-planner/commit/eb37d68db39f92d6af431443a516a9fed2ba7f59) | Temporarily remove crashing map pin annotations |
| 2026-11-02 | [`5448442`](https://github.com/danshish/jett-distribution-route-planner/commit/5448442ed1d8e0999c34290eec4ddec2c89f033d) | Bump Jett Pal to 3.5.5 for map pins |
| 2026-11-02 | [`ec3dbd3`](https://github.com/danshish/jett-distribution-route-planner/commit/ec3dbd320d5bb1982ea765976119e88f6759fde5) | Add delivery stop coordinates and offline map pins |
| 2026-11-02 | [`d017134`](https://github.com/danshish/jett-distribution-route-planner/commit/d017134f8ab5515a9f3e376c596881cc029a54db) | Add offline map navigation choice for delivery routes |
| 2026-11-02 | [`844a7a9`](https://github.com/danshish/jett-distribution-route-planner/commit/844a7a9c6438caa5f374d12bedb680f32e59b3d6) | Bump Jett Pal version for Excel import fix |
| 2026-11-02 | [`f3c57fe`](https://github.com/danshish/jett-distribution-route-planner/commit/f3c57fe342bf7e8ab7639d181fd058f5dceb505d) | Make Excel import more reliable on Android |
| 2026-11-02 | [`fffd766`](https://github.com/danshish/jett-distribution-route-planner/commit/fffd766f0722828a3c3570163cb393a6dda34d8a) | Add first Jett Pal owner setup script |
| 2026-11-02 | [`f4c1753`](https://github.com/danshish/jett-distribution-route-planner/commit/f4c1753cd8341d18ee78f629901b2d4f6ab8ab3d) | Add account profile and in-app password management |
| 2026-11-01 | [`0e69fe9`](https://github.com/danshish/jett-distribution-route-planner/commit/0e69fe9a7924d78c4dd5a5e93e31f0f4b42e19b9) | Add show/hide password controls to authentication |
| 2026-11-01 | [`1f2e675`](https://github.com/danshish/jett-distribution-route-planner/commit/1f2e6753790f2b6259b181068c85429f8db86b91) | Add Jett Pal account and sign out controls to settings |
| 2026-11-01 | [`fd6c54b`](https://github.com/danshish/jett-distribution-route-planner/commit/fd6c54b7e64de7740dd843ce7b4d4a6506b52ebd) | Fix password recovery deep link handling |
| 2026-11-01 | [`aea956e`](https://github.com/danshish/jett-distribution-route-planner/commit/aea956ecca661793b34453ba512f160c4caef3b8) | Use configured app deep link for email confirmation |
| 2026-11-01 | [`7a5fd12`](https://github.com/danshish/jett-distribution-route-planner/commit/7a5fd12005d52a78b4fd01ddb0bfb314548ec616) | Fix password reset deep link for Android |
| 2026-11-01 | [`447e54a`](https://github.com/danshish/jett-distribution-route-planner/commit/447e54a968bec929d362ca7889ba14f53140bb32) | Remove stray duplicated JSX after auth screen |
| 2026-11-01 | [`10ce074`](https://github.com/danshish/jett-distribution-route-planner/commit/10ce07422588774589024ae2baabb014646b4680) | Remove duplicated JSX causing Android build failure |
| 2026-11-01 | [`50ef5ba`](https://github.com/danshish/jett-distribution-route-planner/commit/50ef5ba4a792a1db3e3fb4d102acee975a81d3b2) | Show password reset screen while recovery session is active |
| 2026-11-01 | [`d32041e`](https://github.com/danshish/jett-distribution-route-planner/commit/d32041eea8c29f91e27d2286f95ea608ce547efd) | Add forgot-password email flow and in-app password reset screen |
| 2026-11-01 | [`6a7b4c2`](https://github.com/danshish/jett-distribution-route-planner/commit/6a7b4c2fa7afca43a89a58a6e14f0363a3476dbb) | Redirect Supabase email confirmation back into Jett Pal |
| 2026-11-01 | [`e2966d0`](https://github.com/danshish/jett-distribution-route-planner/commit/e2966d0bafd79d71358cc40dab799cdda37d218a) | Add Jett Pal deep-link scheme for email authentication |
| 2026-11-01 | [`f2b4322`](https://github.com/danshish/jett-distribution-route-planner/commit/f2b43227356c13e96dcde8aa557c5f8c40ab01df) | Add Jett Pal deep-link scheme for email authentication |
| 2026-11-01 | [`b375e94`](https://github.com/danshish/jett-distribution-route-planner/commit/b375e94cc7f68b9834e74c49fe1ca50a434a2df7) | Add Supabase email sign-up and sign-in gate to Jett Pal |
| 2026-11-01 | [`4fd5082`](https://github.com/danshish/jett-distribution-route-planner/commit/4fd508259c90c3536b0795e88c6f246054ced34d) | Document Supabase build configuration and current integration status |
| 2026-11-01 | [`777b4b9`](https://github.com/danshish/jett-distribution-route-planner/commit/777b4b9574917c20bb555924504bbe8f69dc6fc5) | Pass Supabase public config securely into Android build |
| 2026-11-01 | [`5a1c584`](https://github.com/danshish/jett-distribution-route-planner/commit/5a1c584b3e1ad0891b4458818b84c81606d751a4) | Ignore local environment files and build artifacts |
| 2026-11-01 | [`653a008`](https://github.com/danshish/jett-distribution-route-planner/commit/653a0080b4581cbb831b283b62ef51e544da0041) | Add Supabase client configuration and setup guide |
| 2026-11-01 | [`20b79a7`](https://github.com/danshish/jett-distribution-route-planner/commit/20b79a71f3fceb7fbdcd1211ccc2dabae5cdce2e) | Add Supabase client configuration and setup guide |
| 2026-11-01 | [`a619421`](https://github.com/danshish/jett-distribution-route-planner/commit/a619421b9324bbbcde851f88a812a03fc0b53873) | Add Supabase client configuration and setup guide |
| 2026-11-01 | [`bcdc9d9`](https://github.com/danshish/jett-distribution-route-planner/commit/bcdc9d98efa2dcc4009cf7c69edb78256b586ef0) | Add Supabase client dependency |
| 2026-11-01 | [`d04fa5a`](https://github.com/danshish/jett-distribution-route-planner/commit/d04fa5a286fa773954f8bb2e50919c4b039f64aa) | Add initial multi-company Supabase schema with tenant RLS |
| 2026-11-01 | [`ea8a27f`](https://github.com/danshish/jett-distribution-route-planner/commit/ea8a27fa40544e44c48beebb9f4dd2887650d30d) | Recommend Supabase backend for commercial multi-company architecture |
| 2026-11-01 | [`c98a458`](https://github.com/danshish/jett-distribution-route-planner/commit/c98a458a2f3fb676ace018b3a68afd59e034ee56) | Add commercial product roadmap for multi-company Jett Pal |
| 2026-11-01 | [`9578e59`](https://github.com/danshish/jett-distribution-route-planner/commit/9578e595c17904acd1de1ed4cd3af3b7f4c8108e) | Remove unsupported module generator from APK workflow |
| 2026-11-01 | [`ac58fb1`](https://github.com/danshish/jett-distribution-route-planner/commit/ac58fb101d918ded05bf3f9857f7943fb643776c) | Fix Expo SDK 54 local module scaffold command |
| 2026-11-01 | [`5a61190`](https://github.com/danshish/jett-distribution-route-planner/commit/5a611901b94606a359373846d46a908d2a0cad02) | Add SDK 54-compatible Jett offline routing module scaffold to APK build |
| 2026-11-01 | [`125eb3e`](https://github.com/danshish/jett-distribution-route-planner/commit/125eb3e95fcbfb1d237e86e678e3ffb5669f339a) | Bump Jett Pal diagnostic build to 3.5.3 |
| 2026-11-01 | [`0380361`](https://github.com/danshish/jett-distribution-route-planner/commit/0380361c157bef31d0ef73d00ac3f330cd131ec3) | Add offline map loading diagnostics |
| 2026-11-01 | [`df906a9`](https://github.com/danshish/jett-distribution-route-planner/commit/df906a969bfaa9e477f889d3be47bd5c789c7956) | Bump Jett Pal to version 3.5.2 build 20 |
| 2026-11-01 | [`5d8682d`](https://github.com/danshish/jett-distribution-route-planner/commit/5d8682d23e0875fbf6c52bc969e307ef5cb37742) | Add driver management and shift assignment |
| 2026-11-01 | [`ba97285`](https://github.com/danshish/jett-distribution-route-planner/commit/ba9728524b2ec075d3cbf1df6c313c0e5bac7109) | Bump Jett Pal to version 3.5.1 build 19 |
| 2026-11-01 | [`b096940`](https://github.com/danshish/jett-distribution-route-planner/commit/b0969405058da69630da928d8d9a3a358d1fb25e) | Add daily vehicle safety checklist |
| 2026-11-01 | [`6396890`](https://github.com/danshish/jett-distribution-route-planner/commit/63968900734078586c07b6a6902b919077cb6c7f) | Bump Jett Pal to version 3.5.0 build 18 |
| 2026-11-01 | [`0b4e9e9`](https://github.com/danshish/jett-distribution-route-planner/commit/0b4e9e965a3aa30104f83f61b77e374676ea1c1a) | Add vehicle mileage and fuel log |
| 2026-11-01 | [`b3be118`](https://github.com/danshish/jett-distribution-route-planner/commit/b3be1186bfde2ba1ca69609d94164e3aab8529b7) | Bump Jett Pal to version 3.4.9 build 17 |
| 2026-11-01 | [`0b3044b`](https://github.com/danshish/jett-distribution-route-planner/commit/0b3044b0223e2f74a890b60ba0570bab393da662) | Add vehicle defect and incident reporting log |
| 2026-11-01 | [`628c8b9`](https://github.com/danshish/jett-distribution-route-planner/commit/628c8b9ef5be588ed9eaffba1decd9f150cdc529) | Bump Jett Pal to version 3.4.8 build 16 |
| 2026-11-01 | [`a5b2aae`](https://github.com/danshish/jett-distribution-route-planner/commit/a5b2aae8057753815f1417400bb3d4539e168ed4) | Add daily shift handover report export |
| 2026-11-01 | [`46f2b70`](https://github.com/danshish/jett-distribution-route-planner/commit/46f2b705eaee3db5f86e3c7a23478db05a2723eb) | Bump Jett Pal to version 3.4.7 build 15 |
| 2026-11-01 | [`e782179`](https://github.com/danshish/jett-distribution-route-planner/commit/e78217951d7964d17487d6dda286536599770009) | Add driver sign-off screen with drawn signature |
| 2026-11-01 | [`35c356b`](https://github.com/danshish/jett-distribution-route-planner/commit/35c356b68919bb2f0c100bea5633822291eb5ba6) | Add SVG signature support for driver sign-off |
| 2026-11-01 | [`0d1b133`](https://github.com/danshish/jett-distribution-route-planner/commit/0d1b133051ddd464b55faad06fde7166a0661a05) | Bump Jett Pal to 3.4.6 build 14 |
| 2026-11-01 | [`c5c190f`](https://github.com/danshish/jett-distribution-route-planner/commit/c5c190f20f0e479928c2130cb22daa7bca5981fd) | Add vehicle return stock check and load photo capture |
| 2026-11-01 | [`c40fc88`](https://github.com/danshish/jett-distribution-route-planner/commit/c40fc880428c812ab671b5da99c58ff0bbcbdda6) | Add camera support for vehicle load photos |
| 2026-11-01 | [`579dbd1`](https://github.com/danshish/jett-distribution-route-planner/commit/579dbd14d4ddf5265612541dcb38c456ddcff7b0) | Bump Jett Pal to 3.4.5 build 13 |
| 2026-11-01 | [`498c82a`](https://github.com/danshish/jett-distribution-route-planner/commit/498c82a9371f9400249caee35f1c5a4f12569e2c) | Bump Jett Pal to 3.4.4 build 12 |
| 2026-11-01 | [`86747f3`](https://github.com/danshish/jett-distribution-route-planner/commit/86747f32dee6fea08240106319c236be90e9e306) | Add exportable daily delivery sheet |
| 2026-11-01 | [`8d82646`](https://github.com/danshish/jett-distribution-route-planner/commit/8d82646b2acba97477475d56f8617e3e5ad85f59) | Add file sharing for delivery sheet exports |
| 2026-11-01 | [`4761c90`](https://github.com/danshish/jett-distribution-route-planner/commit/4761c90720e088573a115f94d72ebaf3f2dfed58) | Bump Jett Pal to 3.4.3 for map labels |
| 2026-11-01 | [`aaf5cee`](https://github.com/danshish/jett-distribution-route-planner/commit/aaf5cee944e4e570443d0c6c8801a75a220aee2d) | Add street and place labels to offline map |
| 2026-11-01 | [`f30a80a`](https://github.com/danshish/jett-distribution-route-planner/commit/f30a80a9f0f5457ee7dd686359bb66edc0257f3e) | Bump Jett Pal build for offline map URI fix |
| 2026-11-01 | [`cc1ce0f`](https://github.com/danshish/jett-distribution-route-planner/commit/cc1ce0f21dc0d08ec3cc88b22179860eea7024b6) | Fix local PMTiles file URI for Android map rendering |
| 2026-11-01 | [`0e24c08`](https://github.com/danshish/jett-distribution-route-planner/commit/0e24c08ed432ab049fad5ad9e117002b4452aba0) | Version Jett Pal in-app offline map download update |
| 2026-11-01 | [`add1e11`](https://github.com/danshish/jett-distribution-route-planner/commit/add1e1197b78226d7652afacb9301dd57a77775b) | Add in-app UK offline map download with progress |
| 2026-11-01 | [`d07da32`](https://github.com/danshish/jett-distribution-route-planner/commit/d07da32b4a463d52b4bf8ce8ad51151e39b39a68) | Bump Jett Pal build for offline map support |
| 2026-11-01 | [`12074a3`](https://github.com/danshish/jett-distribution-route-planner/commit/12074a359e19123005448b9de55c2f02b4ba0ebd) | Correct local PMTiles file URI |
| 2026-11-01 | [`d6fb7a5`](https://github.com/danshish/jett-distribution-route-planner/commit/d6fb7a51674bc01a2a5d91bbc9bac176f498bd31) | Add UK PMTiles import and offline map screen |
| 2026-11-01 | [`889ea4a`](https://github.com/danshish/jett-distribution-route-planner/commit/889ea4ab572e69692b01602516501c1caa7a89fc) | Configure MapLibre native plugin |
| 2026-11-01 | [`42aae65`](https://github.com/danshish/jett-distribution-route-planner/commit/42aae656b01c7bbf830197e0abe96594cc12788d) | Add MapLibre for offline UK maps |
| 2026-11-01 | [`79015f7`](https://github.com/danshish/jett-distribution-route-planner/commit/79015f771226ebb8502c058206f6393a084743a4) | Apply Jett Pal Pro mockup dashboard styling |
| 2026-11-01 | [`e90d28e`](https://github.com/danshish/jett-distribution-route-planner/commit/e90d28e033aaa365222babe07872a646fdaec7b8) | Match Jett Pal home screen to original reference design |
| 2026-11-01 | [`cf6d5bf`](https://github.com/danshish/jett-distribution-route-planner/commit/cf6d5bf0b22cbeef58fa4aa35001e9e7ef6452b8) | Refresh Jett Pal home dashboard design |
| 2026-10-31 | [`434a76d`](https://github.com/danshish/jett-distribution-route-planner/commit/434a76d1bdb7a726568e1396dd4c3a26658ce362) | Add end-of-day delivery summary |
| 2026-10-31 | [`f874cba`](https://github.com/danshish/jett-distribution-route-planner/commit/f874cba731069678f102982786d12783e70912ca) | Add delivery outcome and completion reports |
| 2026-10-31 | [`e4618ab`](https://github.com/danshish/jett-distribution-route-planner/commit/e4618ab260c96c799d0be3618295fc1162a2100d) | Add Jett delivery manager and stock control |
| 2026-10-31 | [`c6f36c9`](https://github.com/danshish/jett-distribution-route-planner/commit/c6f36c9db2f65f1a001b115ca1b007e4002ed17f) | Add delivery performance dashboard |
| 2026-10-31 | [`6bfc022`](https://github.com/danshish/jett-distribution-route-planner/commit/6bfc02241f187c301fd5fd9a61f03ac1309f00ad) | Fix Jett Pal welcome panel divider spacing |
| 2026-10-31 | [`1b63b83`](https://github.com/danshish/jett-distribution-route-planner/commit/1b63b832653a2de69c96314eaaae0c2d7301b303) | Use real Jett delivery van photo on home screen |
| 2026-10-31 | [`b5ad336`](https://github.com/danshish/jett-distribution-route-planner/commit/b5ad336235d4eb2f4028dfd29d9bf79e43952f9b) | Add files via upload |
| 2026-10-31 | [`91f32df`](https://github.com/danshish/jett-distribution-route-planner/commit/91f32dfa81e3d50f1ce6b6bb9cf032042f348211) | Refresh Jett Pal home screen branding and welcome layout |
| 2026-10-31 | [`4863b2d`](https://github.com/danshish/jett-distribution-route-planner/commit/4863b2dd315935157ad75fc5baca41b210ada092) | Correct delivery waypoints for selected route start |
| 2026-10-31 | [`18234d6`](https://github.com/danshish/jett-distribution-route-planner/commit/18234d6ecf9ed94b9b672d8cfdc27402805ca827) | Pass selected route start and return into navigation |
| 2026-10-31 | [`20fb782`](https://github.com/danshish/jett-distribution-route-planner/commit/20fb78224431b19720cd3d6d64c373ca9e266e28) | Update Jett branding to Jett Pal |
| 2026-10-31 | [`9e3ae66`](https://github.com/danshish/jett-distribution-route-planner/commit/9e3ae6682c193bba521a7ae8f3a509db63ce5ca0) | Rename app to Jett Pal |
| 2026-10-31 | [`d66cb0a`](https://github.com/danshish/jett-distribution-route-planner/commit/d66cb0ab6eb741e181a991d327fa084296dccf52) | Correct route ordering with optional starting point |
| 2026-10-31 | [`b3d05b7`](https://github.com/danshish/jett-distribution-route-planner/commit/b3d05b780cd25e9eac7e058490441a6edd7db2fa) | Add flexible route start and return option |
| 2026-10-31 | [`7275167`](https://github.com/danshish/jett-distribution-route-planner/commit/72751677d4e7c0e3c3859fcf98f57d6c8a3a13a8) | Add location services for flexible route starts |
| 2026-10-31 | [`0b23a1a`](https://github.com/danshish/jett-distribution-route-planner/commit/0b23a1a2ac8d695b74e55054be565b399bf369c8) | Add real road route optimisation |
| 2026-10-31 | [`0dbc960`](https://github.com/danshish/jett-distribution-route-planner/commit/0dbc960055a33a75021b64135c7d7c15b49fadfa) | Add Google Sheets link import |
| 2026-10-31 | [`d79da4c`](https://github.com/danshish/jett-distribution-route-planner/commit/d79da4cfac3dcf4524c266c57fc34b9fef2ddb5f) | Add Excel and CSV delivery list importer |
| 2026-10-31 | [`00eccc7`](https://github.com/danshish/jett-distribution-route-planner/commit/00eccc79d660d7d07bc2e28be46e6b54bbed32c7) | Add Excel and CSV import dependencies |
| 2026-10-31 | [`dee3c5a`](https://github.com/danshish/jett-distribution-route-planner/commit/dee3c5aae4d94c4fe11c3e58f0a341b33143083f) | Add Android bottom navigation safe spacing |
| 2026-10-31 | [`792c205`](https://github.com/danshish/jett-distribution-route-planner/commit/792c205c807a2843f05ecdd0329a40993967948d) | Fix Multi Stop Maps browser launch fallback |
| 2026-10-31 | [`0b3fb8d`](https://github.com/danshish/jett-distribution-route-planner/commit/0b3fb8d948ebf03ff05836b18db7d4c16a9b0edc) | Rename Chrome navigation option to Multi Stop Maps |
| 2026-10-31 | [`c0281ab`](https://github.com/danshish/jett-distribution-route-planner/commit/c0281abfb239089a9f6e40a1c5bedab5b63269be) | Add Chrome browser option for multi-stop navigation |
| 2026-10-31 | [`8aa6e12`](https://github.com/danshish/jett-distribution-route-planner/commit/8aa6e1216c572b075b94873539f8c4613d4d02d4) | Add ordered multi-stop Google Maps navigation |
| 2026-10-31 | [`a3c138d`](https://github.com/danshish/jett-distribution-route-planner/commit/a3c138d99289daa8cfa0286a038e773e99d351bb) | Fix navigation to use full delivery address |
| 2026-10-31 | [`c80f559`](https://github.com/danshish/jett-distribution-route-planner/commit/c80f559b5bb8306d8ad75a2e9d7754d5bbe168cf) | Connect House Finder to verified UK address lookup |
| 2026-10-31 | [`549420a`](https://github.com/danshish/jett-distribution-route-planner/commit/549420af0f1792e83af3bb1dce387d11737c1aa2) | Improve strict UK house address matching |
| 2026-10-31 | [`bca5693`](https://github.com/danshish/jett-distribution-route-planner/commit/bca56936ad180e46d7614c7d7e842a5f8511c2e9) | Remove temporary ChatGPT GitHub connection test |
| 2026-10-31 | [`4023bae`](https://github.com/danshish/jett-distribution-route-planner/commit/4023bae13c56637fdc9aeac95556ce72a0967c3c) | Test ChatGPT GitHub connection |
| 2026-10-31 | [`d4ebe01`](https://github.com/danshish/jett-distribution-route-planner/commit/d4ebe013e2680cfc9bd414725432c462d63569af) | Refactor App.js layout and components |
| 2026-10-31 | [`186b57e`](https://github.com/danshish/jett-distribution-route-planner/commit/186b57e6759e92d27982fd5ed3b50c44d8cbd3bd) | Fix syntax error in App.js |
| 2026-10-31 | [`99415d7`](https://github.com/danshish/jett-distribution-route-planner/commit/99415d749b310db4c815af2bd4225b552c0b4681) | Update styles in App.js |
| 2026-10-31 | [`1a137e3`](https://github.com/danshish/jett-distribution-route-planner/commit/1a137e3477ae82dff04d62379b0d21437f19eb65) | Fix syntax error in App.js |
| 2026-10-31 | [`e126a46`](https://github.com/danshish/jett-distribution-route-planner/commit/e126a46a729af0645fac367d6230209e522d2608) | Refactor openNavigation to use Alert for navigation options |
| 2026-10-31 | [`f5a7cb0`](https://github.com/danshish/jett-distribution-route-planner/commit/f5a7cb080f049cdd18f04630cea9b0b7dd625ce6) | Enhance address search functionality in App.js |
| 2026-10-28 | [`39e8966`](https://github.com/danshish/jett-distribution-route-planner/commit/39e8966c6a1284386f293ddf3af19b288dee35bc) | Fix closing tag for View component in App.js |
| 2026-10-28 | [`daf25aa`](https://github.com/danshish/jett-distribution-route-planner/commit/daf25aa370a0073a2c47fdac08d34640dd066f04) | Jett loading screen |
| 2026-10-27 | [`9e9e946`](https://github.com/danshish/jett-distribution-route-planner/commit/9e9e946d33c97fc2761ec210ab7e303693a2be7f) | Add files via upload |
| 2026-10-27 | [`7efa476`](https://github.com/danshish/jett-distribution-route-planner/commit/7efa476875b71a77897747b441fece57669a8c54) | Refactor scoring logic for address matching |
| 2026-10-27 | [`49c8bc7`](https://github.com/danshish/jett-distribution-route-planner/commit/49c8bc7e06aa7459d972d36be4c5e98497573d88) | Enhance address search with postcode and house number |
| 2026-10-27 | [`72cb7f7`](https://github.com/danshish/jett-distribution-route-planner/commit/72cb7f78039033690efaa4a9a62224cc08a7531b) | Filter results to include only 'united kingdom' |
| 2026-10-26 | [`16dd50e`](https://github.com/danshish/jett-distribution-route-planner/commit/16dd50e23431564148b9d83d4464144fa9ef5d5e) | Fix address search |
| 2026-10-26 | [`b032022`](https://github.com/danshish/jett-distribution-route-planner/commit/b032022e8fbb1b3473b3ac8895c3da6800090d7e) | Update App.js |
| 2026-10-21 | [`c99b377`](https://github.com/danshish/jett-distribution-route-planner/commit/c99b377c47fcf45a7fac54acd224f2ee271a3413) | Refactor App.js layout for improved readability |
| 2026-10-21 | [`15997cd`](https://github.com/danshish/jett-distribution-route-planner/commit/15997cded1d04a7f001374384591e1408ea1586e) | Adjust padding in content style for better layout |
| 2026-10-20 | [`2663722`](https://github.com/danshish/jett-distribution-route-planner/commit/2663722ce25872556dcba967590d9c148b0c5038) | Change logo image source in App.js |
| 2026-10-20 | [`f9aa042`](https://github.com/danshish/jett-distribution-route-planner/commit/f9aa04242cc6d05d50259273fd66b5dc5fb83f2f) | Fix formatting of icon entry in app.json |
| 2026-10-20 | [`db5c888`](https://github.com/danshish/jett-distribution-route-planner/commit/db5c8883edac3e5feb8352f867d53eafd083bf87) | Add icon property to app.jjson |
| 2026-10-20 | [`174482e`](https://github.com/danshish/jett-distribution-route-planner/commit/174482e49c032a11e5c7b5c8a3fda38da8b332c4) | Add files via upload |
| 2026-10-20 | [`d0b7bcd`](https://github.com/danshish/jett-distribution-route-planner/commit/d0b7bcd5bec114a53f2ad51ab51a02b6cada6ee4) | Fix missing newline at end of app.json |
| 2026-10-20 | [`64ef749`](https://github.com/danshish/jett-distribution-route-planner/commit/64ef7495407955e4cabb2bccc76936d74c51716f) | Update logo image path in App.js |
| 2026-10-20 | [`c45c311`](https://github.com/danshish/jett-distribution-route-planner/commit/c45c31108991259d79ac617bd3b656d7e50a5bd1) | Refactor state initialization in App component |
| 2026-10-20 | [`3edc71b`](https://github.com/danshish/jett-distribution-route-planner/commit/3edc71b48a7bc31b92648e6c538a43db1907e02a) | Change APK build from debug to release |
| 2026-10-20 | [`8a58edd`](https://github.com/danshish/jett-distribution-route-planner/commit/8a58edd12750ed86d77e66749b9eb9b6d99ca577) | Add GitHub Actions workflow to build APK |
| 2026-10-20 | [`f364907`](https://github.com/danshish/jett-distribution-route-planner/commit/f364907f7340de0c8b242062608b1102ef2d3a30) | Add files via upload |
| 2026-10-20 | [`548a17b`](https://github.com/danshish/jett-distribution-route-planner/commit/548a17b950491aaf7c2a452a3e73af728a6c4a51) | Add files via upload |
