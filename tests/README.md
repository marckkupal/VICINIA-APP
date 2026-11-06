# Composer verification
Runs the real `postTargets`, `persist`, `boardPosts` and `data` modules with only AsyncStorage stubbed (file-backed, so a second process acts like an app restart).

    export NODE_PATH=$PWD/tests/stubs:$(npm root -g)
    rm -f /tmp/verify-store.json
    npx tsx tests/verify.tsx write && npx tsx tests/verify.tsx read && VERIFY_FAIL_WRITES=1 npx tsx tests/verify.tsx fail

Needs `tsx`, `react`, `react-dom` (dev only). Covers: "+" default per route, validation (Explore location, board_id), persistence across restart, per-destination feeds, double submit, failed-save rollback. Screen rendering itself (taps, layout) is not covered: test that on a device.

# Explore map verification
Three suites. Use a clean store for the ones that save posts (`rm -f` it first), because the AsyncStorage stub keeps data between runs.

    export NODE_PATH=$PWD/tests/stubs:$(npm root -g)

**1. Logic: `geo.test.ts`.** Coordinate maths (haversine against known values), bounding-box edges, swapped/NaN/missing coordinates, unverified and multi-campus cases, selection and list/map rules, responsive sizing rules, and location tagging on post creation (including reading the saved post back).

    rm -f /tmp/geo-store.json && VERIFY_STORE=/tmp/geo-store.json npx tsx tests/geo.test.ts

**2. Screen: `render.test.tsx`.** Renders the real `ExploreMap` screen with `react-native-web` + jsdom (maps and svg are stubbed in `tests/stubs`). Covers the unverified-campus fallback, which places get markers, marker tap / deselect / switch / close, the popup content and post snippet, search dropping a stale selection, the Map/List toggle, "show on map", the never-empty list fallback, and phone / small phone / tablet sizes. Needs a scratch folder with the render stack, listed first on `NODE_PATH`:

    mkdir /tmp/rnw && cd /tmp/rnw && npm i react-native-web@0.21 jsdom react@19 react-dom@19
    export NODE_PATH=/tmp/rnw/node_modules:$PWD/tests/stubs:$(npm root -g)
    npx tsx tests/render.test.tsx

**3. Composer regression: `verify.tsx`** (unchanged, see above).

Not covered: real map tiles, real finger gestures, and native rendering on a device. react-native-web approximates layout, so check spacing and tap feel on an iPhone and an Android phone.

# Profile and settings verification
`profile.test.ts` runs the real `auth.ts`, `settings.ts` and `profileRules.ts` against a fake Firebase (fetch is stubbed): bearer token on every call, updateMask-only writes, photo set/keep/remove, failed save and failed load, toggle revert, one save at a time, location kept on the device, and the form validation rules. Screen rendering is not covered: check Edit Profile and the two settings screens on a device.

    export NODE_PATH=$PWD/tests/stubs:$(npm root -g)
    rm -f /tmp/profile-store.json && VERIFY_STORE=/tmp/profile-store.json npx tsx tests/profile.test.ts

# Profile and settings end to end
Each phase is a separate process (an app restart) against `fakeFirebase.ts`, a stateful stand-in for the Firebase REST calls (tokens, own-document rules, updateMask, injectable failures, state kept in a file). Two AsyncStorage files act as two phones.

    bash tests/e2e.sh

Phases: `session1` (edit + toggles, verified on the backend), `session2` (restart + reload + another device's change), `offline` (network drops), `deviceB` (second phone), `otherAccount`, `errors` (bad inputs, network/401/403/500, write accepted but not stored, revoked session, cross-user access, no optimistic state).

# Events verification
`events.test.ts` runs the real `eventModel`, `eventsApi`, `eventsStore`, `eventsView` and `auth` against a fake Firestore (fetch is stubbed): document mapping and neutral fallbacks, load / empty / error / stale feed states, retry, timeout, posting (including a write that was not stored), and the filter and page-state logic.

    export NODE_PATH=$PWD/tests/stubs:$(npm root -g)
    npx tsx tests/events.test.ts
    npx tsx tests/eventLayout.test.ts

Not covered: screen rendering and touch behaviour on a device. Check those by hand (list in `CHANGES.md`, "Events: real data").
