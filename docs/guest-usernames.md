# Guest usernames and top-ten medals

Players enter only a username. No email or password is collected. Supabase Anonymous Auth quietly supplies a persisted browser identity when the player claims a name. The nickname is owned by that identity; display capitalization is preserved, while capitalization and repeated spaces cannot bypass the unique database key.

The first successful database claim wins, including simultaneous requests. One guest identity owns one immutable name. Clearing browser data, private browsing, changing browsers or changing devices loses access; there is no account recovery flow. Names are not released automatically. A person can create another identity in another browser; this is name ownership, not one-human-one-account verification.

Guest driving remains available without a claim. Posting on the shared leaderboard requires a successfully claimed name. Scores cannot specify another player's nickname or identity. Historical unowned scores stay read-only in a separate “Earlier leaderboard” section, and their old names remain reserved because the old data cannot prove ownership.

## Activation

1. In the existing game Supabase project, enable **Authentication → Sign In / Providers → Anonymous Sign-Ins**. Keep the existing project URL and public key; no service key belongs in browser code.
2. Run `supabase/migrations/20261007_player_names.sql` in the project's SQL editor. This transaction creates protected player/score tables, reserves historic names, disables the old unrestricted write paths, and installs the claim, submit, public board and private medal functions. The existing `supabase/leaderboard.sql` schema must already exist; do not rerun that old bootstrap after this migration.
3. Deploy the updated frontend after the migration. Older clients will be unable to write shared scores after step 2; refreshing loads the new flow. No historical score rows are deleted.
4. Test in two separate browser profiles: the first claims a temporary test name; the second must be rejected for the same spelling and different capitalization. Test a reload in the first browser, a lower-score submission, and the top-ten popup after a saved score. Use clearly labelled test identities; claimed names are intentionally persistent.

A missing migration or disabled anonymous registration displays an unavailable message and never pretends a username is reserved. Do not publish the frontend as a completed feature until database activation and two-browser verification succeed.

## Medals

After a successful shared-score submission, `my_moruwa_medal()` calculates the current caller's rank with the same tie-breaking order as the public board. Positions 1–3 get gold/silver/bronze styling; positions 4–10 get a green top-ten medal. Other players get no medal popup. A higher saved personal best can qualify even if the current attempt was lower; the image labels the score as the personal best.

The popup shows name, rank, score and a ranking timestamp. It exports an original PNG for saving, supports native file sharing where available, falls back to link sharing or a download/screenshot instruction, and includes the game address. The popup does not send anything automatically. Rank is a snapshot and can change after another player submits.

## Validation and limits

Node tests cover normalization, the atomic RPC call contract, unavailable/taken-name errors and top-ten eligibility. Production builds are checked. These tests do not substitute for applying and exercising the SQL migration in Supabase. The browser smoke test uses clearly labelled sample medal data and does not create a real player or score.

This change protects name ownership; it does not make client-reported scores cheat-proof. Strong score verification is a separate server/gameplay task.

References: [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous), [database functions and explicit grants](https://supabase.com/docs/guides/database/functions).
