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

The MVP stores an existing OurOrbit bearer token in watch-local `SharedPreferences`.

This avoids a separate account system. A polished phone-to-watch pairing flow should use the Wear OS Data Layer in a future native mobile build.

## Backend Dependency

The app expects:

```text
GET /api/watch/summary
```

Completion actions reuse existing endpoints returned in the summary payload.

## Build

Open `wear-os/` in Android Studio, then run the `app` configuration on a Wear OS emulator or device.

Command-line build, if Android Gradle tooling is installed:

```sh
cd wear-os
gradle :app:assembleDebug
```

If you prefer a pinned wrapper, generate one from Android Studio or run `gradle wrapper` in this folder.

## Known Limitations

- No automatic mobile-session handoff yet.
- No proof photo/text submission on watch.
- No full project creation/editing.
- No watch push notification channel yet; notifications are shown from API refresh.
- Deep-linking to the phone is represented as a prompt for MVP.
