# First changes (requested list)

## 1. Start-up
- Copy targeted to TIP only. "Quezon City and Manila" wording removed (Onboarding, Welcome, first slide).

## 2. Splash Screen
- TIPM / Manila references removed.
- Graphics aligned more with the theme: OPTIONAL, not done yet.
- Explore Nearby parameters defined in `data.ts` (`EXPLORE_SCOPE`, `inExploreScope`):
  TIP-QC campus and immediate surroundings only, max 1 km. Places farther away are hidden.

## 3. Sign-up Page
- Validation errors for invalid name, email, program and year.
- University text field removed (campus is fixed to TIP Q.C.).
- Year now includes 5th year and Irregular (`YEARS` in `data.ts`).
- School email only: `@tip.edu.ph` (`isSchoolEmail` in `utils.ts`).
- One account per email: checked on details step and again on the password step.
- Name rejects numbers and invalid characters (`isValidName` in `utils.ts`).

## 4. Home Page > Guidance Office
- Mini-test: none found in this source, nothing to remove.
- Request an appointment: booking form removed, replaced by a 4-step how-to (`appointmentSteps` in `data.ts`).
  Steps are sample text. Confirm the real process with the office.
- Complicated services list removed. Page now shows the how-to steps, three events and the contact button.
- The page shows three events organized by the office (`host: 'guidance'` in `EVENTS`). Tapping any of them (or "See all") switches the bottom bar to the Events tab (full events list). This uses `goToTab()` in the new `navigation.ts`; `TabBar` listens for it, so the main app file needs no change. The separate "Guidance Events" page was removed.
- "When to get urgent help", the 911 card and "Need urgent support?" removed.
  Replaced by a single "Contact the Office" button (opens the private message form).
