# trainlog — GTM / positioning plan

## Positioning statement
For people who've quit a "log every set" app because it turned the gym into
data entry, trainlog is the minimalist workout log that treats showing up —
not the spreadsheet — as the win. It doesn't ask for a single rep. It's not
a generic habit checkbox either — it knows what a training day actually
looks like (a split, a PR, a rest day that still counts).

**What we are NOT:** a lifting logbook. Not competing with Strong/Hevy/JEFIT
on data depth, 1RM calculators, or program templates.

**What we ARE:** a consistency journal for the gym — "your gym's
contribution graph." The calendar/heatmap is the hero object, not a
secondary stat.

**Comparison angles:**
- vs. Strong/Hevy/JEFIT — "I don't need a spreadsheet, I need proof I
  showed up." Own the week-3 logging-fatigue churn moment directly.
- vs. pure habit trackers (Streaks, Way of Life) — those don't know what a
  workout *is*. trainlog is habit-tracker simplicity with just enough
  gym vocabulary to be more than a checkbox, without becoming bloated.

## ICP
- **Primary — the incumbent-app quitter.** Downloaded Strong/Hevy, used it
  2-6 weeks, quit — not because they stopped training, but because logging
  sets stopped feeling worth it. Pain is already felt and nameable; copy
  can quote it back to them.
- **Secondary — the habit-tracker crowd who also lifts.** Streaks / Way of
  Life / Oura users who'd pay a design-tax for a gym-specific version of a
  tracking ritual they already like. This segment is where early adopters
  actually get found (see channels).

## Product concept: Partiful-style progress visualization
Direct answer to the "progress pics / key moments" pillar, and it gives
that pillar a concrete spec instead of vague aspiration (the gallery tab
in the nav currently renders "not built yet" — this is the build-out).

**Two calendar modes:**
1. **Calendar view** (current) — month grid, dot/marker per trained day.
2. **Timeline view** — vertical scroll through trained days in chronological
   order, each day rendered as a polaroid-style frame: photo (if uploaded)
   + date + split + any PR logged that day. Scrolling down = watching your
   own progression unfold, Partiful-style — the visual identity of an
   event/moment feed applied to training history instead of a spreadsheet
   row per set.
3. Photos are optional per day, attached the same lightweight way a PR is
   attached today (`DayForm.tsx` extends to accept an image, stored
   alongside `TrainedDay`). Don't require a photo to log a day — that
   would reintroduce the friction the whole product is designed against.

**Export & share:** a generated image/reel from the timeline (a strip of
polaroids, or a single "your last 90 days" collage over the heatmap) that
exports natively to IG/TikTok aspect ratios. This is the distribution
mechanic as much as it's a feature — every share is a small ad for the app
in a channel (progress-pic culture) that's otherwise unreachable through
paid or cold outbound. Watermark/attribute lightly (small "made with
trainlog" corner mark, not a logo takeover) so it reads as the user's own
content, not an ad unit.

## Messaging pillars
1. **Design/simplicity** — provable today (calendar-first, terminal-inspired
   themes: `zenwritten`, `phosphor`, `matrix`). "A workout log that doesn't
   look like a spreadsheet." "One tap. Not a form."
2. **Progress pics & key moments** — hold out of launch copy until the
   timeline view + photo attach ship (see product concept above); PRs can
   carry this pillar in the meantime. Once shipped: "Your gym, as a
   scrapbook, not a spreadsheet."
3. **Consistency / streaks / habit-building** — strongest pillar, most
   built (streak stat already computed in `StatsPanel.tsx` against a 3d/wk
   threshold). Lead with this at launch. "Your gym's contribution graph."
   "Did you show up? That's the whole app."

## Channels, in priority order
1. **Build-in-public on X** — start immediately, no threshold to clear.
   The terminal aesthetic is native currency for indie-hacker/design
   Twitter; a heatmap screenshot reads the same way a clean Raycast
   extension or Notion setup does to that audience.
2. **Product Hunt** — a spike, not the strategy. Hook: "The workout tracker
   for people who quit Strong/Hevy because logging felt like homework."
   Run after #1 has built some following so the first-hour votes aren't
   cold.
3. **Targeted subreddits** — r/DecidingToBeBetter, r/loseit over
   r/Fitness/r/xxfitness (those skew toward people who *like* detailed
   logging — wrong ICP). Go in as a participant answering "what app do you
   use," not a launch post. Hold until there's a retention number worth
   citing.
4. **Export-to-social loop (IG/TikTok)** — becomes live the moment the
   timeline/polaroid export ships. This is the "inspire others, share
   wins, pull friends in" channel: unlike 1-3, it's not something you push
   once, it's a standing loop that runs for free as long as people are
   using the product and proud of a streak. Sequence it right after the
   gallery ships, since it's currently the highest-leverage channel that
   doesn't exist yet.
5. **ASO / native app store presence** — not yet; there's no
   Capacitor/Expo wrapper today, this is a web app. Revisit once there's an
   installable app and the export loop is live to feed it.

## Positioning risks
- **No sync/auth, single device.** Reframe as a conversion advantage —
  "no account, open it, mark today" — rather than hide it. Use interest in
  sync as a paid-feature demand signal (email capture: "want this on your
  phone and laptop too?") rather than building it speculatively.
- **Well-funded incumbents.** Don't put a feature-comparison table in the
  copy — that's a fight on their terms. Every mention of Strong/Hevy should
  be about the feeling of quitting them, not a spec-sheet.
- **Photo/export pillar not yet built.** Don't lead launch messaging with
  it. Ship it, then bring pillar 2 forward and unlock channel 4.

## This week's actions
1. **Landing page, one screen.** Hero = heatmap screenshot. Headline: "A
   workout log that isn't a spreadsheet." CTA: "Try it now — no signup"
   (leans directly into the no-auth constraint). Copy covers pillars 1 and
   3 only.
2. **First X post.** Screenshot of the year heatmap + short GIF of marking
   today's day. Founder-voice caption: built this because every workout
   app wanted set-by-set logging like payroll; just wanted to know if I
   showed up.
3. **Email capture for sync** — one line on the landing page, instruments
   willingness-to-pay before anything is built.
4. **Hand-seed 5-10 real users**, watch day-7/day-14 return, before
   touching channels 2-3. That number — not launch-day upvotes — tells you
   if the consistency pitch is landing on a product that actually retains.
5. **Hold Product Hunt** until #1 has run 1-2 weeks and there's a
   retention number from #4 to reference in comments.
