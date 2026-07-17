# Theme Pack Authoring Guide

**Purpose:** this document lets any capable model (or human) author a new theme pack
for the Tambola Host app that is indistinguishable in quality from the reference pack
(`mythology.json`). Hand this file + the reference pack to the model, name a theme, get
a pack back.

**Read this whole file before writing a single phrase.**

---

## 0. What a theme pack actually is

A tambola host draws a number 1–90 and says something. In traditional housie the
something is a fixed British nickname — "Kelly's Eye" for 1, "two little ducks" for 22,
"two fat ladies" for 88. Those work because of three mechanics and nothing else:
rhyme, digit shape, and cultural reference.

A theme pack replaces that nickname set with 90 phrases drawn from one world
(mythology, football, history, a specific family), using the same three mechanics plus
a fourth (digit composition). The pack is **data**. The app is a renderer over it.

**The pack is the product. The app is packaging.** A mediocre pack in a beautiful app
is a dead product. A great pack read off a napkin still makes a room laugh.

---

## 1. Hard rules — violating any of these breaks the product or the law

1. **Original wording only.** No film dialogues verbatim. No song lyrics, not one line.
   No copyrighted character names or trademarked properties (Marvel, DC, Disney, club
   crests, league marks, brand names). Write *in the flavour of* a thing; never quote it.
   Public-domain and folk material (epics, scripture, mythology, historical fact) is fine.
2. **Real people:** historical figures fine. Living public figures — avoid putting words in
   their mouths, avoid anything mocking. Family members of the host — encouraged, but
   affectionate only (see §6).
3. **No money.** No phrase may reference stakes, betting, pooling, winning cash, or
   wagering. Real-money gaming is illegal in India (PROG Act 2025 / Rules 2026) and
   this app stays a social game. A phrase that jokes about "paisa lagao" is a compliance
   liability, not a joke.
4. **Family-safe by default.** The room contains a 9-year-old and a 79-year-old
   simultaneously. Traditional housie has cheeky calls (88 = "two fat ladies"); we do not.
   No body jokes, no innuendo, no digs at anyone's age/weight/marital status.
   Warmth, never mockery.
5. **The number must be audible and terminal.** Every phrase ENDS with the number,
   spoken plainly. A host is told to always call each number twice for a reason — players
   are scanning paper and half of them didn't hear the joke. The joke is a garnish; the
   number is the meal. Never bury it mid-sentence.

---

## 2. The four mechanics

Every phrase must run on at least one. Name the mechanic in the note field. If you
can't name it, the phrase is not working.

| Mechanic | How it works | Example (mythology pack) |
|---|---|---|
| **REF** — reference | The number is *genuinely* meaningful in the theme's world | 14 → Ram's fourteen years of exile |
| **SHAPE** | The digit looks like something in the theme | 88 → two damrus (the hourglass drum) |
| **SOUND** | Rhyme, pun, or homophone in the spoken language | 60 → *saath* (sixty) / *saath* (together) |
| **COMP** — composition | The digits are read apart and re-skinned | 22 → *do hans*, two swans facing each other |

**REF is the best mechanic and it is finite.** Mine it first (§4), then fall back.

---

## 3. The 30/60 rule — the most important thing in this document

**Do not try to make all 90 great. You will fail, and the failure is contagious.**

Target distribution:

- **~25–30 HERO calls** (`intensity: 3` and the strongest `2`s). These are REF calls where
  the number is load-bearing in the theme. People react audibly. These carry the pack.
- **~40 WORKING calls** (`intensity: 2`). Pleasant, thematic, mechanically sound. Nobody
  laughs; nobody notices the seam.
- **~20–25 PLAIN calls** (`intensity: 1`). Barely dressed. `"Do aur nau — number 29!"`
  **This is correct and intentional, not a gap to be filled.**

Two reasons plain calls are a feature:

1. **Pace.** Even veteran hosts are advised to pick 15–20 nicknames and mix them with
   straight number-calls so the rhythm doesn't collapse. Ninety consecutive jokes is not
   a game, it's a set, and it's exhausting for the room and the host.
2. **Contrast.** A hero call only lands because the three before it were plain. Uniform
   density flattens everything into noise.

**A model asked for "90 great phrases" will produce 60 great ones and 30 strained ones
and will not tell you which is which.** Strained phrases are worse than plain ones —
they make the host look like they're trying. So: author the heroes, author the workers,
and let the rest be honestly plain. Mark them `intensity: 1` and move on.

---

## 4. Process — do these in order

### Step 1: Mine the numeric spine (30–60 min, use web search)

Before writing anything, list every number 1–90 that carries **real, checkable weight**
in the theme. Search for it; don't rely on recall, and don't invent. This is the only step
where accuracy matters more than wit.

Mythology yielded ~28 (Trimurti=3, Pandavas=5, Saptarishi=7, Dashavatar=10,
Jyotirlinga=12, vanvas=14, Gita adhyay=18, nakshatra=27, koti devta=33, Chalisa=40,
Shakti Peeth=51, chhappan bhog=56, yogini=64, lakh yoni=84...).

Football would yield: squad numbers, 11 a side, 90 minutes (!), 45, 18-yard box, 6-yard
box, 12 yards (penalty spot), 3 points, 1966, 7 and 10 as sacred shirts...

History would yield: years, regnal counts, treaty numbers.

**Rule: if you cannot cite it, cut it.** A false REF is the worst possible phrase — one
uncle in the room knows, and he will say so, loudly, and the host loses the room.
Prefer the mildly-known true fact over the impressive-sounding invented one.

If the mine yields fewer than 15 numbers, **the theme is too thin — reject it and say
so.** Not every world is numerically loaded. Say this out loud rather than faking 90.

### Step 2: Build the cast

List 15–25 characters/entities from the theme with one *comic function* each. This is
what fills the non-REF numbers.

Mythology cast, abridged:
- Chitragupta — the accountant, keeps everyone's ledger
- Kumbhakaran — asleep, missed everything
- Narad — gossip, chain messages
- Sanjay — live commentary from a distance
- Abhimanyu — knew how to get in, not out
- Dhritarashtra — can't see what's in front of him
- Shakuni — the dice never fall straight
- Hanuman — flies, lifts mountains, forgets his own power

Notice these functions map onto *game situations*: someone dozing off, someone who
missed a number, someone one square from Full House. That's where the good non-REF
phrases come from — **the theme commenting on the room**, not the theme reciting itself.

### Step 3: Draft, then cut by half

Write 2 candidates for every hero number. Keep one. The discipline of choosing is
where quality comes from; a first draft kept is a first draft shipped.

### Step 4: Read every phrase ALOUD

Non-negotiable. Phrases are spoken, not read. A phrase that scans on screen and
stumbles in the mouth is a broken phrase. Specifically check:
- Is it under ~3 seconds? (Longer and the room drifts.)
- Does the number land clean at the end?
- Can a nervous host say it on the first try without rehearsing?

### Step 5: Verify facts

Every `REF` phrase gets re-checked against a source. Yes, again.

---

## 5. Language register

- **Roman Hinglish** for Indian themes, unless the target room says otherwise.
  Not translated-English, not pure shuddh Hindi. The way people actually talk.
- **Code-switch naturally.** *"Ekam sat — number 1, ek!"* — nobody speaks one language
  at a family gathering and phrases that do sound like a textbook.
- **A pun in Hindi beats a pun in English, always.** The room thinks in Hindi. Wordplay
  that requires mental translation isn't wordplay.
- **Short.** Traditional calls are 2–4 words for a reason. Our ceiling is ~10 words plus
  the number. If you need a clause to explain the joke, it isn't one.
- **Never explain the reference in the phrase.** Put that in `note`. Half the room gets
  it, half doesn't, and the half that does gets to feel clever — that's the whole
  social mechanic. Explaining kills it for both halves.

---

## 6. Custom / family packs (the strongest variant)

Same rules, one addition: phrases reference the actual people at the table.
`"Chachaji ka BP — number 42!"`

- **Affectionate only, and punch up or sideways, never down.** Tease the successful
  cousin, never the struggling one. Nothing about weight, marriage, fertility, income,
  exam results a kid actually failed, or anything that's a live wound.
- **The host is the editor of last resort.** The generator suggests; the host approves
  every line before the game. Build this as a mandatory review step in the UI — it is
  a safety feature, not a nicety.
- Template slots: `{name}`, `{relation}`, `{running_joke}`.

---

## 7. Schema

```jsonc
{
  "id": "mythology",              // filename-safe, unique
  "name": "Puranic",              // display name
  "locale": "hi-IN-latn",         // roman Hinglish
  "description": "...",           // one line, shown in theme picker
  "animations": {                 // theme-owned. renderer does theme.animations[call.anim]
    "trishul": "anim/myth/trishul.json",
    "default": "anim/myth/default.json"
  },
  "milestones": {                 // reactions for the six standard dividends
    "earlyFive":  { "phrase": "...", "anim": "..." },
    "topLine":    { "phrase": "...", "anim": "..." },
    "middleLine": { "phrase": "...", "anim": "..." },
    "bottomLine": { "phrase": "...", "anim": "..." },
    "corners":    { "phrase": "...", "anim": "..." },
    "fullHouse":  { "phrase": "...", "anim": "..." }
  },
  "calls": {
    "7": {
      "phrase": "Saat pheras, saat vachan — number 7, saat!",  // spoken verbatim
      "sub": "7",              // big display glyph
      "audio": "vo/myth/7.m4a",// optional; TTS fallback if absent
      "anim": "fire_ring",     // key into this theme's animations map
      "intensity": 3,          // 1 plain | 2 working | 3 hero — drives reaction size
      "mech": "REF",           // REF | SHAPE | SOUND | COMP — authoring discipline
      "note": "Seven vows of the Hindu wedding. Every married person reacts."
    }
  }
}
```

**`note` and `mech` are build-time only.** The app never reads them. They exist so the
next editor (human or model) can judge and cut fast. Strip them in a build step if the
payload ever matters; it won't.

**Every theme must define all 90 keys and all 6 milestones.** A missing key is a crash,
not a fallback.

**Animations are theme-owned by design.** The renderer stays theme-agnostic —
`theme.animations[call.anim]` — so adding a theme never touches component code.
If adding a theme requires a code change, the schema has been violated; fix the schema,
not the component.

---

## 8. QA checklist — run before shipping any pack

- [ ] All 90 keys present, all 6 milestones present
- [ ] Every `anim` value exists in this theme's `animations` map
- [ ] Every phrase ends with the number, spoken plainly
- [ ] Every phrase read aloud; none exceeds ~3 seconds
- [ ] Every `REF` verified against a source (not recall)
- [ ] Intensity distribution ≈ 25–30 threes/strong-twos, ~40 twos, ~20–25 ones
- [ ] Zero copyrighted quotes, lyrics, dialogues, brands, trademarked characters
- [ ] Zero money/stakes/betting references
- [ ] Zero body, age, marriage, or income jokes
- [ ] Read the whole pack top to bottom in one sitting — does it feel like ONE voice?
      (Models drift. Pack halves authored in different sessions sound different.
      This check catches it and nothing else will.)

---

## 9. Prompt to hand a model

> You are authoring a theme pack for a tambola/housie caller app. Read
> `THEME_PACK_GUIDE.md` and the reference pack `mythology.json` in full before writing
> anything. Theme: **[NAME]**. Target room: **[who's playing — ages, languages, context]**.
>
> Work in the order the guide specifies. Start with Step 1 — mine the numeric spine
> using web search, and show me that list *before* drafting any phrases. If the theme
> yields fewer than 15 genuine numeric references, tell me the theme is too thin
> instead of proceeding.
>
> Follow the 30/60 rule strictly. I want honestly plain `intensity: 1` calls, not
> strained ones. Do not pad. Every `REF` must be verifiable — cite it in the note.
> Output valid JSON matching the schema exactly, then run the §8 checklist against
> your own output and report every failure you find.

---

## 10. Known limits of this guide

- **It cannot give a model taste, only a rubric.** The rubric catches strained phrases
  and false facts. It does not catch "technically fine, mysteriously unfunny." A human
  who knows the room still has to cut.
- **Packs age.** Topical references rot within a year. Prefer the durable one.
- **The pack is a hypothesis until it's played.** Expect ~1/3 of any pack to die on
  contact with a real game night. That's not failure — that's the only real test there
  is. Build the edit loop before you build the second theme.
