# Core Knowledge Lab — Evaluation Scripts

This document captures the manual evaluation scripts and expected behaviours for the Core Knowledge lab epoch. It is written for testers: copy-paste the scripts, run them against the Luminaries, and confirm the expected outputs.

## Goals for the epoch
- Luminaries drive behaviour from structured Core Knowledge domains (profiles, goals, plans, logs) with domain-level `behaviour` metadata steering priorities and elicitation.
- Reflection updates structured Core Knowledge documents rather than only free-form summaries, mapping user inputs into the right domains.
- `aiExtendable` guardrails protect nested Core Knowledge sections, enabling controlled extension while preventing unintended mutation.

---

## Pirate Captain (Behavioural Core Knowledge)

### Scripts
1. **Crew and ship setup**
   ```
   Let's set up the crew and ship. We need a lookout, navigator, cook, and quartermaster. The ship is the Resolute Tide, a brigantine with reinforced hull plating. The flag is a black kraken on crimson.
   ```
2. **Long-term goal set**
   ```
   Set a long-term objective: secure safe harbor rights at Isla Calderon within three months while maintaining crew morale above 8/10.
   ```
3. **Goal correction**
   ```
   Update the long-term objective: focus on gathering alliance treaties with two coastal towns instead of Isla Calderon. Keep the morale constraint.
   ```

### Expected results
- **Conversation behaviour**
  - Responses stay in narrative pirate tone, referencing crew roles, ship traits, and the latest strategic objective.
  - The captain proposes actions aligned to the active long-term goal and morale constraint.
- **Core Knowledge JSON**
  - `crewProfile` lists crew roles and ship traits, updated after the first script.
  - `strategy` records the long-term goal and constraint, revised after the correction script.
  - `voyageLog` begins capturing notable events and intentions tied to the goal shift.
  - `behaviour` metadata shows priorities for `crewProfile`, `strategy`, and `voyageLog` plus `proactiveElicitation` for missing fields.
- **Reflection debug**
  - Reflection targets `strategy` and `voyageLog` when goals change.
  - Logs show mapping from user text into structured fields (goal description, timelines, morale thresholds) and confirm `aiExtendable` guards around nested sections.

---

## Personal Trainer (Intake and Progress)

### Intake script
Copy-paste the full intake to seed Core Knowledge:
```
Hi! Here’s a sketch of me: I’m Alex, 34, 5’10”, 180 lbs. I want to get back into climbing shape and be able to send V5 consistently by spring. I used to climb twice a week but haven’t in six months. I have access to a campus board and a hangboard at home. I also want general strength—three sets of five for squat at 225 lbs would be great. Timewise, I can do four sessions a week, 60-75 minutes. I prefer evening workouts, and I have a left shoulder that gets cranky if I overdo overhead presses. Food-wise, mostly plant-based, need quick meals. Sleep is around 7 hours but could be better. I don’t like long cardio, but short intervals are fine.
```

### Expected Core Knowledge after intake
- **Profile**: name (Alex), age (34), height/weight, preferences (evenings), constraints (left shoulder sensitivity, dislikes long cardio), equipment (campus board, hangboard), nutrition notes (plant-based, quick meals), sleep baseline (~7 hours).
- **Goals**: includes climbing goal (V5 by spring) and strength goal (3x5 squat at 225 lbs) with timelines and qualitative success criteria.
- **Context**: summarises training history (climbed twice a week, six-month gap) and available facilities (home boards).
- **Plan**: four-session weekly structure with session types (climb/strength/mobility/intervals), 60–75 minute duration, evening preference, and shoulder-friendly guidance. Includes the initial 4-day breakdown.
- **Progress**: baseline entry noting “intake only” or “no sessions yet” with date/time.
- **Behaviour metadata**: domain priorities highlight `profile`, `goals`, `context`, `plan`, `progress` with proactive elicitation for missing safety/constraint details.

### First logged session script
```
Logged a session: 60-minute evening climb. Warm-up, easy boulders to V2, then worked V4. Added 3x6 ring rows and 3x10 band pull-aparts for shoulder health. Felt good; shoulder fine.
```

### Expected results after first session
- **Conversation behaviour**: acknowledges the completed session, reinforces shoulder-safe work, and offers next steps based on the plan.
- **Core Knowledge JSON**: new `progress` entry with session details, time, and shoulder status; minor plan tweak suggestions (e.g., progress towards V5) may appear while preserving the 4-day structure.
- **Reflection debug**: shows `progress` as the target domain; confirms mapping of session details into structured fields and that `aiExtendable` guards keep plan alterations scoped.
