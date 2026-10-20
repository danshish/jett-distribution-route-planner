# Jett Distribution Route Planner V3.2

Branded UI upgrade for the Jett Distribution route-planning app.

## Screens
- Branded home screen
- House Name Finder: searches house names, house numbers, streets, towns and UK postcodes while online
- Address details screen and Add to Route
- Route summary with cached-location distance estimates
- Nearest-next-stop optimisation using cached coordinates
- Delivery status tracking
- Saved routes stored locally
- Map/navigation handoff to Google Maps
- Online/offline status and offline search through previously cached addresses

## Run on your Android phone
1. Extract this ZIP in an Expo-compatible environment.
2. Run `npm install`.
3. Run `npx expo start`.
4. Open it in Expo Go or build an Android APK with EAS Build.

Note: first-time address searches need internet. Search results are cached on the phone. Map tiles and Google Maps navigation need internet. Distance/time are approximate straight-line estimates, not road-routing estimates. The app uses the public Nominatim service for prototype address lookup; production use should use a properly hosted/compliant geocoding provider.


## V3.3 navigation app choice
- Users can choose Google Maps or Apple Maps each time they navigate.
- A Navigation Settings screen lets users select a preferred map app or choose to be asked every time.
- The selection is saved on the device.
- Important: Apple Maps is not natively available as an installed app on Android. On a Moto G17, Google Maps is the recommended option; Apple Maps links may open in a browser or fail depending on the device/browser.
