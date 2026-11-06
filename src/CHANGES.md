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

## Forgot password: deep link + success screen
- `RecoveryFlow` no longer listens for the link itself. `App.tsx` catches `vicinia://reset-password?...` at the root (cold start or any screen) and passes it down as `link` / `onLinkHandled`.
- Reset step is titled "Change Password" with a "Save" button.
- Success screen: "Return to Login" button sits directly under the checkmark and message.
- Email wording on the forgot screen uses `@tip.edu.ph` (placeholder and error example).
- Needs the matching root `App.tsx` (replaces the one in the project root).

## Google sign-in
- New: `googleConfig.ts` (paste the Web client ID), `googleAuth.ts` (Google SDK wrapper), `components/GoogleButton.tsx` ("or" divider + Continue with Google).
- `auth.ts`: `signInWithGoogleToken` swaps the Google ID token for a Firebase session through the REST `signInWithIdp` call, creates the Firestore profile on first use, and applies the same email rule as sign-up (school email or Gmail).
- Button added to the Log In screen and the first Sign Up step.
- Needs: `npm install @react-native-google-signin/google-signin`, `cd ios && pod install`, Google turned on in Firebase → Authentication → Sign-in method, and the reversed client ID added as a URL type in Xcode.
- Google sign-in now uses the Google account's profile picture as the avatar (`avatarUri`) each time the person logs in with Google.

## Real map (OpenStreetMap)
- New `components/OsmMap.tsx`: `react-native-maps` with OpenStreetMap tiles (`UrlTile`), a campus marker, tappable place markers and the required "© OpenStreetMap contributors" label (taps open the OSM copyright page).
- `screens/ExploreMap.tsx`: the drawn illustrative map is replaced by `OsmMap`. Search, category filters, marker selection and the details card work as before.
- `data.ts`: `Place` has a new optional `coord: { lat, lng }`, and `CAMPUS_COORD` holds the campus centre. The four sample places have approximate coordinates. Check them on openstreetmap.org and adjust.
- Places without a valid `coord` stay in the list but get no pin. A note under the map says how many.
- The Directions page (`PlaceDetails.tsx`) still uses the illustrative drawing.
- Needs: `npm install react-native-maps`, `cd ios && pod install`, then a rebuild (`npx react-native run-ios --simulator "iPhone 17"`). Reloading is not enough for a native library.
- Before a wide release, change `TILE_URL` in `OsmMap.tsx` to a tile provider, since OSM's own tile server limits heavy use.
- `GoogleButton.tsx`: in development builds the Google error also shows the SDK's own message (and logs it in Metro), to help diagnose setup problems.

## Home search
- Tapping a result now works on the first tap even with the keyboard open (`keyboardShouldPersistTaps="handled"`), and the keyboard closes as the page opens.
- Results also include campus members (opens their profile), and app pages (Explore, Boards, Events, My profile, Notifications). Offices also match words like "health", "books" and "counseling".
- Matching: every typed word must match. Results that start with what you typed come first, then matches inside a name, then matches in the details.
- The result cards look exactly the same as before.
- Search results now open in their own tab: an event opens in Events (that event's details), a place opens in Explore (that place's details), a board opens in Boards. The matching tab is highlighted, and the Home search box is cleared. Members, offices (Library, Clinic, OSA, Guidance) and Notifications have no tab of their own, so they still open from Home.
- New in `navigation.ts`: `openInTab(tab, target)` and `useTabTarget(tab, handler)`. Events, Explore and Boards use `useTabTarget`. The copies embedded inside Profile ignore these requests.
- Post cards: photos now sit inside the coloured card (under the tag, above the title) instead of above it. The card grows to fit them. Posts without photos look the same as before.

## Saved on this device
- Posts from Home, Explore, Events and Boards are saved and still there after the app is closed (per account; board posts are shared on the device). Joined boards, event registrations, saved places and chat messages you send are saved too. Posted businesses and OSA/Guidance requests were already saved.
- New `persist.ts` with the shared saving helpers (`createPersistedList`, `loadJSON`, `saveJSON`).
- Photos are now picked at up to 1080 px and stored inside the saved post as data links, because the picker's temporary files are deleted by iOS. Videos are not saved (their temporary file does not last), so a video post shows its placeholder after a restart.
- Not saved yet: notification read state and likes/comments on cards. Everything is stored on this phone only. For posts visible to other students, move these stores to Firebase (Firestore for posts, Storage for photos).

## Events page: only events
- The "+" on the Events page now opens **Post an event** (`screens/PostEvent.tsx`) instead of a general post pop-up. Fields: event name, category, date, time, venue, optional fee and about. The date is checked (real date, not in the past) and the time must look like `2:00 PM`.
- Posted events are saved on this device (`userEvents.ts`), listed on the Events page in date order, open the same details page and can be registered for. Home search finds them too (`useAllEvents`).
- The "Your posts" list on the Events page is gone. Earlier general posts made there are no longer shown.

## Wordmark
- The text wordmark now reads "Vicinia" on the Welcome screen and the two Onboarding screens (it was lowercase). The animated splash screen is an image (`assets/vicinia-logo.png`), so any lowercase lettering drawn inside that image has to be changed in the image itself.
- Post cards: the Like / Comment / Share buttons are now equal width with their content centered, so "Comment" no longer touches the edge of its button.
- Forgot password: only `@tip.edu.ph` and `@gmail.com` addresses are accepted (same rule as sign-up), with a matching error message, placeholder and helper text.

## Like / comment icons
- `LineIcon`: heart and comment are now real SVG icons (`react-native-svg`) instead of a text glyph and a stack of Views, so they render crisp and the same on every device. New `filled` prop paints them solid for the active state.
- Home post cards: the heart and comment counts on the coloured tile are now tappable. The heart likes/unlikes; the comment count opens the comments right there. The Like / Comment buttons fill their icon when active.
- Board posts: same icons, filled when liked / when the replies are open.

## Events page redesign + Org Fair 2026
- **Events list** (`screens/EventsScreen.tsx`): "Campus events" header with a black + (post an event) and a yellow calendar button (jumps to today). Week strip (Mon–Sun, ‹ › to change week, dot under days that have events), filter chips (For you, Today, This week, Free), a dark featured card, and a "Coming up" list. The strip opens on the featured event's date (Org Fair, Oct 8); tapping a day lists events from that day on. Profile › My events and the office pages keep a simple list but use the same new rows.
- **Event rows / featured card**: new `components/EventCard.tsx` (emoji date tile, REGISTERED badge, purple "Category · Free/₱fee" line).
- **Event details** (`screens/EventDetails.tsx`): photo hero with back, + (register) and share buttons, status pill (shows "Registered" once registered), date and place rows, about text, "Organized by" card with verified badge, "students are going" row, and a dark "You're registered" button. The fee card still shows for paid events. Events opened from Home search now know whether you are registered.
- **Data** (`data.ts`): `CampusEvent` has new optional fields `endTime`, `address`, `organizer`, `going`, `featured` and `image`. New sample event **Org Fair 2026**.
- **Hero photo**: set `image: { uri: 'https://…' }` (or `require('./assets/orgfair.jpg')`) on an event. Without one, the hero shows the event's colour and emoji.
- New icons in `OfficeIcon`: `share`, `checkCircle`, `badgeCheck`.

## Boards: upvote / downvote
- Board posts no longer have a heart / "Like" button. They have an up arrow, the score, and a down arrow in one pill (`screens/BoardDetail.tsx`). The up arrow turns orange and the pill yellow when upvoted; the down arrow turns blue when downvoted. Tapping the active arrow takes the vote back; tapping the other arrow switches it. The score is the post's votes ±1.
- Votes are saved per account (`postActivity.ts`: new `vote` / `castVote`; older saved data still loads). Likes are kept for the Home post cards.
- `LineIcon`: new `arrowUp` / `arrowDown` icons (support `filled`).

## Keyboard avoidance (all screens)
- New `components/KeyboardAware.tsx`. `KeyboardScroll` is a ScrollView that scrolls the focused field into view (iOS keyboard inset), lets taps through while the keyboard is open, and closes the keyboard when you drag the list. `KeyboardScreen` shortens the page by the keyboard height so pinned footers (Save, Submit, chat box) ride up above the keyboard and drop back when it closes.
- `LibPage` now uses both, which covers every form built on it: Post an event, Post a business, the Library / OSA / Guidance requests and messages, and Privacy settings. Also applied to Edit profile, Home (comment boxes), Boards and board posts (reply boxes) and Explore. Login, Sign up, Forgot password, Chat and Create post already had keyboard avoidance and are unchanged.
- Android needs `android:windowSoftInputMode="adjustResize"` on the main activity in `AndroidManifest.xml` (React Native's default template has it; check yours, it is outside `src`).

## Comments: independent scrolling
- New `components/CommentsPanel.tsx`, used for Home post comments and board post replies. The list scrolls inside its own box (about 40% of the screen, 180 to 340 px), so the page behind stays still. The "Comments · N" header (with Hide) and the write box stay fixed outside the list.
- A swipe that starts inside the list scrolls the list; it only moves the page when it starts outside it (`nestedScrollEnabled` for Android).
- Posting a comment scrolls the list down to it. The old "View 10 more" button is gone, since every comment is now reachable by scrolling.

## Explore: report a listing, remove your business
- **Report** (anyone, on any place or business): a "···" button next to the bookmark on the place page, plus a "Report this listing" link at the bottom. It asks for a type: Wrong or misleading information, Spam or advertising, Scam or unsafe, Closed or doesn't exist, Something else. After sending, a thank-you pop-up appears and the link changes to "You reported this listing", so the same account can't report it twice. Reports are saved on this device only (`reports.ts`, demo). For real moderation, write them to Firestore and let staff review them.
- **Remove business** (only the person who posted it, matched by `ownerEmail`): a "Remove business" option in the "···" menu and a red "Your listing" button on the page. A confirmation pop-up comes first. Removing takes it off Explore (uses the existing `removeBusiness` in `businesses.ts`), returns to the list and shows a message. Owners don't see the Report option on their own listing.
- `PlaceDetails` has new props `viewerEmail` and `onRemoved`. Explore and Home pass them.
- Listings posted before this change keep their `ownerEmail` if they had one. Any posted while signed out (no email) can't be removed from the app.

## Business feature removed
- Removed: the "Own a business nearby?" card on Explore, "Post your business" in the Explore + menu, the Post your business screen (`screens/PostBusiness.tsx`), the business store (`businesses.ts`), business info and "Remove business" on the place page, and the business fields on `Place` (`data.ts`). Home search and Explore now only use the built-in places.
- This replaces the earlier "Remove business" and business-listing notes in this file; ignore those.
- Kept: **Report this listing** on every place page ("···" menu and the link at the bottom), since it works for any place.
- Businesses already posted on a device stay in that device's storage under `vicinia_businesses` but are no longer read or shown. Reinstalling the app clears them.

## Report a post: choose a reason
- Home post cards: **Report** (post "⋮" menu) now opens a second menu, "Why are you reporting this post?": Spam or advertising, Harassment or bullying, Hate or inappropriate content, False or misleading information, Something else. After choosing, a thank-you message shows the reason, and the menu item changes to "Reported" so the same account can't report a post twice.
- `reports.ts` is now shared by posts and places (`reportItem(id, reason, email)`; posts use the id `post:<id>`, places use the place id). Reasons are in `POST_REPORT_REASONS` and `REPORT_REASONS`. Still saved on this device only (demo).
- Board posts already asked for a reason and are unchanged.

## Profile picture viewer
- Tap your profile photo on the Profile page to see it full screen (`components/PhotoViewer.tsx`): black background, photo fitted to the screen, your name underneath, ✕ button (or tap outside the photo, or Android back) to close. On iOS you can pinch to zoom up to 4x and drag to look around.
- `Avatar` has a new `viewable` prop; the Profile page turns it on. If there is no photo (initials circle) nothing opens. Add `viewable` to any other `<Avatar>` to get the same behaviour there.

## Settings are remembered (state persistence)
- The toggles under Notifications (Board replies, Event reminders, Campus recommendations) and Privacy & safety (Show campus on profile, Personalized suggestions, Location sharing) were kept in temporary screen state and reset every time you left the screen. They are now saved per account on the device (`settings.ts`, same pattern as `membership.ts`), so they stay as you left them after leaving the screen, restarting the app, or switching accounts and back.
- Old or damaged saved data falls back to the defaults. The "not saved" notes on both screens now say the choices are saved on this device.
- The toggles only store your choice. They don't yet change which notifications appear or what other students see; that needs the real notification and profile-visibility logic.

## First-time walkthrough (coach marks)
- New `tour.ts` (steps, state, per-account completion saved under `vicinia_tour` with `loadJSON`/`saveJSON`) and `components/TourOverlay.tsx` (spotlight + tooltip in a `Modal`; no new dependencies).
- 4 steps: bottom navigation, Boards (communities), Events (discovery), + (create a post). Skip on steps 1–3, Done on the last; both mark it completed so it never prompts again for that account.
- Starts automatically from `HomeScreen` (`maybeStartTour`), once per account. The overlay is mounted inside `TabBar`, so the main app file needs no change.
- Replay: Profile → Settings → "Replay app tour", and "Replay app tour" row in Help center (`HelpCenterScreen` now takes an optional `email`).
- Accessibility: modal focus, header role, step announced to screen readers, 44pt buttons, Android back button skips.
- To add a step, add an entry to `TOUR_STEPS` and register its element with `setTarget(id, ref)`.

## Usability, feedback, header (Option B), onboarding persistence
- **Header (Option B)**: logo graphic removed from Home (`AppLogo.tsx` kept, unused here). Layout: profile photo top-left, "Vicinia" wordmark (one line, shrinks to fit), quick add "+" and notifications bell top-right. Profile, + and bell are all 44x44 (`styles.ts`: `homeAvatarBtn`, `plusBtn`, `bellBtn`) with accessibility roles/labels. Nothing removed: profile, notifications (with unread dot) and quick add all still work. The tour's `quickadd` target is unchanged.
- **Empty states**: new `components/EmptyState.tsx` (icon, title, one line of help, optional 44pt action). Used for Home search (Clear search), Saved places (Explore places), Events "no events" and "no registered events" (Browse events).
- **Feedback**: `PrimaryButton` has `busy` (inline spinner, ignores taps) and `disabled`; used on Log In, Sign Up (verify, create), Forgot password (send, save). `useToast()` now also has `error(msg)` (red banner, 4 s) next to `show(msg)`.
- **Onboarding remembered**: new `onboarding.ts` (`hasSeenOnboarding`, `markOnboardingSeen`, `useOnboardingSeen`). `Onboarding` saves on Skip and on the last slide. **Needs `App.tsx`**: skip `<Onboarding />` when `useOnboardingSeen()` is true (wait while it is `null`).

# Phase 02: Create Board + board cards

## Create a board
- New `screens/CreateBoard.tsx`: Board name, Description, Category (chips) and a live preview card. Opened from the new **Create a board** row on the Boards page (under the search box) and from the "No boards match your search" empty state (the typed search text pre-fills the name). Not shown inside Profile > My boards.
- Validation (`boardRules.ts`, used by the form and again inside the store): name 3 to 40 characters, letters/numbers/spaces and `& ' . , ! - _`; description 10 to 200 characters; a category is required. Errors show after the first submit attempt and update as each field is fixed.
- Submit: `PrimaryButton` shows a spinner and ignores taps while saving, plus a ref lock so a double tap in the same instant cannot send twice. Failures show a red toast: not logged in, invalid, duplicate name (also marks the name field), storage failure.
- Duplicate names are refused (case, spacing and punctuation ignored), against built-in boards and their short labels too.
- Authorization: you must be signed in (login already requires a verified email). `createBoard` re-checks this and throws if there is no user.
- On success: board saved, creator joined automatically (new `joinBoard` in `membership.ts`), back to the Campus boards list with search and "joined only" filters cleared, new board at the top, success toast.
- Entity: a new board is a `Board` (top-level community) stored in `userBoards.ts`, separate from `boardPosts.ts`. Posts made inside a board are untouched. `Board` in `types.ts` gained optional `category`, `description`, `createdBy`, `createdByName`, `createdAt`.
- Where boards are listed or opened, `BOARDS` was replaced by `useAllBoards()` (built-in plus created): Boards page, Home search and Home board route, and the "Post to which board?" picker in `CreatePost`. Board page (`BoardDetail`) shows the creator's description, creator as Admin, "Created by", and an empty-feed message that fits a new board.
- Storage: on this device (AsyncStorage), like posts and events. There is no network route for boards in this project, so none was added. To share boards between students, replace the save step inside `createBoard` (`userBoards.ts`) with a Firestore write to a `boards` collection and add rules; the screens do not change.

## Board presentation
- New `components/BoardCard.tsx` (`BoardCard`, `BoardBadge`, `BoardTag`): full-width card with a round identity badge, name, category tag, two-line description, and members / online / new posts. Joined boards show a "✓ Joined" pill.
- New `boardCategories.ts`: one table gives every category an icon, tint and accent color. Built-in boards map through their existing `label`. Badges and tags come only from the category, so there is no photo or random placeholder.
- The hero card and the Members tab use the same badge. Member counts include you when you joined, matching the board page.
- Search on the Boards page and on Home also matches category and description.
- Existing paths unchanged: tap a card to open the board, Join/Leave on the board page, the "+" in the header and inside a board still start a post (header button relabeled "Create a post in a board").

## Phase 02 (cont.): TIP starter boards
- Three starter boards added in `data.ts` (with details in `boardData.ts`, categories TIP Community / Student Orgs / College Events in `boardCategories.ts`):
  - "Technological Institute of the Philippines" (shown as T.I.P. Quezon City): only states the campus address, 938 Aurora Boulevard, Cubao.
  - "Recognized Student Organizations" `[Sample]` and "CCS Days" `[Sample Event]`: no dates, officers, member counts or organization names. Cards show "Details not confirmed yet" instead of counts.
- Not confirmed from public sources: the list of recognized TIP QC organizations, and "CCS Days" at TIP (public listings name TIP's IT college "College of Information Technology Education"). Replace the two samples once the Office of Student Affairs / the college confirms names and dates.
- Sample boards never block a real board with the same name, and boards students created are never removed or reordered below them (created boards are listed first).

## Create flow: one composer, destination targeting
- **Home "+"** now opens the composer directly (no "Quick add" sheet). The sheet's Library and Notifications shortcuts were dropped: Library is a Home tile and Notifications is the bell.
- **One composer.** `screens/CreatePost.tsx` is the only post composer. `PostComposerModal` is deleted; Home, Explore, Boards and every board page open `CreatePost` with `initial={defaultDestination({ tab, boardId })}`. `PostSection` now only lists posts.
- **Destination audit** (see the header of `postTargets.ts`): Home = Post (`destination: 'home'`), Explore = Post (`destination: 'explore'` + required `location`), Board = `BoardPost` in its own collection partitioned by `board_id`. Events keep their own model and form (`PostEvent`), so they are not a destination.
- **Contextual default:** Home -> Home, Explore -> Explore, Boards tab -> Boards (featured board), inside a board -> that board. The person can change destination and board in the composer.
- **Boards:** board dropdown (all boards incl. student-created). **Explore:** location is required. Pick a place inside the 1 km Explore area (checked by listed distance and by coordinates against `CAMPUS_COORD`), or "Other location…" with a typed name (3-80 chars). Places outside the area are rejected.
- **Schema (minimal):** `Post` gains optional `destination`, `location`, `body`, `link`, `authorEmail`; `BoardPost` gains `boardId`, `authorEmail`. `PostCard` shows body, link and location. Old saved posts still load.
- **Safety:** all rules live in `postTargets.ts` (`validateDraft`, re-run inside `submitPost`). Login required. Posts stay per account. Double taps are ignored (ref lock + in-flight key); POST/Publish are disabled and read "Posting…" until saved; a failed save is rolled back (`createPersistedList.addAsync`) and can be retried. Videos are board-only (Home/Explore cards show photos).
- Needs no new packages. Swap the three `add*Async` calls in `submitPost` for Firestore writes when the backend is ready.

## Create flow: success handling and verification
- On success the composer clears every field (`resetComposer`), closes, and the caller toasts "Posted to …". The target feed updates by itself: Home, Explore and board pages read the same stores the composer writes to, the post is added before the disk write, and a failed write removes it again.
- Close (✕) and back still just dismiss. There was no post-draft saving before, and none was added.
- New: `load()` on persisted lists and `loadBoardPosts()` to read saved posts ahead of the first screen; `resolveBoard()` in `postTargets.ts` (board pre-selection, now testable).
- New `tests/` folder (see `tests/README.md`).

## Explore map and discovery fixes
**Root cause of off-campus pins.** The map had no coordinate gate. `OsmMap` drew whatever `coord` a place had, opened on a hard-coded `CAMPUS_COORD`, and the 1 km scope was measured from that same point. `CAMPUS_COORD` (14.6096, 121.0536) was never verified. Public references put the 20th Ave. / Aurora Blvd. area of Cubao near lat 14.618 to 14.623, so the centre was about 1 km south of it, and every sample `coord` was a hand-typed guess relative to that centre. Distances ("0.3 km") were typed strings, not computed.

**Data model (`geo.ts`, new, pure and tested).**
- `CAMPUSES` registry: each campus has `verified`, `center`, `bounds` (verified bounding box) and `maxKm`. Adding another campus is one more entry; nothing is hard-coded to one campus.
- `resolvePin` / `partitionPins`: a place is pinned only if its coord is a valid number pair, its campus is verified, and the point is inside the bounding box and within `maxKm` of the centre. Otherwise it is list-only. Swapped lat/lng is detected and reported but never auto-corrected.
- The map opens on the verified campus's own bounds (`startRegion`). No visual offsets.
- `data.ts`: `CAMPUS_COORD` removed. The four sample places lost their unverifiable `coord` values and the unused `map: {x,y}` field. `Place` gained optional `building` and `campusId`.
- `postTargets.ts`: `placeInScope` and `locationOf` use the same geofence, so a bad coordinate can no longer reach a saved post.

**Needs your input.** TIP-QC is registered with `verified: false`, because no authoritative campus coordinates were available and none were invented. Until `center`, `bounds` and `source` are filled in (steps are in `geo.ts`) and `verified` is set to `true`, the map shows a "Map pins aren't available yet" panel and every place stays in the list. Then add real `coord` values to places.

**Domain cleanup.** Removed the "Shops" category (`PlaceKind`, filter chip, search words, details copy), the `address` search field, and "anonymous to the owner" wording. Cafes and food stops stay, as student discovery.

**Markers and popup.** `exploreMarkers.ts`: each category has its own colour, shape (circle / rounded square / diamond) and icon, plus a legend above the map. Selecting a marker opens a card with category, title, building and distance from campus, status, a snippet of the latest Explore post tagged to that place, and the View details / Directions buttons.

**Tests.** `tests/geo.test.ts` (run with `npx tsx tests/geo.test.ts`) uses fixture campuses to cover validation, geofence, swapped coords, unverified and multi-campus cases. `tests/verify.tsx` still passes.

## Explore map: mobile and regression safety
- **List / Map toggle** (`ExploreMap.tsx`): a Map | List switch with 44 pt targets. The map gets the full width on a phone and the list is not squeezed under it. List rows have a "show on map" pin button (only for places that can be pinned) that jumps to the map with that place selected.
- **Never an empty screen:** with no verified campus there is no map and no toggle, just the list and a one-line note. With a verified campus but nothing pinnable, the list shows under the map.
- **Touch-friendly:** markers have at least a 48 pt tap area (the badge stays 36), the popup has a 44 pt close button and 44 pt action buttons, and tapping the map or the same marker again clears the selection. A search or filter that removes the selected place clears the popup.
- **Responsive:** `exploreLayout.ts` sizes the map from the window (about 42% of the height on phones, clamped to 240..520), so the popup stays on screen on small phones and the map does not dominate tablets.
- **Location tagging preserved:** composer rules are unchanged (location required, known place or "other location", 1 km scope). One fix: while the campus is unverified the composer falls back to the listed distance instead of the geofence, so tagging a place keeps working. A coordinate is stored on a post only when it passes the geofence. `scopedPlaces` now wraps `placeInScope` so `filter` cannot pass the array index in as an argument.
- **Tests:** see `tests/README.md` (logic, screen render, composer regression). Mutation-checked: breaking the bounding box, pinning unpinned places, or removing selection cleanup each makes tests fail.

# Phase 03: Profile and settings saved to the account

## Where each item is stored
| Item | Layer | Where |
|---|---|---|
| Full name, University, Program, Year | Account | Firestore `users/{uid}` (same document the sign-up writes) |
| Profile photo (a photo picked in Edit Profile) | Account | `users/{uid}.avatar`, a small data link (320 px). The Google profile picture is never copied; it is only used when no chosen photo exists |
| Email | Account (login) | Shown in Edit Profile but not editable: it is the sign-in identity, and changing it needs Firebase's verify-and-change flow |
| Board replies, Event reminders, Campus recommendations | Account | `users/{uid}.settings.notif` |
| Show campus on profile, Personalized suggestions | Account | `users/{uid}.settings.privacy` |
| Location sharing | Device | AsyncStorage only (`vicinia_settings`). It describes this phone's permission, so it is not sent to the account |
| Tour done, onboarding seen | Device | unchanged |
There is no bio and no theme setting in this app, so none was added.

## Behaviour
- **No mocks, no new routes.** `auth.ts` gains `fetchAccountProfile`, `updateProfile`, `loadRemoteSettings`, `saveRemoteSettings`. They use the existing Firestore `users/{uid}` document and the same fresh bearer token as the rest of the file. Writes use `updateMask`, so only the fields being saved are touched (email and createdAt never are). The auth display name is updated through the existing `accounts:update` call.
- **Edit Profile** loads the saved profile when it opens (typed text is kept if it arrives late), keeps Save disabled until something changed and loading finished, shows a spinner and ignores taps while saving, shows the failure reason inline and stays open, and only calls `onSave` after the account was updated. `App.tsx` needs no change: `onSave` still receives the saved user.
- **Validation** (`profileRules.ts`): name (same rule as sign-up, max 60), university required, program must be a listed program, year must be a listed year. Errors show under each field.
- **Unsaved changes:** Back, Cancel and the Android back button all ask before discarding when something changed, and are ignored while a save is running.
- **Settings screens** load the account values on open. Account-level toggles show the new value immediately, save to the account, and go back to the old value with an error banner if saving fails. They are disabled while loading, after a failed load (with Retry), and while a save is running, so saves never overlap. The device keeps a copy so the screen has something to show instantly.
- Profile > Notifications row now shows On/Off from the real preferences.
- Copy that said "demo" or "saved on this device" now says the account. `DEMO_PROFILE_SAVE` stays exported in `utils.ts` (unused) in case `App.tsx` imports it.
- New friendly errors: `auth/no-session`, `auth/session-expired`.

## Needs checking outside `src`
- **Firestore rules:** the signed-in user must be allowed to update their own `users/{uid}` document including the new `avatar` and `settings` fields. If the rules list allowed fields, add those two.
- **Session on restart:** the sign-in session lives in memory only (`auth.ts`). If `App.tsx` restores the user at launch without logging in again, saving shows "Your session has expired. Log out and log in again". Persisting the refresh token (in secure storage) would fix that.
- Existing local-only toggle values are not uploaded automatically. The account starts from defaults until a toggle is changed.

## Feedback and accuracy (no optimistic success)
- **Settings toggles no longer move first.** A toggle changes on screen only after the account confirmed the save. While saving the toggles are dimmed and "Saving…" is shown; after success a "Saved to your account." toast appears (location: "Saved on this device."); on failure an error toast shows the reason and the switch stays where it was. A tap while a save is running is ignored and shows nothing (`togglePrivacyPref` resolves `null`, `toggleNotifPref` resolves `false`).
- **Edit Profile** shows "Loading your saved profile…", "Saving your changes…" (spinner on the button), field errors, a red inline error on failure (your edits stay in the form), and a green "Saved to your account." only after the account confirmed the write. The save decision lives in `profileSave.ts` (`submitProfile`): `onSave` runs, and success is returned, only after `updateProfile` resolved.
- **A 2xx reply is not enough.** After each profile/settings write, `auth.ts` checks the document the server sends back and rejects with `firestore/not-persisted` if a field we sent is not stored with the same value. Non-2xx replies, network failures and dead sessions already reject.
- Firestore `UNAUTHENTICATED` (401) now reads as "Your session has expired. Log out and log in again", not a generic error.

## Verification (`tests/e2e.sh`, `tests/e2e.profile.ts`, `tests/fakeFirebase.ts`)
Runs as separate processes (each one is an app restart) against a fake Firebase that enforces tokens, own-document-only rules and updateMask, and keeps its data in a file. Two "devices" are two AsyncStorage files. Covers: successful save checked on the backend itself; reload after restart; a change from another device; network drop after login; a second device (only account-level data follows the person, location does not); a second account on the same device (no leakage, only its own document is written); bad inputs (nothing sent); network, 500, 403, 401, "200 but not stored", revoked session, cross-user and unauthenticated access; no optimistic value while a save is in flight. Breaking the code on purpose (skipping the persistence check, making toggles optimistic, calling `onSave` after a failure) makes the suite fail.
Not covered: the real Firebase project (needs network and credentials) and screen rendering on a device.

# Events design and layout refinement

## Design reference check
Searched the project for Figma links, exported frames, token files and layout specs. **None were found.** The only reference is the comment `// Theme (from the Vicinia Figma)` in `theme.ts`. So this pass uses the existing Vicinia tokens and components, and does not claim to match a Figma frame. Please send the Events frames (or the Figma link) so the points below can be checked against them.

### Design assumptions (to confirm against Figma)
- Corner radii: featured card and event rows 22, date tile 16, filter chips 22 (pill), day cells 14.
- Type sizes kept from the previous pass: featured title 24, row title 16, meta 13, chips 14, section title 20.
- Date badge stays the emoji + "MON DD" tile (66 pt; 58 on small phones, 72 on tablets).
- Only the sizes above changed where they had to (see below); no new colours except the two tokens added.

## What changed
- **Tokens:** `theme.ts` gets `C.purple` (category line) and `C.onDarkMuted` (text on the dark card). Hard-coded `#fff`, `#6B4FA3`, `#CFCBBF` and `#D64545` in the Events files now use `C.card`, `C.purple`, `C.onDarkMuted`, `C.error`.
- **Touch targets (>= 44 pt):** filter chips (`minHeight 44`), week ‹ › buttons (were text with a small hit area, now 44x44), day cells (min 60 high). The shared `BackButton` is 36 pt wide, so it now has a 4 pt `hitSlop` on every side (44 pt tap area, same look, no layout shift anywhere in the app). Hero + and share were already 44.
- **Responsive** (`eventLayout.ts`, one pure function): small phone (< 360 pt) uses a smaller date tile, title and hero and tighter week gaps; large screens (>= 700 pt) keep one centered column, max 720 pt, with larger tile, title and hero. The Events list, event details and register bar all use it. System text size is capped on badges, tiles and titles (`maxFontSizeMultiplier`) so they cannot break the layout; body text still scales.
- **Featured event no longer repeats** in "Coming up" below it. "Coming up" only shows when something is left; the empty state still shows when nothing matches the day or filter.
- **Accessibility:** day cells read "Thursday, October 8, has events", filter chips "Filter: Free", event cards read title, date, venue, fee and Registered; headings are marked; the "+" glyphs are hidden from screen readers (their buttons have labels).
- **Safe area:** unchanged. The Events screens still rely on the app shell (`App.tsx`) for top and bottom insets; no safe-area package is used anywhere in `src`. If the details page overlaps the status bar or home indicator on your device, wrap it with `react-native-safe-area-context` insets in `App.tsx` or tell me.

## Verification
- `tests/eventLayout.test.ts` (breakpoints, bad widths, tile and title bounds): `NODE_PATH=$(npm root -g) npx tsx tests/eventLayout.test.ts`.
- The changed files parse cleanly, but there was no network in this session, so `tsc` and a render test could not be run. Run `npx tsc --noEmit` in your project and check the Events tab on a small phone, a normal phone and an iPad.

# Events: real data, loading / empty / error states

## Where events come from now
- **Firestore `events` collection** (same project and REST style as `auth.ts`). `eventsApi.ts` reads it (`fetchEvents`, soonest first, from two weeks back) and writes to it (`createEvent`). The static sample list in `data.ts` (`EVENTS`) is **no longer used by the app** (kept only as a reference/fixture; Org Fair, Hackathon and the other samples no longer appear).
- **Document fields** (`eventModel.ts`): `title` and `startsAt` (timestamp) are required; optional: `endsAt`, `timeTbd`, `category`, `venue`, `address`, `campus`, `about`, `organizer`, `fee` (whole pesos), `host` (`guidance` or `osa`), `featured`, `goingCount`, `imageUrl` (https only), plus `ownerUid`, `ownerEmail`, `createdAt` written when someone posts. A document without a usable title or date is skipped.
- **No invented details.** Missing venue shows "Venue to be announced", missing time "Time to be announced", missing about the neutral organizer line. A missing fee shows no price and is **not** treated as Free (the Free filter only matches events listed at ₱0). No default organizer, address, attendee count or photo. Registration is still the local demo (nothing is sent to a server, and no registration link is created).
- **Post an event** now saves to the server and says "Posting…" with a spinner; the event is announced as listed only after the server confirmed what it stored. Failures show inline (no internet, timeout, not logged in, rules). It needs a signed-in account. Events posted on this device before this change still show, marked "On this device", and nothing new is written there.
- **Guidance and OSA pages** list upcoming events with `host` = `guidance` / `osa` from the same feed (OSA no longer uses the fixed `announcementIds`). Home search, "My events" in Profile and event details all read the same feed.

## States
- **Loading:** skeleton cards (featured + rows; still when the phone has Reduce Motion on). The last saved copy shows immediately when there is one.
- **Empty:** "No upcoming events yet" (with a Post an event button) when the server has nothing upcoming; "No events for this view" with **Clear filters** when events exist but not for the chosen day / filter / category.
- **Error:** full "Couldn’t load events" with the reason and **Try again** when nothing is saved; a red banner with **Retry** above the last saved events when a refresh fails. 15 s timeout, so it never loads forever. Pull down to refresh. The page refreshes when it opens and when its data is over a minute old.
- **Filters:** For you / Today / This week / Free, plus a **category** row built from the events actually loaded (hidden when there is only one category).
- Files: `eventModel.ts` (document <-> event), `eventsApi.ts`, `eventsStore.ts` (state + cache `vicinia_events_cache`), `eventsView.ts` (filter and page-state logic), `components/EventSkeleton.tsx`, `components/OfficeEvents.tsx`.

## You need to do (outside `src`)
1. Merge `src/firestore.events.rules` into your Firestore rules and publish. Without a rule that allows reading `events`, the page shows "You are not allowed to view or post events".
2. Add events: either post them in the app, or add documents to `events` in the Firebase console (set `host` and `featured` there; the rules stop students from setting them).
3. Times are shown in the phone's time zone.

## Verification
- `tests/events.test.ts` (35 checks): document mapping and fallbacks, bad documents, Firestore access against a fake backend (order, empty, old events, network / 500 / 403 / bad reply / timeout, signed out vs in, posting, a write the server did not store), feed states (loading, ready, empty, error, retry, saved copy, one shared request, staleness, server data changing, upsert), page-state and filter logic (Today, This week, Free, categories, featured not repeated, only-past events). Breaking the code on purpose (Free matching unknown fees, dropping the list on error, defaulting fee to 0, skipping the stored-value check, repeating the featured event, allowing double requests) makes it fail.
- `tests/geo.test.ts`, `tests/profile.test.ts` and `tests/eventLayout.test.ts` still pass.
- Not covered: screen rendering, taps and layout on a device (the render stack could not be installed here). Check on a phone: skeleton while loading, airplane mode on first open (error + Try again), airplane mode after a good load (banner + saved events), an empty collection, one event with only title and date (neutral venue/time, no price), pull to refresh, and post an event logged in and logged out.

# Phase 06: Final integration audit (fixes only)
- `screens/PostEvent.tsx`: added a synchronous `useRef` lock so a fast double tap cannot POST two events (state alone is stale within a frame; `CreateBoard` and `CreatePost` already did this).
- Touch targets raised to 44 pt: Create Board category chips, Boards Posts/Members/About tabs, composer destination/tag chips, header Post button, media toolbar buttons (38 -> 44), "Add more" and flair chips, Profile "+" button (36 -> 44).
- `firestore.events.rules`: `update` can no longer add or change `host`, `featured`, `goingCount` or `ownerUid` (create already forbade them). Not run against the Firestore emulator; test before publishing.
- Nothing else changed. Open items are listed in the final report (campus coordinates unverified, `App.tsx` wiring, Google client ID, safe-area, device testing).

## Content from JSON
- `src/content/organizations/**/organization.json` and `event.json` are now the source of truth for the boards (`BOARDS`) and the sample events (`EVENTS`) in `data.ts`. Existing IDs, order and field values are unchanged (checked identical to the old arrays).
- `src/content/index.ts` is the central loader (`loadOrganizations`, `loadEvents`). Relative `logo` (organizations) and `image` (events) paths are resolved to bundled assets.
- Metro cannot scan folders, so after adding/removing a content file run `python3 tools/build_content_index.py` (rewrites `src/content/generated.ts`).
- `python3 tools/validate_content.py` checks required fields, duplicate IDs, image paths, event → organization links, that `generated.ts` is current, and that "Talents Guild" appears nowhere. The name `PayoPitongPitik Society` must use id `payopitongpitik`.
- Home posts and Explore places are still arrays in `data.ts`; the Profile screens were not touched.

## Boards page: organization directory
- `OrgBoardsPage` (screens) replaces the main Boards page **when `src/content` has organizations that declare `"group": "academic"` or `"non-academic"`**. Until then the original Boards screen is used. The embedded copy inside Profile is unchanged.
- Each card shows logo, full name, short name, category, description, tags and a featured event (poster, title, date, status). Tapping opens `OrgDetailModal` with every event of that organization.
- `organization.json` fields: `id`, `group`, `full_name`, `short_name`, `category`, `description`, `description_verified` (true/false), `tags` (list), optional `logo` (relative path), optional `featured_event_id`.
- Description shows "Description pending confirmation" unless `description_verified` is `true` and the description is not empty.
- Featured event of a card: `featured_event_id` if set, otherwise the next upcoming event, otherwise the most recent past one.
- Broken or missing images use `SafeImage`: a neutral grey placeholder in the same box. Nothing from the data (or another org) is ever substituted.

## Events page: 4 featured events
- `src/featuredEvents.ts` (`FEATURED_EVENT_IDS`) is the single place that picks the featured events. The page shows exactly those, in that order, above the existing list. An id with no matching `event.json` is skipped with a console warning; nothing is invented.
- `event.json` (new format): `id`, `title`, `start_at` (ISO with offset, e.g. `2026-11-05T13:00:00+08:00`), optional `end_at`, `venue`, `organization_id`, `verified_by_human` (true/false), optional `poster` (relative path). Date and time text are derived from `start_at` (Philippine time). Older files with typed date strings still load.
- Past / Upcoming / Happening now is computed from the clock at render time (`eventStatus.ts`, refreshed every minute by `useNow`). With no end time, an event lasts until the end of its day.
- "Details unconfirmed" shows whenever `verified_by_human` is not `true`.
- Posters keep their own aspect ratio (`SafeImage`, resize mode contain); nothing is cropped or stretched.

## Checks
- `python3 tools/validate_content.py`: now also requires exactly 9 directory organizations (6 academic, 3 non-academic), the 4 featured events with a `verified_by_human` flag, ISO dates, and existing image files.
- `npx tsx tests/orgcontent.test.ts` (logic) and `python3 tests/validate_content_test.py` (validator against made-up fixtures). Fixtures are never shipped.

## Tags, filters and dropdowns come from the data
- `src/content/filters.ts` derives every option from the loaded JSON: categories `All / Academic / Non-academic` (with counts), tags (case-insensitive, per category, most used first) and event statuses `All / Upcoming / Past / Date TBA` (with counts). Nothing is typed in by hand, so an option with no data behind it cannot appear, and a name that is removed from the JSON (e.g. "Talents Guild") disappears from every filter.
- Boards page: category chips + tag chips (tap the selected tag again to clear). A tag that no longer exists is dropped automatically.
- Events page and the organization detail modal: status chips. A status with no events shows 0.
- Empty states are explicit everywhere: no organizations at all, filters that match nothing (with "Clear filters" / "Show all"), no events, no events with that status.
- Statuses are now exactly three: `Upcoming` (not over yet, including an event happening now), `Past`, `Date TBA` (no usable date). An event is Date TBA only when its `event.json` says `"date_tba": true`; it never gets an invented date.
- Left as they are on purpose, because they are choices in forms and not filters of content: the category pickers when posting an event or creating a board, and the program/year lists in sign-up and profile.

## Handoff pack imported (nine organizations)
- `tools/import_handoff_pack.py <pack-folder>` converts the Vicinia handoff pack into `src/content/organizations/<id>/` (organization.json, `assets/logo.png`, `events/<event-id>/event.json` + `event-poster.jpg`). Re-runnable; it never touches the starter boards. After running it: `python3 tools/build_content_index.py && python3 tools/validate_content.py`.
- Result: 9 directory organizations (ACE-Q, ACM, AWS SBG, JDSAAP, JISSA, JPCS = academic; PayoPitongPitik, Tanghalang Mithi, TGS = non-academic) and 12 events. The Boards page now shows the directory and all 4 `FEATURED_EVENT_IDS` resolve on the Events page.
- Field mapping: pack `category` (academic/non-academic) -> `group`; pack `name` -> `full_name`; `featured_event` path -> `featured_event_id`; `summary` -> `about`; `image` -> `poster`. `category` shown under the name is the first tag, title-cased (the pack has none): edit in organization.json if you want other wording.
- `normalizeEvent` now accepts `date` (`YYYY-MM-DD` or `YYYY-MM`) with optional `date_end` and free-text `time`. No clock time is ever invented: the poster's wording is shown as printed, else "Time to be announced". A one-day event is Upcoming until its day ends (Manila); a month-only event is Past once that month ends and shows "--" for the day; a range counts until the end of its last day. An event with no date in the pack stays `date_tba`.
- `tools/validate_content.py` accepts and checks the `date` form. `tests/orgcontent.test.ts` has 9 new checks (67 total).
- `tests/stubs/images.js`: lets Node tests load `src/content`, which now bundles images. It is the first import of each test that touches content.
- Every imported event keeps `verified_by_human: false`, so the app shows "Details unconfirmed". Still needs human confirmation (see the pack's CHANGELOG): poster/logo permissions, Tanghalang Mithi date (Oct 1 vs Jan 10), unverified descriptions (JPCS, PayoPitongPitik, Tanghalang Mithi), official logos.
- Not imported: AWS SBG's second poster (`event-poster-agenda.jpg`), the pack's `assets/source/` originals, `source-notes.txt`. The app has no field for them.
