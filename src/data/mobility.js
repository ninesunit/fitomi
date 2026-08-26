// Mobility, warm-up and recovery drills the quest engine draws from.
// Each is tagged with the muscles it serves so a quest can be generated for
// exactly the tissue the soreness model says is cooked.
export const MOBILITY_DRILLS = [
  { id: 'cat-cow', name: 'Cat–Cow', muscles: ['lowerBack', 'abs'], duration: 60, kind: 'mobility', cue: 'Segment the spine one vertebra at a time. Exhale into flexion.' },
  { id: 'worlds-greatest', name: "World's Greatest Stretch", muscles: ['hipFlexors', 'hamstrings', 'obliques'], duration: 90, kind: 'mobility', cue: 'Lunge, plant the hand inside the foot, rotate the top arm to the ceiling.' },
  { id: 'couch-stretch', name: 'Couch Stretch', muscles: ['quads', 'hipFlexors'], duration: 120, kind: 'mobility', cue: 'Rear foot on a bench, squeeze the glute to posteriorly tilt the pelvis.' },
  { id: '90-90-hip', name: '90/90 Hip Switch', muscles: ['glutes', 'hipFlexors', 'adductors'], duration: 90, kind: 'mobility', cue: 'Stay tall, switch sides without using your hands.' },
  { id: 'thoracic-opener', name: 'Thoracic Opener on Foam Roller', muscles: ['back', 'chest', 'shoulders'], duration: 90, kind: 'mobility', cue: 'Roller across the mid-back, support the head, exhale into extension.' },
  { id: 'band-pull-apart', name: 'Band Pull-Apart', muscles: ['shoulders', 'traps', 'back'], reps: 25, kind: 'activation', cue: 'Straight arms, pull the band to the sternum, pause a beat.' },
  { id: 'face-pull-warmup', name: 'Light Face Pull', muscles: ['shoulders', 'traps'], reps: 20, kind: 'activation', cue: 'Rope to the eyebrows, external rotation at the end range.' },
  { id: 'scap-pushup', name: 'Scapular Push-Up', muscles: ['chest', 'shoulders'], reps: 15, kind: 'activation', cue: 'Arms locked. Only the shoulder blades move.' },
  { id: 'dead-hang', name: 'Dead Hang', muscles: ['lats', 'forearms', 'shoulders'], duration: 60, kind: 'mobility', cue: 'Full hang, relax the shoulders, breathe through the ribs.' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscles: ['glutes', 'hamstrings'], reps: 20, kind: 'activation', cue: 'Ribs down, squeeze at the top for two seconds.' },
  { id: 'bird-dog', name: 'Bird Dog', muscles: ['lowerBack', 'abs', 'glutes'], reps: 16, kind: 'activation', cue: 'Opposite arm and leg. Do not let the hips rotate.' },
  { id: 'dead-bug', name: 'Dead Bug', muscles: ['abs', 'hipFlexors'], reps: 16, kind: 'activation', cue: 'Low back pinned to the floor the entire time.' },
  { id: 'ankle-rock', name: 'Half-Kneeling Ankle Rock', muscles: ['calves'], reps: 20, kind: 'mobility', cue: 'Knee tracks over the toes, heel stays glued down.' },
  { id: 'wrist-cars', name: 'Wrist Circles & Extensions', muscles: ['forearms'], duration: 60, kind: 'mobility', cue: 'Palms down on the floor, rock forward slowly.' },
  { id: 'neck-cars', name: 'Neck Controlled Rotations', muscles: ['neck', 'traps'], duration: 60, kind: 'mobility', cue: 'Slow, no pain, full available range.' },
  { id: 'pec-doorway', name: 'Doorway Pec Stretch', muscles: ['chest', 'shoulders'], duration: 90, kind: 'mobility', cue: 'Elbow at shoulder height, step through, do not shrug.' },
  { id: 'lat-stretch', name: 'Kneeling Lat Stretch', muscles: ['lats', 'back'], duration: 90, kind: 'mobility', cue: 'Elbows on a bench, sink the chest and reach long.' },
  { id: 'pigeon', name: 'Pigeon Pose', muscles: ['glutes', 'abductors'], duration: 120, kind: 'mobility', cue: 'Square the hips, breathe out into the stretch.' },
  { id: 'hamstring-sweep', name: 'Standing Hamstring Sweeps', muscles: ['hamstrings', 'calves'], reps: 20, kind: 'mobility', cue: 'Heel down, toes up, sweep the hands past the shin.' },
  { id: 'thread-needle', name: 'Thread the Needle', muscles: ['back', 'obliques', 'shoulders'], duration: 90, kind: 'mobility', cue: 'Rotate from the mid-back, not the lumbar spine.' },
  { id: 'calf-raise-mobility', name: 'Slow Eccentric Calf Raise', muscles: ['calves'], reps: 20, kind: 'activation', cue: 'Three seconds down off a step.' },
  { id: 'monster-walk', name: 'Banded Monster Walk', muscles: ['abductors', 'glutes'], duration: 60, kind: 'activation', cue: 'Band above the knees, athletic stance, no knee collapse.' },
  { id: 'child-pose', name: "Child's Pose with Side Reach", muscles: ['lats', 'lowerBack', 'obliques'], duration: 90, kind: 'mobility', cue: 'Hips to heels, walk the hands to each side.' },
  { id: 'tricep-overhead-stretch', name: 'Overhead Triceps Stretch', muscles: ['triceps', 'lats'], duration: 60, kind: 'mobility', cue: 'Elbow to the ceiling, gentle pull, ribs down.' },
  { id: 'bicep-wall-stretch', name: 'Wall Biceps Stretch', muscles: ['biceps', 'chest'], duration: 60, kind: 'mobility', cue: 'Palm flat on the wall, rotate the body away.' },
  { id: 'jefferson-curl', name: 'Light Jefferson Curl', muscles: ['hamstrings', 'lowerBack'], reps: 10, kind: 'mobility', cue: 'Very light load. Roll down one vertebra at a time.' },
  { id: 'cossack', name: 'Cossack Squat', muscles: ['adductors', 'quads', 'glutes'], reps: 16, kind: 'mobility', cue: 'Shift side to side, keep the trailing foot flat.' },
  { id: 'wall-slide', name: 'Wall Slide', muscles: ['shoulders', 'traps', 'back'], reps: 15, kind: 'activation', cue: 'Low back flat to the wall, wrists stay in contact.' },
];

// Conditioning finishers for AGI / cardio quests.
export const CONDITIONING_DRILLS = [
  { id: 'jump-rope', name: 'Jump Rope Intervals', duration: 360, cue: '30s on / 30s off x 6. Stay on the balls of the feet.' },
  { id: 'incline-walk', name: 'Incline Treadmill Walk', duration: 900, cue: '12% incline, 5 km/h, no holding the rails.' },
  { id: 'bike-sprints', name: 'Assault Bike Sprints', duration: 300, cue: '20s all-out / 40s easy x 5.' },
  { id: 'row-intervals', name: 'Rowing Intervals', duration: 600, cue: '500m hard / 90s rest x 4. Legs, hips, arms.' },
  { id: 'stair-climb', name: 'Stair Climber', duration: 720, cue: 'Steady pace, upright posture, no leaning on the handles.' },
  { id: 'farmers-walk-finisher', name: "Farmer's Carry Finisher", duration: 240, cue: '4 x 40m heavy. Ribs down, shoulders packed.' },
  { id: 'shadow-boxing', name: 'Shadow Boxing', duration: 480, cue: '3-minute rounds, 60s rest. Keep the hands up.' },
  { id: 'sled-push', name: 'Sled Push', duration: 360, cue: '6 x 20m. Low body angle, drive through the whole foot.' },
  { id: 'kb-swing-finisher', name: 'Kettlebell Swing EMOM', duration: 600, cue: '15 swings on the minute for 10 minutes.' },
  { id: 'burpee-ladder', name: 'Burpee Ladder', duration: 420, cue: '1-2-3…10 then back down. Chest to floor.' },
];

export const RECOVERY_DRILLS = [
  { id: 'foam-roll-full', name: 'Full-Body Foam Roll', duration: 600, cue: 'Two minutes per major group. Slow, breathe out on tender spots.' },
  { id: 'sleep-target', name: 'Eight Hours of Sleep', duration: 0, cue: 'The single highest-leverage recovery intervention there is.' },
  { id: 'hydration', name: 'Hydrate to 3 Litres', duration: 0, cue: 'Spread it across the day, not all at once.' },
  { id: 'protein-target', name: 'Hit Your Protein Target', duration: 0, cue: 'Roughly 1.6–2.2 g per kg of bodyweight.' },
  { id: 'walk-recovery', name: 'Easy 20-Minute Walk', duration: 1200, cue: 'Blood flow without adding fatigue.' },
  { id: 'contrast-shower', name: 'Contrast Shower', duration: 300, cue: '30s cold / 60s warm x 3, finishing cold.' },
  { id: 'breath-work', name: 'Box Breathing', duration: 300, cue: '4 in, 4 hold, 4 out, 4 hold. Drops you into recovery mode.' },
];
