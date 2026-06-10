# Habiflow Mobile

The Habiflow mobile app is an Expo React Native app for iOS and Android. It renders the habit dashboard, create/edit flows, settings, history, local reminders, and printable PDF export.

## Tech Stack

- Expo 52
- React Native
- TypeScript
- AsyncStorage
- Expo Notifications
- Expo Print
- Expo Sharing
- Vitest

## Project Structure

```txt
src/
  domain/          Shared mobile types
  application/     Presentation helpers such as date ranges and habit labels
  infrastructure/  API client, device ID storage, settings storage, notifications, PDF export
  presentation/    Screens, components, and theme
App.tsx            App shell and lightweight screen router
```

The mobile app keeps business logic light. Habit state and streak rules live in the backend; the app focuses on UI, device-local settings, notifications, and PDF sharing.

## Getting Started

Start the backend first:

```sh
docker compose up --build -d
```

Then start Expo:

```sh
pnpm dev:mobile
```

The default API URL is:

```txt
http://127.0.0.1:3001
```

Override it when needed:

```sh
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001 pnpm dev:mobile
```

Use a LAN IP when testing on a physical phone, because `localhost` on the phone points to the phone itself.

## Screens

- **Dashboard:** shows `My Habits`, recent completion indicators, streaks, and the `+` create button.
- **Create/Edit Habit:** captures optional emoji, name, one of 21 preset colors, streak goal, completions per day, and reminder count/times. Habit indicators are always round.
- **History:** displays recent completion history by habit.
- **Settings:** toggles theme and dashboard day range.
- **Export PDF:** generates a printable monthly habit tracker.

## Main Mobile Flows

- **First launch:** app creates or loads an anonymous `deviceId` from AsyncStorage.
- **Dashboard load:** app requests active habits from the backend for the selected date range.
- **Toggle completion:** tapping today’s habit indicator calls the API and updates the row.
- **Create/edit:** form submits habit data to the API; if reminder count is greater than zero, the app requests notification permission and schedules each chosen time.
- **Theme settings:** user can choose system, light, or dark mode.
- **PDF export:** app creates a local printable PDF and opens the native share sheet.

## Commands

```sh
pnpm --filter @habiflow/mobile start
pnpm --filter @habiflow/mobile ios
pnpm --filter @habiflow/mobile android
pnpm --filter @habiflow/mobile test
pnpm --filter @habiflow/mobile exec tsc --noEmit
```

## Testing

```sh
pnpm --filter @habiflow/mobile test
```

Current tests cover mobile presenter helpers, including recent-day range limiting, completion display logic, and streak goal labels.
