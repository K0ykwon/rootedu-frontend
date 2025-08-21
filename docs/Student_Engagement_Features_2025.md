# Student Engagement Feature Ideation (2025)

## Objective
- Increase middle/high school student engagement, retention, and virality using research-backed gamification, social UGC, and creator/ community dynamics.

## Research-backed insights (brief)
- YouTube, TikTok, Instagram are teens’ daily default; 1/3 are “almost constantly” online (Pew 2024). Short, social, instantly rewarding flows win.
- TikTok 2025: co-create with communities/creators; harness Trend Signals (Brand Fusion, Identity Osmosis, Creative Catalysts) for sustainable reach.
- Duolingo: mascot pushes (+5% DAU), badges (+116% referrals), leaderboards, streaks, streak freeze/wagers→ retention up.
- Study Together: goal set → live rooms (cam/screen optional) → time tracking → leaderboards; social accountability works.

References: [Pew 2024](https://www.pewresearch.org/internet/2024/12/12/teens-social-media-and-technology-2024/), [TikTok Trend Report 2025](https://newsroom.tiktok.com/en-us/tiktok-whats-next-2025-trend-report-us), [Duolingo gamification](https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo/), [Study Together](https://www.studytogether.com/discord)

---

## Core feature set (tailored to current codebase)
1) Live Study Rooms + Pomodoro + Time Tracking
- Real-time rooms (camera/screen optional), 25/50 Pomodoro, mini room leaderboard.
- Tie-in: social accountability; increases session length.
- Integrations: new `app/study/rooms/`, `app/api/study/sessions` (start/stop/heartbeat), `lib/redis.ts` for session counters.

2) Streaks + Freeze (Weekend Pass) + Daily/Weekly Quests
- Daily/weekly missions; claimable rewards (EXP/badges); streak insurance.
- Integrations: extend `components/study/DailyChallengeCard.tsx` with server-bound state; `app/api/streak`, `app/api/quests`.

3) UGC Share Cards (Vertical) for TikTok/IG
- Auto-generate shareable images from study proofs with stickers/frames/hashtags.
- Integrations: `components/study/StudyProofCard.tsx` add Share; `app/api/share-card/[proofId]` using Satori/Resvg or Canvas.

4) Emoji Cheer Economy + Weekly Highlights
- Earn “Chips” via study time/quests; spend on premium emojis; weekly "Cheer King/Proof King" badges.
- Integrations: extend cheers in `StudyProofCard.tsx`; weekly cron to compute highlights.

5) Seasonal Leagues + School/Friends Leaderboards
- Season-based rewards, school verification (code), friend leagues.
- Integrations: extend `components/study/StudyRankingCard.tsx` with scope tabs; `leaderboard:{scope,period}` keys in Redis.

6) AI Study Coach (Prompt Packs)
- One-tap: Make today’s plan / Split exam scope / Retrospective.
- Integrations: `components/ui/AIChat.tsx` preset buttons & system prompts; optional `/app/api/ai/*`.

7) Creator Collab Challenges (Brand Fusion)
- Co-host challenge with student creators; official hashtag & templates; top entries featured.
- Integrations: `app/community/page.tsx` pinned challenge posts + submission tag.

8) Thematic Events (Exam D-100 / New Semester / Vacation Sprint)
- Limited-time badges, profile frames, and milestones.
- Integrations: event config + OG frames in share cards.

9) Profile Identity & Frames (Identity Osmosis)
- School/grade/goal badges; collectible frames from events/seasons.
- Integrations: profile settings + frame asset library.

10) PWA Push + Mascot Notifications
- Friendly mascot tone for check-in, quest deadlines, streak warnings.
- Integrations: PWA service worker + notification scheduling.

---

## Additional high-potential ideas
- Gamification
  - Study Pet (Tamagotchi): pet grows with study minutes; neglect shrinks. Metric: return rate.
  - Boss Battles (Co-op Pomodoro): clear phases by completing cycles as a team. Metric: cycles/user.
  - House/Clubs Points: assign houses; weekly house cup. Metric: team retention.
  - Skill Trees by Subject: visible path completion. Metric: path progression.

- Social/UGC
  - Streak Rescue by Friends: friend can “save” one missed day per month. Metric: streak recovery rate.
  - Weekly Study Story: auto compile your week into a vertical reel (minutes, badges, top proof). Metric: external shares.
  - Topic-of-the-Day Micro-Challenges: 10–20 min tasks per subject with tag. Metric: participation.
  - Creator Templates: ready-made proof templates (layout, stickers). Metric: creation rate.

- AI Learning
  - Photo-to-Flashcards/Quiz: snap textbook page → OCR → quiz/flashcards. Metric: card generation, practice sessions.
  - AI Micro-Explanations: 60-second explanations for a stuck concept. Metric: completion.
  - Plan-Do-Review Loop: AI nudges to review goals after sessions. Metric: plan adherence.

- Community/Rooms
  - Peer Matching by Schedule/Goal: match co-study buddies. Metric: matches leading to sessions.
  - Focus Rush Events (time-boxed): global synchronized study hour. Metric: concurrent sessions.
  - Wellness Micro-Breaks: guided stretches/breathing between cycles. Metric: break compliance.

- Growth
  - Invite Quests: unlock frames/badges for successful invites. Metric: k-factor.
  - School Landing Pages: public leaderboard per school. Metric: signups by school.
  - Daily Polls/This-or-That in Community: quick interactions. Metric: poll votes DAU lift.

---

## Top priorities (ICE estimates; higher first)
- Streaks + Freeze + Quests — Impact 9, Confidence 8, Effort 5
- UGC Share Cards — Impact 8, Confidence 8, Effort 4
- Live Study Rooms + Tracking — Impact 9, Confidence 7, Effort 7
- Seasonal/School/Friends Leaderboards — Impact 7, Confidence 7, Effort 5
- AI Study Coach (Prompt Packs) — Impact 7, Confidence 7, Effort 3
- Emoji Cheer Economy — Impact 6, Confidence 7, Effort 4

---

## 4-week MVP (lean)
- Week 1: Study sessions API (start/stop/heartbeat), simple Rooms UI, aggregate minutes to Redis.
- Week 2: Daily/Weekly Quests + Streak/Freeze; bind `DailyChallengeCard.tsx` to server; claim rewards.
- Week 3: Share Card API (Satori/Resvg) + Share button in `StudyProofCard.tsx`; basic frames/stickers.
- Week 4: Leaderboard scopes (friends/school/season) in `StudyRankingCard.tsx`; invite links and basic rewards.

Success metrics: DAU, 7d retention, sessions per user, study minutes/day, quest participation, proofs posted, external shares, invites converted.

---

## Integration points in current repo
- `components/study/DailyChallengeCard.tsx`: fetch quests, show reward claim/freeze.
- `components/study/StudyProofCard.tsx`: add Share button → `/api/share-card/{id}`.
- `components/study/StudyRankingCard.tsx`: tabs for scope (All/Friends/School/Season).
- `components/ui/AIChat.tsx`: preset prompts for plan/split/review.
- `app/community/page.tsx`: pinned challenges; creation templates.
- `lib/redis.ts`: session counters, streaks, leaderboards.
- New API: `app/api/study/sessions`, `app/api/quests`, `app/api/streak`, `app/api/share-card/[proofId]`.

---

## Minimal data model (Redis-first)
- `user:{id}:streak` → `{ count, lastDate, freezes }`
- `study:session:{id}` → `{ userId, roomId, start, end, total }`
- `quests:{date|type}` and `user:{id}:quests` → `{ progress, claimed }`
- `proof:{id}` → `{ userId, desc, tags, minutes, likes[], cheers[], createdAt }`
- `leaderboard:{scope}:{period}` → sorted set by minutes; metadata: streak, level
- `share:frame:{id}` → frame defs/assets

---

## Measurement
- Engagement: sessions/user/day, average minutes/session, Pomodoro cycles, quest completion, streak kept.
- Social: proofs/day, cheers/post, comments, shares out, creator challenge entries.
- Retention: D1/D7 retention, freeze usage, streak rescues, revisit via push.
- Growth: invites sent→joined, school signups, CTR from shared cards.

---

## Next steps
1) Approve Top 2 for MVP: (a) Streaks+Quests, (b) UGC Share Cards.
2) Lock API spec and minimal data schema.
3) Implement Week 1–2 and ship behind a feature flag.
4) Prepare creator challenge + frames for Week 3–4.

