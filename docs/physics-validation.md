# Korope reliability and balance changes

Implemented directly in `/Users/mac/React sep` on 2026-10-07. All 19 vehicle IDs and existing artwork remain in place. No dependencies were installed, no cloud scores were submitted, and no deployment or commit was made.

## Changes

- Fixed-step physics at 120 Hz, with bounded catch-up and discarded long interruptions. The same timed inputs now produce identical results at 30, 60, and 120 display FPS.
- Pixel-based wheel centres, individual tire radii, and sampled upper-body collision points for every PNG. Tipper and Dangote now resolve each visible axle; tractor resolves all three visible wheels. These remain rigid bodies. The tractor roof samples do not bridge the empty gap between trailer and canopy.
- Ground alignment follows the axle footprint instead of a single terrain sample. Stronger damping and gentler grounded pedal lean prevent the previous immediate opening flips. Air control remains responsive.
- Braking reduces along-road motion before powered reverse engages. Braking, coasting, and airborne balance do not burn fuel; powered forward and reverse do. Opposing pedals brake rather than fight each other.
- Base fuel burn reduced from 16 to 4 units/second, pickup refill increased from 28 to 42, base pickup gap reduced from 1100 to 900 world units. Tractor burn multiplier changed from 1.45 to 1.0.
- Separate input sources for each key and pointer prevent releasing one control from releasing another. Blur, hidden pages, pause, and run cleanup clear inputs. Focus loss pauses the active run. Pointer cancellation/lost capture release the appropriate finger. P ignores key-repeat; name fields do not drive the vehicle.
- UI ratings now use checked-in results from repeatable physics benchmarks, rather than a fabricated grip/torque formula. Tests detect stale measurements. Cargo copy no longer promises cargo loss.
- Narrow phones show one readable vehicle card between the navigation arrows. Canvas aspect ratio is preserved in landscape. Camera centre shifted from x=260 to x=330 so the left pedals do not cover long vehicles on phones. Reduced-motion CSS disables decorative transitions/animations.

## Validation

- `npm test`: 43 tests passed. Includes all 19 vehicles on the opening route and a 15% grade, braking/reverse, empty coasting/stall, actual fuel pickup and refill cap, airborne-clear roof and natural upside-down impact, fresh run state, artwork/camera bounds, multi-source controls, and refresh-rate equivalence.
- `npm run balance`: completed, producing `src/game/vehicleBenchmarks.json`.
- `npm run build`: passed.
- `git diff --check`: passed.
- Live in-app browser: selected and started each of the 19 rides, inspected pause/resume, verified no horizontal overflow at 320px and 390px widths, and inspected the longest truck on a narrow phone.
- Landscape 844x390: canvas measured 540x270 (2:1), bottom at 328px, with no horizontal overflow.
- Browser console reported no errors or warnings during these checks. Native macOS browser permissions remained pending, but the in-app browser worked.
- Browser launch checks are not full manual playthroughs. Driving, fuel exhaustion, crash, and refresh-rate checks were exercised by the automated simulation. Multi-touch on a physical phone and extended play through Epe remain unverified.

## Fuel balance

Tank duration assumes continuously powered driving, a 100-unit tank, and no pickups. Coasting/air time extends it. Baseline opening distance is the original build under continuous gas for up to 30 seconds; the new opening test uses the same input and time limit. These are world units, not HUD score or real-world metres. Continuous gas intentionally remains capable of causing flips.

| Vehicle ID | Old tank seconds | New tank seconds | Old opening distance | New opening distance | New test end |
|---|---:|---:|---:|---:|---|
| korope | 8.7 | 34.7 | 1818 | 7646 | 30-second limit |
| okada | 11.4 | 45.5 | 1761 | 5590 | flip |
| danfo | 6.2 | 25.0 | 1791 | 9477 | 30-second limit |
| molue | 4.0 | 16.1 | 1276 | 3367 | 30-second limit |
| taxi | 6.0 | 23.8 | 1215 | 4680 | flip |
| delivery | 5.4 | 21.7 | 1795 | 7662 | 30-second limit |
| tipper | 4.2 | 16.7 | 1401 | 6378 | 30-second limit |
| suv | 4.5 | 17.9 | 1848 | 5697 | flip |
| dangote | 3.4 | 13.5 | 874 | 5333 | 30-second limit |
| police | 5.2 | 20.8 | 1919 | 9472 | 30-second limit |
| lexus | 5.0 | 20.0 | 1799 | 5704 | flip |
| fayawo | 4.6 | 18.5 | 310 | 3600 | flip |
| micra | 13.0 | 52.1 | 61 | 5635 | flip |
| brt | 3.9 | 15.6 | 944 | 4424 | 30-second limit |
| peugeot | 5.7 | 22.7 | 1811 | 5617 | flip |
| purewater | 5.0 | 20.0 | 1862 | 7620 | 30-second limit |
| tractor | 4.3 | 25.0 | 1119 | 5544 | 30-second limit |
| benzgle | 4.3 | 17.2 | 1471 | 5728 | flip |
| benzcoupe | 4.2 | 16.7 | 1430 | 5742 | flip |

## Rating methodology

- Speed: flat-road speed after 8 simulated seconds.
- Climbing: highest tested constant grade passed from a standing start (at least 160 world units travelled in 6 seconds), stepped in 5 percentage points up to 90%. Grade is rise/run, not degrees.
- Stability: number of ten controlled tilted drops that recover upright in 4 seconds without input. This test has limited discrimination: most rides recover eight, and three recover nine. It does not represent every terrain jump.
- Fuel economy: measured flat speed divided by fuel burn, in world units per fuel unit. Higher means more distance per fuel unit.

## Remaining limitations and next work

1. Test sustained touch driving on a real phone and late-route fuel/climb difficulty. Measured results show Tipper and Tractor are still weaker climbers than the fastest cars; their engine curves need a dedicated tuning pass if they should be the best climbers.
2. Add actual spring suspension and differentiated low-speed gearing/traction if desired. Current handling is arcade slope alignment and damping, with no separate mass, engine torque, or friction simulation.
3. Implement an articulated trailer and moving cargo as separate mechanics. Neither is claimed as implemented here. Vehicle artwork remains static.

## Running checks

Use Node 22.15+ (or a newer release with `node:module.registerHooks`; validated here on Node 25.9). From the project folder:

```sh
npm test
npm run balance   # regenerate ratings after intentional physics/config edits
npm run build
npm run dev
```

The test loader stubs PNG imports only; it runs the same JavaScript vehicle and physics modules used by Vite. Test scenarios inject flat or inclined terrain through the normal run constructor. The existing saved-game keys, leaderboard code, backend settings, and artwork files were left unchanged.
