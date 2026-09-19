# Bulan — brand guide

Everything here is already implemented in `assets/css/main.css`. This document explains
*why*, so that a proposal, a LinkedIn post or a slide deck made next year still looks like
the same company.

---

## The name

**Bulan** is "moon" in Malay and Indonesian. Pronounced *BOO-lahn*.

It was chosen for what the moon does rather than what it is: it shows up reliably, it
works through the night, and it keeps the tides predictable. Quiet infrastructure that
everything depends on and nobody thinks about until it stops. That is the association to
protect — dependable, not mystical.

> The name is provisional. If it changes, the things worth keeping are the four-verb
> spine, the transparency positioning, and the dark technical palette. Those carry the
> brand; the word is the easiest part to replace.

---

## The spine

**Build it. Prove it. Defend it. Scale it.**

Four services, four verbs, in delivery order. It is the most useful thing the brand owns
because it is simultaneously a tagline, the service taxonomy, the navigation structure and
an argument. Use it everywhere. Number them 01–04 when they appear together.

| Verb | Service | One-line promise |
|---|---|---|
| Build it | Software Development | Software engineered to be maintained by a stranger |
| Prove it | Software Testing & Quality | Independent verification with evidence, not opinions |
| Defend it | Cyber Security | Find the holes before someone less friendly does |
| Scale it | AI & Intelligent Automation | Automation where the payback is real, nowhere else |

**Positioning line:** *Software that holds under pressure.*

---

## Logo

A crescent moon inside a thin ring, with the wordmark set in the sans stack at weight 600.

- Files: `assets/img/logo.svg` (full lockup), `assets/img/favicon.svg` (mark only)
- The crescent is a circle of radius 11 with a circle of radius 13.5 subtracted, its
  centre 14.13 units to the right. Keep those proportions if it is ever redrawn.
- Minimum size: 24px for the mark, 96px wide for the lockup.
- Clear space: at least the height of the mark on every side.
- The mark alone is enough where the name is already obvious — app icons, the OG image,
  a favicon, the corner of a slide.

**Do not:** rotate it, add a gradient to the wordmark, outline it, place it on a busy
photograph, recolour the crescent to anything outside the accent range, or stretch it.

---

## Colour

One accent, used consistently. That single discipline is most of what makes the site look
designed rather than decorated.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#05070B` | Page background. Near-black, faintly blue. |
| `--ink-2` | `#080B12` | Footer |
| `--surface` | `#0C111B` | Card base |
| `--surface-2` | `#111827` | Card top of gradient, dropdowns |
| `--accent` | `#8AA9FF` | **Moonlight.** Links, CTAs, eyebrows, icons, focus rings. |
| `--accent-2` | `#B9CCFF` | Highlights, gradient tops |
| `--signal` | `#5BE9B9` | Verification and trust cues **only** — compliance chips, evidence lists, the success state. Never decorative. |
| `--warn` | `#FFC46B` | Placeholder markers and caution notices |
| `--text` | `#E9EEF8` | Headings, emphasis |
| `--text-2` | `#B4C0D4` | Body copy |
| `--muted` | `#8492AA` | Secondary copy |
| `--faint` | `#5E6B80` | Metadata, labels |

**Why blue-violet and not the usual security lime or teal.** Every second cyber security
and dev-tools brand reaches for acid green. Moonlight blue is calmer, reads as precision
rather than alarm, and is coherent with the name. The mint `--signal` exists so that trust
cues have their own voice without introducing a second brand colour.

**Print and light backgrounds:** on white, use `#10151F` for text and `#4A6BE0` for the
accent — `#8AA9FF` does not have enough contrast on white. The pro-forma document already
does this.

---

## Typography

No web fonts. The stack resolves to Inter Tight, Inter, SF Pro Display or Segoe UI
Variable, all of which are already on most devices.

| Role | Setting |
|---|---|
| H1 | `clamp(2.5rem, 6.4vw, 4.6rem)`, weight 560, tracking −0.042em |
| H2 | `clamp(1.95rem, 4.1vw, 3.1rem)`, weight 560, tracking −0.036em |
| H3 | `clamp(1.25rem, 2.1vw, 1.6rem)`, weight 560 |
| Lead | `clamp(1.0625rem, 1.65vw, 1.3125rem)`, `--text-2` |
| Body | 16px / 1.65 |
| Eyebrow | mono, 11px, tracking .16em, uppercase, with a lit dot |
| Prices, figures, labels | mono, tabular figures |

Two rules that carry most of the look: **tight negative tracking on large headings**, and
**mono for anything numeric or label-like**. The second is what makes it read as
engineering rather than agency.

---

## Voice

Write like a competent engineer explaining something to a peer who is paying for it.

**Do**
- Lead with the specific. "A compact web application starts around R185 000" beats
  "affordable, tailored solutions".
- State the trade-off. Every recommendation has a cost; naming it is what makes the
  recommendation credible.
- Say the inconvenient thing. "We will talk you out of the wrong AI project." "No, and be
  wary of anyone who says yes." These lines do more selling than any adjective.
- Use British/South African spelling: *organisation, prioritised, licence* (noun),
  *analyse*, *defence*.
- Write rand as **R185 000** — R, no space before the digits, thin space between
  thousands. Always state whether VAT is included.
- Use contractions sparingly. The register is measured, not chatty.

**Do not**
- "Passionate", "cutting-edge", "world-class", "leverage", "synergy", "digital journey",
  "solutions provider", "we are excited to announce".
- Claim scale you do not have. Never "our team of experts" when there are two of you.
- Use exclamation marks in body copy.
- Promise anything not in the contract. Every commitment on the site is one you can be
  held to — keep it that way.

**The test:** would you be comfortable if a prospective client quoted this sentence back
to you in a meeting and asked you to justify it?

---

## The things that must not drift

1. **One accent colour.**
2. **Published prices.** The entire trust argument rests on it.
3. **No fabricated proof** — no invented logos, testimonials, counts or years.
4. **No implied certifications.** Name only what is actually held.
5. **The four verbs, in order.**
6. **Generous space.** The layout breathes because the sections are large and the copy is
   narrow. Cramming more in is how this starts to look like everyone else.
