# Meta Glasses Integration Research

Date: 2026-06-28

## Scope

This is a research/prototype pass only. It does not change production OurOrbit behavior.

## Product Decision

Meta Glasses integration is a technical spike and future Phase 3+ feature. Do not implement production Meta glasses support yet.

Reason: Meta Wearables Device Access Toolkit access, API shape, supported hardware, camera/audio/display capabilities, review requirements, and Expo integration path are not confirmed enough for production work.

Current decision:

- Keep the prototype under `prototypes/meta-glasses/`.
- Apply for or monitor Meta Wearables developer access.
- Validate SDK availability, supported hardware, permissions, and review requirements.
- Build a native Android proof of concept only after SDK access is confirmed.
- Gate any future production UI behind a remote feature flag.
- Do not modify production app behavior yet.

## Current Public Toolkit Picture

Meta's Ray-Ban Display developer access is currently described as a Developer Preview. Public reporting says there are two integration paths:

- Native mobile apps through the Meta Wearables Device Access Toolkit for Android and iOS.
- Web apps using HTML, CSS, and JavaScript.

The native toolkit is described as a way to extend mobile apps onto the Ray-Ban Display, with UI primitives such as text, images, lists, buttons, and video playback. The same reporting says the Neural Band can provide gesture-based input for the in-lens display experience.

Sources:

- https://www.androidcentral.com/gaming/virtual-reality/metas-ray-ban-display-build-for-the-future-opens-its-doors-to-developers
- https://www.androidcentral.com/wearables/meta-ray-ban-display-glasses
- https://www.meta.com/ai-glasses/

Important caveat: I did not find public, stable SDK reference docs or Maven artifacts for the Meta Wearables Device Access Toolkit from the open web search surface. Treat exact package names, Gradle coordinates, permissions, and API signatures as gated/preview information that must be confirmed after Meta developer access is granted.

## Current OurOrbit App Architecture

OurOrbit mobile is currently an Expo app with no checked-in generated `android/` folder:

- `app.json` configures Expo Router, SecureStore, Notifications, Splash Screen, Google Sign-In, and Font.
- `package.json` uses Expo SDK 54 and `expo-dev-client`.
- `/android` is gitignored as a generated native folder.

That means a native Android SDK integration cannot ship in Expo Go. It requires one of:

1. Expo prebuild plus a custom native module.
2. An Expo config plugin that injects the Meta SDK dependency, permissions, manifest entries, and native package registration.
3. A separate native Android proof-of-concept app outside the production app.

Recommended path: start with a separate native/sample module under `prototypes/`, then migrate to an Expo config plugin after SDK access and hardware testing.

## Supported Capability Assumptions

Based on public information, plausible supported capabilities for Ray-Ban Display are:

- Detect/connect through Meta's phone-side companion/device access layer.
- Render simple display surfaces: text, images, lists, buttons.
- Render video playback or media surfaces.
- Receive simple input from the Neural Band / display UI.
- Possibly trigger or consume camera/audio workflows, but exact third-party access boundaries are not publicly confirmed.

Capabilities that should be treated as unconfirmed until SDK docs are available:

- Raw camera frames.
- Direct proof photo capture from third-party apps.
- Raw microphone/audio stream access.
- Background wake-word or always-listening access.
- Full device pairing independent of Meta's companion app.

## OurOrbit MVP Use Case Mapping

### Ask AI Coach What To Focus On

Best MVP fit.

Use the existing `/api/ai/coach/chat` endpoint and show a short answer on the glasses display. Input can start from a button/gesture prompt list:

- "Focus today"
- "Falling behind"
- "Quick win"
- "Orbit status"

Risk: voice input may not be available directly to third-party apps. If not, use Neural Band/display button input.

### Complete Habit/Task Hands-Free

Good MVP fit with guardrails.

Show top safe actions from Today and Predictive Coaching. Allow completion only when the item does not require proof, text verification, photo verification, or approval. For verification-required items, show "Needs phone".

### Capture Proof Photo

Not recommended for first MVP.

This depends on whether the toolkit exposes camera capture to third-party apps. Even if available, proof capture needs privacy affordances, bystander consent guidance, upload handling, and failure states. First MVP should deep-link/open the phone for proof.

### View Orbit Progress

Good MVP fit.

Display lightweight Orbit status:

- Orbit name
- Health score
- Level
- milestone/progress
- urgent notifications

## Recommended MVP Implementation Plan

1. Apply for/obtain Meta Developer Preview access and SDK artifacts.
2. Build a native Android proof-of-concept outside production:
   - device availability
   - connect/disconnect
   - render text/list/buttons
   - receive one input callback
3. Add an Expo config plugin and native module:
   - `MetaGlassesModule`
   - JS methods: `isAvailable`, `getCapabilities`, `connect`, `showCoachCard`, `showActions`, `clear`
   - event emitter: `onMetaGlassesAction`
4. Gate all production UI behind a remote flag:
   - disabled by default
   - Android only until iOS SDK is separately validated
5. MVP surfaces:
   - Coach prompt card
   - Today quick action card
   - Orbit summary card
6. Defer:
   - proof photo capture
   - raw camera/audio
   - always-on voice
   - background voice
   - always-on reminders

## Phase 3+ MVP Target

- AI Coach prompt card.
- Today quick action card.
- Orbit summary card.

## Explicitly Deferred

- Proof photo capture.
- Raw camera/audio access.
- Always-on voice.
- Production mobile integration.

## Required App Architecture Changes

- Move from pure managed Expo runtime to prebuild/EAS dev-client for native integration.
- Add a config plugin for Meta SDK Gradle dependencies and Android manifest permissions.
- Add native module bridge and JS wrapper.
- Add a feature flag so production users do not see unsupported glasses UI.
- Add privacy copy and capture constraints before proof flows.

## Risks

- SDK access may be gated, preview-only, or subject to review.
- Exact camera/audio access may be unavailable to third-party apps.
- Ray-Ban Meta non-display models may not support in-lens UI.
- Proof capture has high privacy and policy risk.
- Expo OTA updates cannot update native SDK code; native releases are required.
- Hardware testing is mandatory because emulator-only validation cannot prove device behavior.

## Prototype Files

See `prototypes/meta-glasses/`.
