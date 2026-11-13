# Cycle Tracker App
**Track your Period FOR FREE**

A free, private and medically grounded menstrual cycle tracker for Android (Expo / React Native).
Everything is stored only on the phone: no accounts, no ads, no servers.

> CycleTracker provides informational estimates. It is **not** a contraceptive method and does not replace a healthcare professional.

## ✨ Features
- **Welcome & setup (first launch only):** onboarding slides with privacy and medical disclaimer, initial cycle setup with a live preview, and notification opt-in.
- **Cycle screen:** animated ring with the phases (elapsed days solid, upcoming faded), fertile window, ovulation and today's marker; next period, fertility today, phase information (hormones, symptoms, tips), upcoming events, today's log and cycle statistics (average, regularity).
- **Late period (hybrid mode):** the cycle advances automatically, and a card asks whether the period came on time, was late (pick the days) or hasn't arrived yet (delay counter with guidance). Automatic cycles never count for averages.
- **Calendar:** previous, current and predicted cycles with colors (period, predicted period, fertile window, ovulation, logged days), day details and quick actions.
- **Daily log:** flow, symptoms, mood, basal body temperature, cervical mucus, LH test, sexual activity, medications and notes.
- **Period history:** add, edit (date and bleeding days) and delete recorded periods.
- **Local notifications:** upcoming period, fertile window/ovulation, phase changes and late period; each one can be toggled and configured (days in advance / days late) plus the alert time.
- **Light/dark theme** (light by default, in-app prompt to follow the system), **Spanish/English** (follows the device, selectable in Settings), °C/°F.

## 🩺 Prediction model
| Concept | Rule | Source |
| --- | --- | --- |
| Cycle day 1 | First day of bleeding (spotting doesn't count) | ACOG |
| Ovulation | Next period − luteal phase (14 days by default, adjustable 10–16) | Clinical standard; luteal phase is the most stable part of the cycle |
| Fertile window | 5 days before ovulation → 1 day after | Wilcox et al., NEJM 1995 |
| Peak fertility | 2 days before ovulation + ovulation day | Wilcox 1995 / Dunson 2002 |
| Cycle length | Average of the last 6 valid recorded cycles (≥ 2), otherwise the declared value | — |
| Period length | Average of recorded bleeding days (explicit or from logged flow), otherwise the declared value | — |
| Regularity | Shortest vs longest cycle varies ≤ 7 days | FIGO 2018 |
| Clinical warnings | Cycles < 24 or > 38 days, bleeding > 8 days, 90 days without a period | FIGO 2018 |
| Fertility signs | Positive LH test → ovulation the next day. BBT "3 over 6" shift → ovulation the day before the rise. The current cycle is re-predicted, and the measured luteal phase is suggested in Settings | — |

## 🛠️ Tech Stack
- Expo SDK 54, React Native 0.81, TypeScript (strict)
- Expo Router (file-based navigation, `src/app`)
- React Native Paper (Material 3) + `react-native-svg` (custom cycle ring)
- `react-native-calendars`, `date-fns`
- Context API + AsyncStorage (versioned and validated persistence)
- `expo-notifications` (local scheduled notifications), `expo-localization`
- Jest (`jest-expo`) for the cycle engine

## 📁 Structure
```
src/
  app/            Routes (thin wrappers): onboarding/, dashboard/ (tabs), log/[date], history
  screens/        Screen components
  components/     cycle/ (ring, cards), calendar/, log/, forms/, ui/, notifications/
  contexts/       CycleContext (cycle data + derived status), PreferencesContext
  lib/cycle/      Pure prediction engine: layout, stats, signs, timeline, actions, validation
  lib/            dates (timezone-safe ISO dates), notificationPlan
  services/       storage (AsyncStorage + schema), notifications (expo-notifications)
  i18n/           es / en dictionaries
  theme/          Material 3 light/dark themes and phase colors
```

## ▶️ Run the project
```bash
npm install
npx expo start -c --tunnel
```
(Scan the QR with the App "Expo Go")

```bash
npm test          # unit tests (cycle engine, persistence, notifications plan, i18n)
npm run typecheck # TypeScript
```

> Local notifications work in Expo Go on Android. Remote push notifications are not used.
> For a production build (or to remove Expo Go limitations) use a development build / EAS Build.

## Future potential big implementations
- Better cycle prediction using Machine Learning Models.
- Detection and prediction of menstrual irregularities using ML.
- Irregular-cycle mode (prediction ranges instead of single dates); the period history is already stored for it.
- Data export/backup.
