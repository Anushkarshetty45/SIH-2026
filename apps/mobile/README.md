# CareGrid Mobile Application (React Native Android)

The official CareGrid Rural Healthcare Connectivity Platform mobile application, built with React Native 0.75 and TypeScript, optimized for low-bandwidth 2G environments, offline-first mutations, and role-based rural healthcare delivery.

---

## 📱 Supported User Roles & Flows

| Role | Flow Name | Primary Capabilities |
|---|---|---|
| **ASHA Worker / PHC Staff** | `AshaFlow` | Create patient referrals, check real-time facility bed counts, book OPD appointments, trigger emergency 108 dispatches |
| **Doctor / Clinician** | `DoctorFlow` | Triage & approve incoming referrals (30-minute SLA), manage daily OPD schedule, inspect hospital ward beds, search medicine catalog |
| **Ambulance Operator** | `AmbulanceFlow` | Active emergency runs with live telemetry, locate nearest facilities with available ICU/ventilators, update transport status |
| **Facility Administrator** | `FacilityAdminFlow` | Manage facility bed occupancy, medical equipment operational status, pharmacy inventory intake & stock adjustments, handle freshness escalations |
| **District Health Admin** | `DistrictAdminFlow` | Monitor all district healthcare facilities, track overdue freshness SLA breaches (Tier 2), manage district-level alerts |

---

## 🏗️ Architecture & Technology Stack

- **Framework**: React Native `0.75.4` (Fabric / TurboModules ready, Hermes JS Engine enabled)
- **Language**: TypeScript `5.7` with CommonJS & Node resolution
- **Navigation**: React Navigation `v6` (`@react-navigation/native` & `@react-navigation/native-stack`)
- **Offline Storage**: `@react-native-async-storage/async-storage` with in-memory sync cache
- **Network State**: `@react-native-community/netinfo` with auto-sync retry on reconnect
- **UI Primitives**: High-contrast, accessible React Native primitives (`View`, `Text`, `TouchableOpacity`, `ScrollView`, `Modal`)
- **Design System**: Minimum 48px touch targets, color-blind friendly badges (never color-only), high contrast tokens
- **Internationalization**: Full localization in Marathi (`mr`), Hindi (`hi`), and English (`en`) via `i18next`

---

## 🚀 Getting Started & Local Development

### Prerequisites
1. **Node.js**: `v20+`
2. **pnpm**: `v9+`
3. **Java Development Kit (JDK)**: JDK 17 (recommended for Gradle 8.8)
4. **Android SDK / Android Studio**:
   - `Android SDK Platform 34`
   - `Android SDK Build-Tools 34.0.0`
   - `Android NDK 26.1.10909125`
   - Set environment variables `ANDROID_HOME` and `JAVA_HOME`.

### Install Dependencies
From the repository root:
```bash
pnpm install
```

### Starting the Metro Bundler
Start the Metro dev server configured for monorepo symbol resolution:
```bash
pnpm --filter @rhcp/mobile start
```
Or from inside `apps/mobile`:
```bash
cd apps/mobile
pnpm start
```

### Running on Android Emulator
Make sure an Android Virtual Device (AVD) is running:
```bash
pnpm --filter @rhcp/mobile android
```

### Running on a Physical Android Device
1. Connect device via USB with **USB Debugging** enabled.
2. Ensure your computer and device are on the same Wi-Fi network.
3. Update `apps/mobile/src/api/config.ts` with your computer's local LAN IP:
   ```ts
   // In dev environment:
   setBaseURL('http://192.168.1.X:3000/api/v1');
   ```
4. Reverse TCP port for Metro:
   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:3000 tcp:3000
   ```
5. Launch the app:
   ```bash
   pnpm --filter @rhcp/mobile android
   ```

### Building the Android APK
To build a standalone debug APK without starting the React Native CLI runner:
```bash
cd apps/mobile/android
./gradlew assembleDebug      # Linux / macOS
gradlew.bat assembleDebug    # Windows
```
The output APK will be generated at:
`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚡ Offline & 2G Network Resilience

- **Stale Data Warnings**: Bed, equipment, and stock data are flagged with elapsed time. If data is older than 120 minutes (2 hours per SRS), a prominent warning instructs field workers to confirm verbally prior to emergency transport.
- **Offline Mutation Queue**: Patient referrals, bed updates, inventory adjustments, and appointments are stored locally in the mutation queue and automatically re-transmitted upon reconnection.
- **2G Throttling Mode**: Extended timeouts (20s) and lightweight JSON payloads allow full operation even on edge cellular links.

---

## 🧪 Testing & Verification

```bash
# Typecheck TypeScript source
pnpm --filter @rhcp/mobile typecheck

# Run unit tests
pnpm --filter @rhcp/mobile test
```
