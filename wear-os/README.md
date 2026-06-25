# OurOrbit Wear OS MVP

This is a lightweight native Android/Wear OS companion app for quick OurOrbit actions.

## Scope

- Today summary
- Habits, including weekly target progress
- Tasks
- Assigned project subtasks
- Notifications with mark-read
- Orbit summary with health, level, milestone, and recent activity
- Immediate completion for simple items
- "Open on phone" messaging for proof/approval-required items

## Authentication

The MVP uses a short-lived pairing code from the mobile app:

1. Open OurOrbit on the phone.
2. Go to Settings -> Wear OS Pairing.
3. Tap Generate Pairing Code.
4. Open OurOrbit on the watch and enter the code.

The watch exchanges the code for an OurOrbit access token and stores that token encrypted with Android Keystore-backed local storage. Raw bearer tokens are not shown in the UI.

## Backend Dependency

The app expects:

```text
POST /api/watch/pairing/code
POST /api/watch/pairing/exchange
GET /api/watch/summary
```

Completion actions reuse existing endpoints returned in the summary payload.

## Build

Open `wear-os/` in Android Studio, then run the `app` configuration on a Wear OS emulator or device.

Command-line build:

```sh
cd wear-os
./gradlew :app:assembleDebug
```

If you prefer a pinned wrapper, generate one from Android Studio or run `gradle wrapper` in this folder.

## Known Limitations

- Pairing is manual code entry; no automatic Data Layer handoff yet.
- No proof photo/text submission on watch.
- No full project creation/editing.
- No watch push notification channel yet; notifications are shown from API refresh.
- Deep-linking to the phone is represented as a prompt for MVP.
