# OurOrbit Meta Glasses Prototype

This folder is intentionally isolated from the production Expo app.

It sketches the smallest Android-native bridge shape for Meta Wearables Device Access Toolkit integration after SDK access is granted.

## Current Decision

Meta Glasses support is a technical spike / future Phase 3+ feature. Do not wire this prototype into production app behavior yet.

Before production work:

- Apply for or monitor Meta Wearables developer access.
- Confirm SDK artifacts, supported hardware, permissions, and API capabilities.
- Build a native Android proof of concept only after SDK access is confirmed.
- Gate any future production UI behind a remote feature flag.

Phase 3+ MVP target:

- AI Coach prompt card.
- Today quick action card.
- Orbit summary card.

Deferred:

- Proof photo capture.
- Raw camera/audio.
- Always-on voice.
- Production mobile integration.

## Files

- `android/MetaGlassesBridge.kt`
  - Kotlin bridge facade.
  - Uses Bluetooth bonded-device heuristics only as a placeholder.
  - Marks Meta SDK calls as TODOs because public SDK artifacts/API signatures were not available.
- `src/MetaGlassesModule.ts`
  - React Native JS wrapper shape for a future Expo native module.

## Prototype Goals

- Detect whether a possible Meta/Ray-Ban glasses device is paired.
- Return capability flags.
- Connect through the future Meta SDK.
- Render simple OurOrbit cards.
- Receive simple input events.

## Why This Is Not In Production Yet

The app currently has no checked-in generated `android/` folder. Adding a native SDK requires Expo prebuild/dev-client and likely a config plugin. The SDK itself appears to be Developer Preview/gated, so production code should wait until SDK access, docs, and hardware are available.

## Next Native Steps After SDK Access

1. Create an Expo config plugin:
   - Add Meta Maven repository/dependency if required.
   - Add permissions and manifest service/activity entries.
   - Register native module package.
2. Replace placeholder `MetaSdkAdapter` methods with real toolkit calls.
3. Test on physical Ray-Ban Display hardware.
4. Keep feature flag disabled until review passes.
