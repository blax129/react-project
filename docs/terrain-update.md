# Terrain challenge update

The local project uses origin https://github.com/blax129/react-project.git, branch main.

Implemented four repeatable challenge types: crest control, broken-road bumps, momentum valleys, and double crests. A warm-up precedes the first challenge; section height grows with route difficulty. Smooth joins avoid invisible vertical discontinuities. The game now displays an advance road warning and driving advice. No random terrain changes or artificial input delays were added.

Validation: 64 automated tests pass; production build and git diff whitespace check pass. A test-only controller using braking before severe drops and airborne pitch correction takes all 19 vehicles through the first four challenge types to world x=9800 within 90 seconds. A separate continuous-gas trial crashes at least six vehicles before that point. This demonstrates a learnable control advantage, not full-route balance or human difficulty certification. Terrain sampling checks determinism, finite values, and continuity at section joins. Measurement fixtures were regenerated.

The warm-up regression now checks through x=700, before the intentional obstacles, instead of requiring every vehicle to survive six seconds of blind throttle. Late-game terrain and physical-phone driving still need playtesting.

Live browser verification of this update was unavailable: the existing local server had stopped, and starting a replacement was blocked by the network sandbox. Run npm run dev from the project folder to try the update. No changes were committed, pushed, or deployed. The project title remains Korope; Road Wahala is a proposed name only.

## Progressive difficulty (latest local update)

The first four challenge sections remain unchanged. Starting at world x=9900 (234 displayed points), each new section adds progressively more obstacle height and sharper transitions. Difficulty continues beyond Epe, approaching safe bounds instead of generating infinitely steep cliffs. Road warnings label the later stages Hard, Expert (500 points), and Extreme (1000 points). Labels describe the curve; the physical changes happen section by section, not abruptly at label thresholds. The same location always has the same terrain, including when reversing, so no random loss or road movement is introduced.

Validation: all 68 automated tests and the production build pass. New checks measure increasing peak slopes for all four obstacle types beyond Epe and verify finite terrain and continuous joins near the maximum score. The existing careful-driving controller still clears the first four challenges with all 19 rides. Vehicle benchmark data was regenerated for the new route. These checks do not establish a human crash probability or guarantee that every vehicle can clear every late-game section. Physical-phone playtesting remains useful for tuning the curve. This update is included with the fuel-dashboard and fullscreen-controls release. Deployment status must be checked separately in Netlify.
