---
name: dpdp-form-auditor-design
description: Complete UI/UX design skill for the DPDP Form Auditor - a rule-based, in-browser tool that audits web forms for personal-data collection, flags excess fields, and drafts a consent notice. Covers brief analysis, theme tokens, sizing, layout, components, states, copy, HCI laws, accessibility, export and judge-test checklist. Light theme.
---

# DPDP Form Auditor: Design Skill

Use this file as the single source of truth for every visual and interaction decision. If a choice is not covered here, decide using the principles in section 2 and the HCI laws in section 12.

---

## 1. Problem analysis (what the design must serve)

### 1.1 Who uses it
| User | Context | What they need in under 30 seconds |
|---|---|---|
| Website owner / small business (primary) | Has a signup, contact or checkout form; worried about the DPDP Act | "Which of my fields are a problem, and what do I put in the notice?" |
| Developer / freelancer | Pastes raw HTML from a client site | Fast paste, readable field table, copyable notice |
| Hackathon judge (critical) | Pastes a messy form with odd names like `mob_no`, `usr_dob`, `aadhaar_num` | Immediately sees correct classification, sensible excess flags, and that nothing leaves the browser |

### 1.2 Primary job of the interface
Turn a pasted form + a one-line purpose into **three outputs**: a classified field table, a draft consent notice, and (stretch) a compliance score. Everything else is secondary.

### 1.3 Requirement to UI mapping
| Requirement | UI answer |
|---|---|
| Paste HTML **or** list of field names | One input area with a mode switch: `Paste HTML` / `List field names` |
| One-line purpose | Required single-line input with quick-pick chips (newsletter signup, contact us, job application, e-commerce checkout, account registration, event registration, feedback survey) |
| Classify as personal / not, group into categories | Category chip on every row, grouped view toggle |
| Flag excess collection | Red "Excess" verdict with plain-language reason; row highlighted with a redline treatment |
| Draft consent notice (data, purpose, withdrawal) | Notice tab, three clearly separated sections, a permanent **Draft** banner |
| Summary table: field, category, needed or not, reason | The main results table, exactly four columns plus a fifth optional "Matched by" column |
| Rule-based, in browser, nothing sent | Persistent trust badge, no network calls, no third-party fonts or scripts |
| Stretch: score 0-100 with explanation | Score tab with gauge plus a "why this score" list |
| Stretch: Hindi / Marathi / English | Language segmented control on the Notice tab (and report) |
| Stretch: PDF / text download | Export menu: `Download .txt`, `Print / Save as PDF`, `Copy notice` |
| Trap: exact-name matching only | Show a "Matched by" hint (name, type, autocomplete, label, pattern) so judges see fuzzy matching working |
| Trap: sounds like legal advice | Draft banner, footer disclaimer, softer verbs ("should consider") |

### 1.4 Design thesis
**"A redlined document."** The tool behaves like a careful compliance reviewer marking up a form. The memorable element is the **redline view**: each field row reads like an annotated line of the form, and excess fields get a red wavy underline on the field name plus a margin note. Everything else stays calm, white and quiet. Spend the boldness there and nowhere else.

---

## 2. Design principles

1. **Trust first.** The user is pasting sensitive form code. Show "Runs in your browser. Nothing is uploaded." in the header at all times.
2. **Verdict before detail.** Verdict (Needed / Excess / Review) is the first thing the eye lands on in each row; reason second.
3. **Never colour alone.** Every status and category has an icon and a text label as well as a colour.
4. **Plain language over legal language.** The owner is not a lawyer. Reasons are one sentence, active voice.
5. **Draft, not advice.** Every generated artefact is labelled draft and ends with a disclaimer.
6. **One screen, one job.** Input on the left, results on the right (desktop). No modal flows, no wizards.
7. **Instant feedback.** Analysis is local; render results within 100 ms of clicking Analyse. No fake spinners.
8. **Quiet chrome, loud findings.** Borders, shadows and decoration are minimal so red and amber findings stand out.

### Avoid (generic tells)
- Cream background with terracotta accent, near-black with acid-green accent
- Identical rounded cards with the same soft grey shadow everywhere
- ALL-CAPS tracked eyebrow labels above every heading
- Gradient wash backgrounds, glassmorphism, hero illustrations
- Numbered markers (01/02/03) unless the content is truly sequential
- Fade-and-slide entrance on every section

---

## 3. Theme: light, "Ink on Paper"

### 3.1 Color tokens
```css
:root {
  /* Surfaces */
  --paper:        #F6F8FB;  /* app background */
  --surface:      #FFFFFF;  /* panels, table, inputs */
  --surface-alt:  #EEF2F7;  /* table header, code well, hover */
  --line:         #D8DFEA;  /* borders, dividers */
  --line-strong:  #B7C2D3;  /* input borders, focus-adjacent */

  /* Text (all pass WCAG AA on --surface) */
  --ink:          #14213D;  /* headings, body (15.7:1) */
  --ink-2:        #3D4A63;  /* secondary text (9:1) */
  --ink-3:        #5A6780;  /* hints, meta (5.6:1) */

  /* Primary action */
  --primary:      #2B3A9E;  /* buttons, links, active tab (8.6:1 on white) */
  --primary-hover:#222F82;
  --primary-tint: #E8EBFA;
  --focus:        #1D4ED8;  /* 3px focus ring */

  /* Verdicts */
  --needed:       #0F7A4F;  --needed-bg:  #E3F4EB;
  --excess:       #B3261E;  --excess-bg:  #FCE9E7;
  --review:       #8A5300;  --review-bg:  #FFF0D1;
  --neutral:      #5A6780;  --neutral-bg: #EAEEF4;  /* "Not personal data" */

  /* Score bands */
  --score-strong: #0F7A4F;  /* 85-100 */
  --score-fair:   #2B6CB0;  /* 65-84  */
  --score-weak:   #8A5300;  /* 40-64  */
  --score-poor:   #B3261E;  /* 0-39   */
}
```
Rules: backgrounds are never pure `#000`; text is never pure black. Red is reserved for **Excess** and **Poor score** only; never use it for decoration or form validation of unrelated things.

### 3.2 Category chips
Each category = tinted background + dark text + glyph + label. Sensitive categories get a small "Sensitive" flag icon.

| Category | Glyph | Text | Background | Sensitive |
|---|---|---|---|---|
| Identity | person | `#4B2E91` | `#EFE9FB` | no |
| Contact | at-sign / phone | `#0B5F7A` | `#E0F2F8` | no |
| Government ID | id-card | `#8A2D0B` | `#FBE9DF` | yes |
| Financial | rupee | `#7A3B00` | `#FBEBD3` | yes |
| Health | heart-pulse | `#9D174D` | `#FCE7F0` | yes |
| Location | map-pin | `#3F6212` | `#EAF3D9` | no |
| Children's data | child | `#9A3412` | `#FDE8D8` | yes |
| Demographic / Personal traits | users | `#1E4E8C` | `#E3EDFA` | yes (religion, caste, etc.) |
| Credentials | key | `#374151` | `#E9ECF1` | yes |
| Technical / Device | cpu | `#374151` | `#EEF1F5` | no |
| Not personal data | minus-circle | `#5A6780` | `#EAEEF4` | n/a |

### 3.3 Verdict badges
| Verdict | Icon | Label | Colors |
|---|---|---|---|
| Needed | check-circle | Needed | `--needed` on `--needed-bg` |
| Excess | alert-triangle | Excess | `--excess` on `--excess-bg` |
| Review | help-circle | Review | `--review` on `--review-bg` |
| Not personal | minus-circle | Not personal | `--neutral` on `--neutral-bg` |

"Review" is for borderline fields (e.g. phone on a newsletter signup is optional-at-best). It prevents false certainty and makes the tool more credible.

### 3.4 Redline treatment (signature element)
- Excess row: 3px left border `--excess`, row background `--excess-bg` at 40% opacity.
- Field name in the row: `text-decoration: underline wavy var(--excess); text-underline-offset: 4px;`
- Needed row: no decoration (quiet).
- Review row: 3px left border `--review`, no background tint.
- Do not animate the redline; it appears with the results.

---

## 4. Typography

### 4.1 Fonts (privacy-safe)
This is a privacy tool: **do not load Google Fonts or any CDN asset.** Use system stacks, or self-host and inline woff2 (IBM Plex Sans + Plex Mono recommended if you want a custom look).

```css
--font-ui:   "IBM Plex Sans", "Inter", system-ui, -apple-system, "Segoe UI", Roboto,
             "Noto Sans", "Noto Sans Devanagari", "Nirmala UI", "Mangal", sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```
- UI and headings: `--font-ui`. One family only, hierarchy through size and weight.
- Field names, HTML snippets, attribute hints: `--font-mono` (they are code identifiers, so mono is justified).
- Devanagari (Hindi/Marathi): ensure the fallback includes Noto Sans Devanagari / Nirmala UI / Mangal; set `line-height` 1.7 for `:lang(hi)` and `:lang(mr)` because matras need room.

### 4.2 Type scale (base 16px, ratio about 1.2)
| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-xs` | 12px / 16px | 500 | Meta, chip text, table footnotes |
| `--text-sm` | 14px / 20px | 400-500 | Table cells, hints, buttons (secondary) |
| `--text-md` | 16px / 24px | 400 | Body, inputs, notice text |
| `--text-lg` | 18px / 28px | 600 | Panel titles, notice section headings |
| `--text-xl` | 22px / 30px | 600 | Page title (H1) |
| `--text-2xl` | 32px / 40px | 600 | Score number only |

Rules:
- Sentence case everywhere. No ALL-CAPS labels. Labels sit directly above or beside their controls, never as decorative eyebrows.
- Body line length 60-75 characters (notice text container `max-width: 68ch`).
- Minimum text size 12px, and only for chips and meta; reading text is 14px or larger.
- Numerals: `font-variant-numeric: tabular-nums` for scores and counts.

---

## 5. Sizing, spacing and shape

### 5.1 Spacing scale (4px grid)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Use only these. Inside controls use 8/12; between components 16/24; between major regions 32/48.

### 5.2 Shape and elevation
| Element | Radius | Border | Shadow |
|---|---|---|---|
| Panels (input, results) | 12px | 1px `--line` | none |
| Inputs, buttons | 8px | 1px `--line-strong` | none |
| Chips, badges | 999px (pill) | none | none |
| Tooltips, menus | 8px | 1px `--line` | `0 6px 20px rgba(20,33,61,.12)` (the **only** shadow in the app) |
| Table | 12px outer, 0 inner | 1px `--line` rows | none |

Hierarchy comes from borders and background tone, not shadows. Use one radius per element class, not one radius for everything.

### 5.3 Control sizes
| Control | Desktop | Mobile |
|---|---|---|
| Button (primary/secondary) | height 44px, padding 0 20px | height 48px, full width where primary |
| Icon button | 40 x 40 (hit area 44 x 44) | 44 x 44 |
| Text input | height 44px | 48px |
| Textarea (HTML input) | min-height 260px, resize vertical | min-height 200px |
| Chip (purpose quick-pick) | height 32px, padding 0 12px | height 36px |
| Badge (verdict/category) | height 24px, padding 0 8px | same |
| Tab | height 44px | 44px, horizontally scrollable if needed |
| Table row | min-height 56px | collapses to card (see 7.4) |

Touch targets are never smaller than 44 x 44 px with at least 8px between neighbours (Fitts's law).

### 5.4 Layout grid and breakpoints
| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, 16px page padding, sticky bottom action bar |
| Tablet | 640-1023px | Single column, 24px padding, input panel above results |
| Desktop | 1024-1439px | Two columns: input 400px fixed, results fluid; 24px gutter |
| Wide | >= 1440px | Same two columns, content max-width 1280px centred |

Page container: `max-width: 1280px; margin: 0 auto; padding: 0 24px`.

---

## 6. Page arrangement (wireframes)

### 6.1 Desktop (>= 1024px)
```
+--------------------------------------------------------------------------------+
| [logo] DPDP Form Auditor        [shield] Runs in your browser. Nothing uploaded |  56px header
|                                  [Load sample] [Export v]  [EN | हिं | मरा]     |
+--------------------------------------------------------------------------------+
| INPUT PANEL (400px, sticky)   | RESULTS (fluid)                                |
|                               |                                                |
| Form to audit                 |  [Fields]  [Consent notice]  [Score]           |  tabs
| ( Paste HTML | List names )   |  --------------------------------------------  |
| +---------------------------+ |  Summary strip:                                |
| |                           | |  9 fields · 6 personal · 3 excess · 1 review   |
| |  <textarea monospace>     | |                                                |
| |                           | |  [Table: Field | Category | Verdict | Reason ] |
| +---------------------------+ |  row (redline for excess)                      |
|                               |  row                                           |
| Purpose of this form          |  row                                           |
| [ newsletter signup        ]  |                                                |
| (chips: Newsletter, Contact,  |  Footer: Draft analysis, not legal advice.     |
|  Job application, Checkout…)  |                                                |
|                               |                                                |
| [ Analyse form ] (primary)    |                                                |
| [ Clear ]                     |                                                |
+--------------------------------------------------------------------------------+
| Footer: Draft output for guidance only. Not legal advice. Rule-based, local.   |
+--------------------------------------------------------------------------------+
```

### 6.2 Mobile (< 640px)
```
+--------------------------+
| DPDP Form Auditor  [EN v]|
| [shield] Runs in browser |
+--------------------------+
| Form to audit            |
| (Paste HTML | List names)|
| [ textarea ]             |
| Purpose [__________]     |
| chips (scroll)           |
+--------------------------+
| (results appear below,   |
|  auto-scroll to them)    |
| Tabs: Fields|Notice|Score|
| field cards…             |
+--------------------------+
| [Analyse form]  [Export] |  <- sticky bottom bar, 64px + safe-area
+--------------------------+
```

### 6.3 Alignment
Left-aligned everywhere. Numbers in the table (score, counts) are right-aligned or tabular. Nothing centred except the empty state illustration and the score gauge.

### 6.4 Reading order and focus order
Header → mode switch → input → purpose → chips → Analyse → tabs → table → export. Tab order must match visual order.

---

## 7. Components

### 7.1 Header
- Height 56px, background `--surface`, bottom border `--line`.
- Left: product name (`--text-lg`, weight 600). No tagline.
- Right: **Trust badge** (shield icon + "Runs in your browser. Nothing is uploaded."), `--text-sm`, background `--needed-bg`, text `--needed`. Tooltip: "All checks use rules in this page. Your form is never sent anywhere."
- Language control (EN / हिन्दी / मराठी) applies to the notice and report. UI chrome can stay in English unless time allows.

### 7.2 Input panel
1. **Mode switch** (segmented control, 2 options): `Paste HTML` | `List field names`. Default: Paste HTML.
2. **Textarea**: monospace 14px, placeholder shows a realistic example, never lorem ipsum:
   - HTML mode: `<form>\n  <input name="usr_nm" type="text">\n  <input name="mob_no" type="tel">\n  …`
   - List mode: `One per line or comma separated:\nfull_name, mob_no, dob, email_id`
3. **Purpose input**: label "What is this form for?" with hint "One line, for example: newsletter signup".
4. **Purpose chips**: Newsletter signup · Contact us · Job application · Account registration · Online checkout · Event registration · Feedback survey. Clicking fills the input (does not submit).
5. **Actions**: `Analyse form` (primary), `Clear` (text button), `Load sample messy form` (secondary, in header or under textarea).
6. **Validation** (inline, below the field, red text with icon, `role="alert"`):
   - Empty form: "Paste your form HTML or list some field names."
   - Empty purpose: "Add a one-line purpose so we can judge what is necessary."
   - No fields found: "We could not find any inputs. Check that you pasted the form's HTML, or switch to List field names."
7. Do not block analysis for an unrecognised purpose; fall back to a generic "minimal data" ruleset and show a Review note: "We did not recognise this purpose, so we used general rules."

### 7.3 Results header strip (summary at a glance)
A single line of four counted tokens, each with icon and text: `9 fields` · `6 personal data` · `3 excess` · `1 to review`. Clicking a token filters the table. Include a "Show all" reset.

### 7.4 Fields table (main output)
Columns (desktop):
| Column | Width | Content |
|---|---|---|
| Field | 22% | Mono field name (`mob_no`), below it in `--ink-3` the input type/label found |
| Category | 18% | Category chip (+ sensitive flag) |
| Needed? | 14% | Verdict badge |
| Reason | 46% | One sentence plain language; tertiary line "Matched by: name pattern `mob`, type `tel`" in `--text-xs` `--ink-3` |

Behaviour:
- Header row sticky, `--surface-alt` background, `--text-sm` weight 600, sentence case.
- Sort default: Excess → Review → Needed → Not personal, so problems come first. Sort toggle available.
- Toggle: `Flat list` / `Group by category`.
- Row hover: `--surface-alt`. Row is not clickable; no hidden interactions.
- Excess rows use the redline treatment (3.4).
- Mobile (< 640px): each row becomes a stacked card: field name + verdict badge on top line, category chip below, reason below that. Same sort order.

Reason copy pattern (sentence, active, specific):
- Excess: "A newsletter only needs an email address. Collecting date of birth is not necessary for this purpose."
- Needed: "Needed to send the newsletter to this person."
- Review: "Optional at best. Collect only if you actually send SMS updates, and say so in the notice."
- Not personal: "A technical field with no link to a person (CSRF token)."

### 7.5 Consent notice tab
- Top banner (always visible, amber): icon + "Draft notice. Review with a qualified professional before publishing." (`--review-bg`, `--review` text.)
- Language segmented control: English | हिन्दी | मराठी (also reachable from header).
- Notice card: white panel, `max-width: 68ch`, 24px padding, `--text-md`.
- Fixed structure with `--text-lg` headings:
  1. **What we collect** (bullet list of needed fields grouped by category, in plain words: "Email address")
  2. **Why we collect it** (the stated purpose, one sentence)
  3. **How to withdraw consent** (contact placeholder `[your contact email]`, "Email us at … or use the unsubscribe link. You can withdraw consent at any time; it will not affect past processing.")
  4. Optional line items: retention period placeholder `[period]`, grievance contact placeholder, children's data note if flagged.
- Placeholders in square brackets, highlighted with `--review-bg` so the owner sees what to fill.
- Excluded excess fields are **not** listed; a note above the card says "Excess fields are left out. Remove them from your form, or add a justification before listing them."
- Actions: `Copy notice` (primary), `Download .txt`. Copy shows inline confirmation "Copied" for 2s with `aria-live="polite"`.

### 7.6 Score tab (stretch)
- Left: **gauge**, a simple 180-degree arc SVG, 160px tall on desktop, number in `--text-2xl` tabular, band label under it ("Fair"). Colour by band (3.1). Include the number as text for screen readers.
- Right: **"Why this score"** list. Each line = delta + reason, e.g. `-15  Collects date of birth for a newsletter` / `-10  Collects Aadhaar number without a clear need` / `+10  Purpose is stated`.
- Below: "How to improve" short list of the top 3 actions (remove X, add withdrawal contact, state retention).
- Footnote: "Score is a rule-based guide for this form only. It is not a legal assessment."
- Suggested scoring (keep consistent with the explanation list): start 100; minus 12 per excess field (minus 20 if sensitive category); minus 5 per review field; minus 15 if children's data and no age/parental consent mention; minus 10 if Government ID collected; clamp 0-100.

### 7.7 Export menu
- Button `Export` with dropdown: `Download report (.txt)`, `Print / Save as PDF`, `Copy notice`.
- Print uses `@media print`: hide header controls, input panel and tabs; show Title, purpose, summary table, notice, score, and the draft disclaimer on each page footer. White background, black text, borders retained, badges keep text labels (colour is not required).
- File name: `dpdp-audit-<purpose-slug>-<YYYY-MM-DD>.txt`.

### 7.8 Empty state (before first analysis)
Results area shows a quiet panel: heading "Paste a form to begin", one sentence "We list every field, group it by type of personal data, and flag anything you do not need for your purpose.", and the `Load sample messy form` button. No illustration needed.

### 7.9 Tooltips and help
- Info icon next to "Review" explains: "Borderline: may be justified depending on how you use it."
- Info icon next to Sensitive flag: "Higher-risk data. Handle with extra care and state the purpose clearly."
- Tooltips open on hover **and** focus, close on Esc, never carry essential info alone.

---

## 8. Interaction and states

| State | Behaviour |
|---|---|
| Default | Input panel focused on the textarea on load |
| Analysing | Instant. If > 150ms (huge HTML), button shows "Analysing…" and is disabled |
| Success | Results fade in once (150ms opacity only), focus moves to results heading, `aria-live` announces "Analysis complete: 3 excess fields" |
| Partial recognition | Unknown field names show category "Review" with reason "We could not tell what this field collects. Check it manually." (Never silently drop fields.) |
| Error | Inline message adjacent to the problem (7.2); never a blocking alert dialog |
| Edit after analysing | Results are marked "Out of date" (muted, small badge) until Analyse is pressed again; no auto re-run on every keystroke |
| Language switch | Notice re-renders in place; scroll position preserved |
| Copy/Download | Inline confirmation near the button |

Motion: one allowed non-user-triggered motion (results fade, 150ms). Everything else is response to user action (tab switch, dropdown). Respect `prefers-reduced-motion`: remove the fade.

---

## 9. Voice and copy rules

- Sentence case, plain verbs, active voice. Button labels say what happens: `Analyse form`, `Copy notice`, `Download report`. Keep action names consistent through the flow.
- Say "personal data", "consent notice", "withdraw consent". Avoid heavy legal citations in the UI.
- Soft verbs for judgement: "may not be necessary", "consider removing". Avoid "illegal", "violation", "non-compliant" in field reasons.
- Every generated page/section carries: **"Draft for guidance only. This is not legal advice."**
- Hindi and Marathi must be natural, not word-for-word: use the common terms "सहमति" (consent), "वैयक्तिक माहिती / व्यक्तिगत जानकारी" (personal data), and keep email/phone as-is. Have the notice template stored as full sentences per language, not machine-assembled fragments.
- Empty and error text explains what to do next.

---

## 10. Accessibility (quality floor)

- Contrast: text >= 4.5:1, large text and UI borders >= 3:1 (tokens above comply).
- Visible focus: 3px `--focus` outline with 2px offset on every interactive element; never remove outlines.
- Full keyboard use: tabs follow WAI-ARIA tabs pattern (`role="tablist"`, arrow keys, `aria-selected`); dropdown closes on Esc; segmented controls use radio semantics.
- Table uses real `<table>`, `<th scope>`, caption "Fields found in your form and whether each is needed". Mobile cards keep the same reading order.
- Status never conveyed by colour only (icon + text on every badge).
- Language: set `lang="hi"` / `lang="mr"` on the notice container when active.
- `aria-live="polite"` region for analysis result, copy confirmations.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (light only for this build; do not auto-switch to dark, but make sure forced-colours mode still shows borders).
- Zoom: layout holds at 200% zoom without horizontal scroll.

---

## 11. Performance and privacy rules (design-visible)

- Single self-contained HTML file; no external requests (fonts, scripts, analytics, icons). Inline SVG icons.
- No `localStorage` of pasted content by default. If you add "remember last form", make it opt-in and visible.
- Paste handling: never evaluate or inject pasted HTML. Parse with `DOMParser` into an inert document; render field names as text via `textContent`, not `innerHTML`.
- Header trust badge links to a short "How this works" popover listing: runs locally, rule-based dictionary, no network calls.

---

## 12. HCI laws applied

| Law | Where it shows up |
|---|---|
| **Fitts's law** | 44px minimum targets, primary action large, sticky bottom Analyse bar on mobile |
| **Hick's law** | Only two input modes, one purpose line, three result tabs, one export menu; no settings pages |
| **Miller's law** | Summary strip has 4 tokens; score reasons capped to the top 6 with "Show all" |
| **Jakob's law** | Table, tabs, segmented controls and dropdown behave like familiar web tools |
| **Von Restorff effect** | Only Excess and Review rows are visually distinct; everything else stays quiet |
| **Gestalt proximity / similarity** | Verdict and category chips share one shape; reasons sit beside their field |
| **Law of common region** | Input, results and notice live in separate bordered panels |
| **Doherty threshold** | Results under 400ms, ideally instant; no artificial loaders |
| **Tesler's law** | The complexity (keyword matching, purpose rules) is absorbed by the tool; user only supplies form + purpose |
| **Postel's law** | Accept messy HTML, partial snippets, comma or line separated names, mixed case, `mob_no` / `userPhone` / `contact-number` |
| **Aesthetic-usability effect** | Clean light theme, consistent spacing, restrained palette increase perceived trust |
| **Serial position effect** | Excess findings first in the table; Analyse first in the input flow; Export last |
| **Peak-end rule** | Peak = the redline reveal; end = a clean copy/download with confirmation |
| **Zeigarnik / progress** | Out-of-date badge shows that results need re-running |
| **Visibility of system status** | Trust badge, "Out of date" tag, announced results, copy confirmation |
| **Error prevention** | Purpose chips, placeholders in notice highlighted, clear empty validation |

---

## 13. Rule engine UX hooks (what the UI must expose from the logic)

For the design to show correct and credible output, the analysis layer should return, per field:
```js
{
  name: "mob_no",        // raw name or id
  label: "Mobile",       // label text if found
  type: "tel",           // input type
  autocomplete: "tel",   // if present
  category: "contact",   // one of the categories in 3.2
  sensitive: false,
  verdict: "needed|excess|review|not-personal",
  reason: "…",           // one sentence, already in plain language
  matchedBy: ["name:mob", "type:tel"]  // shown as the "Matched by" hint
}
```
Matching order: `autocomplete` > `type` > normalised name tokens (split on `_ - camelCase`, lowercase, strip digits and prefixes like `usr`, `user`, `txt`, `input`) > label text > placeholder. Show the winning signal in "Matched by" so judges can see odd names (`mob_no`, `usr_ph`, `dobDate`, `aadhar_no`) handled.

Purpose to needed-fields map (examples to seed the dictionary):
| Purpose | Needed | Review | Typically excess |
|---|---|---|---|
| Newsletter signup | email | name (first name), consent checkbox | phone, DOB, address, gender, ID numbers, income |
| Contact us | name, email, message | phone | DOB, address, gender, ID numbers |
| Job application | name, email, phone, resume, address (city) | DOB (age proof only if justified), gender (if for equality monitoring) | Aadhaar/PAN at application stage, religion, caste, bank account |
| Online checkout | name, phone, email, delivery address, payment via gateway | DOB | gender, religion, income |
| Account registration | email or phone, password, name | DOB (age gate) | address, ID numbers, income |
| Event registration | name, email, phone | organisation, dietary needs (health-adjacent: Review) | DOB, address, ID numbers |
| Feedback survey | rating, comment | email (if reply wanted) | phone, address, DOB |

Children's data trigger: DOB or age field below 18 context, "child", "student", "guardian", "school", "class" tokens → add Children's data category and a notice line about verifiable parental consent.

---

## 14. Test cases the design must pass (judge simulation)

1. **Messy form**: `usr_nm, mob_no, e_mail, dob_dd, aadhar_no, pan, addr_line1, pincode, gender_sel, income_range, csrf_token, submit` with purpose "newsletter signup". Expect: email Needed; name Review; phone/DOB/Aadhaar/PAN/address/gender/income Excess (Aadhaar and PAN with Sensitive flag); `csrf_token` Not personal; `submit` ignored (not a data field).
2. **Raw field list**: `name, userPhone, EmailID` purpose "contact us". Expect all matched with "Matched by" hints.
3. **Purpose switch**: same form with "online checkout". Address and phone flip from Excess to Needed; confirms purpose-aware logic.
4. **Empty purpose**: shows inline error, does not crash.
5. **Hindi/Marathi notice**: language switch keeps list of data, purpose and withdrawal steps; placeholders still highlighted.
6. **Export**: `.txt` contains title, purpose, table in plain text, notice, score, disclaimer.
7. **Offline**: disconnect network, everything still works; no network requests in devtools.
8. **Mobile 375px**: no horizontal scroll, table becomes cards, Analyse button reachable by thumb.
9. **Keyboard only**: can reach input, analyse, switch tabs with arrow keys, open export, copy notice.
10. **200% zoom** and **forced colours**: layout intact, verdicts still readable by text + icon.

---

## 15. Build checklist (definition of done)

- [ ] Tokens from sections 3-5 defined as CSS variables, no hard-coded colours elsewhere
- [ ] Trust badge visible on every screen, no network requests
- [ ] Input modes, purpose chips, sample loader, validation messages
- [ ] Results strip, sortable/filterable table, group-by-category toggle, redline treatment
- [ ] "Matched by" hint on each row
- [ ] Notice tab with draft banner, three required sections, highlighted placeholders, language switch (EN/HI/MR)
- [ ] Score tab with gauge, itemised reasons, improvement tips
- [ ] Export: `.txt`, print-to-PDF stylesheet, copy notice
- [ ] Empty, error, out-of-date and partial-recognition states
- [ ] Responsive at 375, 768, 1024, 1440 widths
- [ ] Accessibility: focus rings, tab semantics, contrast, reduced motion
- [ ] Draft / not-legal-advice disclaimer in UI, notice and exports
- [ ] All 10 judge tests in section 14 pass

---

## 16. One-line summary for the team

A calm, white "redlined document" tool: paste a form, state its purpose, and instantly see each field marked as needed, review or excess, with a plain-language reason, a ready-to-copy draft consent notice in English, Hindi or Marathi, and a score, all provably running in the browser.
