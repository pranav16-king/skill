# ui.md: DPDP Form Auditor

Build the UI exactly as this file describes. It follows the reference mockup (navy brand, light dashboard body, five numbered panels), adds a **left sidebar**, and keeps **only the features the problem statement requires**.

---

## 1. Scope: required features only

### Keep
| # | Feature | Where in UI |
|---|---|---|
| 1 | Paste form HTML **or** enter field-name list | Panel 1, segmented toggle |
| 2 | One-line purpose (required) | Panel 1 |
| 3 | Classify each field as personal / not personal | Panel 2 table |
| 4 | Group into categories (identity, contact, financial, health, location, children's, plus non-personal) | Panel 2 chips, Panel 3 cards |
| 5 | Flag excess collection for the purpose | Panel 2 "Needed?" column, summary tiles |
| 6 | Summary table: field, category, needed or not, reason | Panel 2 |
| 7 | Draft consent notice: data collected, purpose, how to withdraw | Panel 4 |
| 8 | Rule-based, runs in browser, nothing sent | Trust badge + footer note |
| 9 | Compliance score 0-100 with explanation (stretch) | Panel 5 |
| 10 | Notice in English / Hindi / Marathi (stretch) | Panel 4 language tabs |
| 11 | Download PDF or text report (stretch) | Panel 6 actions |

### Drop from the mockup (not required)
- Dark-mode toggle
- "How it Works", "Guidelines", "About" pages and their nav links
- Top navigation bar (replaced by the sidebar)
- Decorative info icons with no content behind them

### Tiny helpers kept (cheap, help the demo)
- `Clear` button
- `Load sample form` link (fills the messy example so judges see results in one click)
- `Copy notice` button (already in the mockup)

---

## 2. Page structure

```
+---------+--------------------------------------------------------------------+
| SIDEBAR | Page heading: "Audit a form"                 [100% Private badge]  |
| 232px   +--------------------------------------------------------------------+
|         | ROW 1:  [1 Provide Input] [2 Analysis Results] [3 Compliance Score]|
| logo    |            360px              fluid                  320px         |
| nav     |                                                                    |
|         | ROW 2:  [4 Data Categories] [5 Draft Consent Notice] [6 Actions]   |
| privacy |            fluid                1.4fr                   320px      |
+---------+--------------------------------------------------------------------+
```
Panel numbers 1-6 in the badges match the order of the sidebar items. (The mockup used 1-5 with score unnumbered; here each panel is numbered so the sidebar and panels line up.)

---

## 3. Sidebar

### 3.1 Purpose
Fast jump to each panel and a constant reminder of privacy. It does **not** open new pages; every item scrolls to a panel on the same screen.

### 3.2 Anatomy (top to bottom)
1. **Brand block**: shield logo (40px) + "DPDP Form Auditor" (18px, 700) + tagline "Check. Understand. Collect only what you need." (12px, muted light).
2. **Nav list** (6 items, 44px tall each, 8px gap):

| Order | Label | Icon | Scrolls to |
|---|---|---|---|
| 1 | Provide input | edit / file-code | Panel 1 |
| 2 | Analysis results | table | Panel 2 |
| 3 | Compliance score | gauge | Panel 3 |
| 4 | Data categories | layers / grid | Panel 4 |
| 5 | Consent notice | file-text | Panel 5 |
| 6 | Export | download | Panel 6 |

3. **Status line** under the nav (small, 12px): "Last analysed: 8 fields · Newsletter signup" (appears after analysis). Empty before.
4. **Bottom privacy card**: lock icon, "100% private", "Runs entirely in your browser." (This is the same message as the header badge; on desktop show only one of them, see 3.5.)

### 3.3 Visual spec
- Width **232px** expanded, **72px** collapsed (icons only, labels as tooltips).
- Background `#0B1530` (navy), text `#C9D3EA`, icons `#8EA2D4`.
- Active item: background `#1F4FE0`, text and icon `#FFFFFF`, radius 10px (matches the blue "Home" pill in the mockup).
- Hover: background `rgba(255,255,255,.08)`.
- Focus: 3px `#8FB0FF` outline, 2px offset.
- Item padding `0 14px`, icon 20px, gap 12px, label 14px / 500.
- Sticky, full viewport height, scrolls independently if the window is short.

### 3.4 Behaviour
- Click item: smooth scroll to panel (instant if reduced motion), move keyboard focus to the panel heading.
- **Scroll-spy**: the item for the panel most in view is highlighted.
- Items 2-6 show a small dot until the first analysis is run, then the dot disappears (they are "empty" until then). No numbers or counters on the sidebar.
- Collapse button at the bottom-left (chevron). State is remembered only for the session (no storage of pasted data, ever).

### 3.5 Responsive
| Width | Sidebar |
|---|---|
| >= 1680px | Expanded 232px |
| 1024-1679px | Collapsed rail 72px (labels in tooltips) |
| < 1024px | Hidden; hamburger in a 56px top bar opens it as a left drawer (280px, overlay `rgba(11,21,48,.5)`, Esc closes) |

On mobile the privacy badge sits in the top bar next to the hamburger.

---

## 4. Theme tokens

```css
:root {
  /* Brand / chrome */
  --navy-900: #0B1530;      /* sidebar */
  --navy-800: #11204A;
  --blue-600: #1F4FE0;      /* primary button, active nav, step badge */
  --blue-700: #1A42BD;
  --purple-600: #5B3FE0;    /* "Download PDF" primary action */
  --purple-700: #4A31C2;

  /* Surfaces */
  --bg: #F3F6FB;            /* page */
  --surface: #FFFFFF;       /* panels */
  --surface-alt: #F6F8FC;   /* table header, code well */
  --border: #DFE5F0;
  --border-strong: #C3CCDD;

  /* Text */
  --text: #12203D;
  --text-2: #3F4C68;
  --text-3: #5F6B85;        /* min 4.5:1 on white */

  /* Verdict + summary tiles (bg / border / text) */
  --personal-bg:  #FDECEC;  --personal-bd:  #F5C2C2;  --personal-tx:  #B3261E;
  --nonpers-bg:   #E7F6EE;  --nonpers-bd:   #B7E2CA;  --nonpers-tx:   #0F7A4F;
  --necessary-bg: #E8F0FE;  --necessary-bd: #BCD0F8;  --necessary-tx: #1F4FE0;
  --unnecessary-bg:#FFF0E6; --unnecessary-bd:#F8CFAF;  --unnecessary-tx:#B5470A;

  /* Yes / No pills */
  --yes-bg: #FDECEC; --yes-tx: #B3261E;     /* "Personal data? Yes" */
  --ok-bg:  #E3F4EB; --ok-tx:  #0F7A4F;     /* "Needed? Yes" */
  --no-bg:  #FDECEC; --no-tx:  #B3261E;     /* "Needed? No" (excess) */
  --na-bg:  #EEF1F6; --na-tx:  #5F6B85;     /* "Personal data? No" */

  --focus: #1D4ED8;
}
```
Colour is never the only signal: every pill carries its word (Yes/No), every category chip carries an icon.

### Category colours (cards in Panel 4 and chips in Panel 2)
| Category | Icon | Background | Text/icon |
|---|---|---|---|
| Identity | person | `#E8F0FE` | `#1F4FE0` |
| Contact | phone / at-sign | `#E3F4EB` | `#0F7A4F` |
| Location | map-pin | `#FFF4DB` | `#9A6200` |
| Financial | wallet / card | `#EEE9FD` | `#5B3FE0` |
| Health | heart-pulse | `#FDE9EE` | `#C0264F` |
| Children's data | child | `#FDECEC` | `#B3261E` |
| Non-personal | check / minus-circle | `#E7F6EE` | `#0F7A4F` |
| Sensitive flag (e.g. Aadhaar, health, children) | shield-alert, shown as "(Sensitive)" text | | `#B3261E` |

### Typography
```css
--font: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans",
        "Noto Sans Devanagari", "Nirmala UI", "Mangal", sans-serif;
--mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```
**No external fonts or scripts** (this is a privacy tool; any CDN request undermines the "nothing leaves your browser" promise).

| Use | Size / line | Weight |
|---|---|---|
| Panel title | 18 / 26 | 700 |
| Body, inputs, notice text | 15-16 / 24 | 400 |
| Table cells | 14 / 20 | 400-500 |
| Table header | 13 / 18 | 600 |
| Hints, meta, chips | 12-13 / 16 | 500 |
| Score number | 48 / 52 | 800 |
| Tile number | 28 / 32 | 700 |
| Field names / HTML | 13-14 mono | 400 |

Hindi/Marathi text: line-height 1.7.

### Shape and spacing
- 4px grid: 4 · 8 · 12 · 16 · 20 · 24 · 32.
- Panels: radius 14px, 1px `--border`, background `--surface`, padding 20px, **no drop shadow** (use border only). Gap between panels 16px.
- Buttons and inputs radius 8px; pills 999px; summary tiles radius 12px.
- Step badge: 28px circle, `--blue-600`, white number 14/700, sits left of the panel title with 10px gap.

---

## 5. Panels

### Panel 1: Provide input (360px wide)
Contents, top to bottom:
1. Title row: badge "1" + "Provide input".
2. **Segmented toggle** (two equal halves, height 40): `Paste HTML` | `Enter field list`. Active half: white background, blue text, blue 1px border. Inactive: `--surface-alt`, `--text-2`.
3. Helper line (14px, `--text-2`): "Paste the HTML of your form below or enter field names. Add a one-line purpose for data collection."
4. Label "Form purpose *" + text input (height 44) + example hint (12px, `--text-3`): "Example: newsletter signup, job application, event registration".
   - Purpose quick-pick chips under the hint (optional but small): Newsletter signup, Contact us, Job application, Online checkout, Event registration, Account registration.
5. Label "HTML code *" (changes to "Field names *" in list mode) + textarea: mono 13px, min-height 260px, `--surface-alt` background, vertical resize, line numbers not needed.
   - List mode placeholder: "One per line or comma separated: full_name, mob_no, dob".
6. Button row: `Clear` (secondary, 44px) left; `Analyze form →` (primary blue, 44px, min-width 140px) right.
7. Small link under the buttons: `Load sample form`.

Validation (inline under the field, red text with icon, `role="alert"`):
- Empty input: "Paste your form HTML or list some field names."
- Empty purpose: "Add a one-line purpose so we can judge what is necessary."
- No fields detected: "We could not find any fields. Check the HTML, or switch to Enter field list."
- Unrecognised purpose: not an error; analyse with general rules and show a note in Panel 2: "We did not recognise this purpose, so general rules were used."

### Panel 2: Analysis results (fluid, min 560px)
**Header row**: badge "2" + "Analysis results" + muted text "We analyzed 8 fields for the purpose: “Newsletter signup”".

**Summary tiles** (4 in a row, equal width, 88px tall, radius 12px, tinted bg + border; icon in a 40px rounded square at left; number 28/700; label 14/600; sub-label 12/500):
| Tile | Number | Label | Sub-label |
|---|---|---|---|
| Red tint | count of personal-data fields | Personal data | "x% of fields" |
| Green tint | count of non-personal fields | Non-personal | "x% of fields" |
| Blue tint | count of needed fields | Necessary | "For this purpose" |
| Orange tint | count of excess fields | Unnecessary | "Consider removing" |
Clicking a tile filters the table (click again to clear). Tiles are buttons with `aria-pressed`.

**Fields table** columns (5, trimmed from the mockup's 7 to fit):
| Column | Width | Content |
|---|---|---|
| Field | 24% | Raw name in mono (e.g. `mob_no`), detected label under it in `--text-3` ("Mobile number"). Replaces the separate "#" and "Detected label" columns. |
| Category | 20% | Icon + category name; add "(Sensitive)" in red where relevant |
| Personal data? | 14% | Pill: Yes (red tint) / No (grey) |
| Needed? | 14% | Pill: Yes (green) / No (red) |
| Reason | 28% | One plain sentence |

Rules:
- Header row sticky, `--surface-alt`, 13/600.
- Row height 52px minimum, 1px bottom border, zebra not used.
- Excess rows (Needed = No): 3px left border `--no-tx` and a very light red row tint (`#FFF7F7`).
- Sort default: excess first, then needed, then non-personal. Header click re-sorts.
- Table body scrolls inside the panel if more than 10 rows (max-height 520px) so the page layout never jumps.
- Mobile (< 640px): each row becomes a card: field + pills on the first line, category on the second, reason on the third.
- Reason copy examples: "Used to personalize the newsletter." / "Required to send newsletters." / "Not required for newsletter." / "Highly sensitive, not required." / "Required to record consent."

"Matched by" hint: in a small tooltip on the field name (e.g. "Matched by name pattern: mob, input type: tel"). Not a column, so the table stays compact.

### Panel 3: Compliance score (320px)
1. Title row: badge "3" + "Compliance score".
2. **Ring gauge** (160px circle, stroke 14px, track `#E8ECF4`): arc length = score/100, colour by band (below). Centre: score (48/800) and "/100" (14, muted). Include the value as real text for screen readers.
3. **Status card** to the right of or below the ring: coloured heading with icon ("Needs improvement") and one sentence ("Collects 4 unnecessary personal data fields and includes 1 sensitive field (Aadhaar).").
4. **"How the score is calculated?"** block (light blue box): list of lines with icon, text, and signed value; a divider; "Total score  40 / 100".

**Score model (single source of truth, derive every number from it):**
- Start at 100.
- −10 for each unnecessary field (non-sensitive).
- −20 for each unnecessary **sensitive** field (Aadhaar, PAN, health, religion, etc.).
- −10 if no consent checkbox is found.
- −15 if children's data is collected and the form shows no age/guardian mention.
- Clamp to 0-100.
- No bonus points. A line with value 0 and a green tick ("Consent checkbox found") is allowed so the user sees what is already fine.

| Band | Range | Colour | Label |
|---|---|---|---|
| Good | 80-100 | `#0F7A4F` | Good |
| Fair | 60-79 | `#2B6CB0` | Fair |
| Needs improvement | 40-59 | `#E8830C` (orange, as in mockup) | Needs improvement |
| Poor | 0-39 | `#B3261E` | Poor |

Example matching the mockup form: 4 unnecessary non-sensitive (mob_no, dob, gender, pincode) = −40; 1 unnecessary sensitive (aadhar) = −20; consent checkbox found = 0; total **40 / 100**.

### Panel 4: Data categories (fluid)
Grid of **category cards**, 3 per row (2 on tablet, 1 on mobile), each 96px tall, radius 12px, tinted by category colour:
- Icon in a 40px rounded square (left)
- Category name (14/700), "N fields" (13/500), and a muted list of the field labels ("Name, DOB, Gender, Aadhaar"), truncated with ellipsis, full list on hover/focus tooltip
- Empty categories show "None detected" in muted text and a lighter version of the tint (never hidden, so the user sees every category was checked)
- Order: Identity, Contact, Location, Financial, Health, Children's data, Non-personal.

The count on each card must equal the number of rows in the Panel 2 table with that category.

### Panel 5: Draft consent notice (1.4fr)
1. Title row: badge "5" + "Draft consent notice (English)" (language name updates). Right side: **language tabs** `English | हिंदी | मराठी` (segmented, 36px high, active = blue fill with white text).
2. Amber **draft banner** (full width, 40px): "Draft notice for guidance. Not legal advice. Review before publishing." (`#FFF4DB` background, `#9A6200` text, alert icon). Always visible.
3. **Notice card** (white, 1px border, 24px padding, text 16/26, `max-width: 68ch` text column):
   - Heading "Draft consent notice" (18/600)
   - Paragraph 1: what we collect + purpose + explicit non-collection (the excess fields), with collected fields in **bold**
   - Paragraph 2: how to withdraw consent
   - Footer line: "This is a **draft notice** for guidance and not legal advice. Please review and customize it for your organization."
4. Placeholders (e.g. `[support email]`) get a pale amber background so the owner sees what to fill in.
5. Scroll inside the card if long (max-height 360px); panel height matches the actions panel.

Notice templates (use full sentences per language, not machine-assembled fragments). `{data}` = needed personal fields in plain words, `{purpose}` = the stated purpose, `{excess}` = excess fields in plain words.

**English**
> We collect your **{data}** to {purpose}. We do not collect your {excess} for this purpose.
>
> You can withdraw your consent at any time by clicking the “Unsubscribe” link in our emails or by contacting us at [support email]. After withdrawal, we will stop using your data for this purpose and delete it within a reasonable time.
>
> This is a **draft notice** for guidance and not legal advice. Please review and customize it for your organization.

**हिंदी**
> हम आपका **{data}** {purpose} के उद्देश्य से एकत्र करते हैं। इस उद्देश्य के लिए हम आपका {excess} एकत्र नहीं करते।
>
> आप किसी भी समय हमारे ईमेल में “अनसब्सक्राइब” लिंक पर क्लिक करके या [support email] पर संपर्क करके अपनी सहमति वापस ले सकते हैं। सहमति वापस लेने के बाद हम इस उद्देश्य के लिए आपके डेटा का उपयोग बंद कर देंगे और उचित समय में उसे हटा देंगे।
>
> यह मार्गदर्शन के लिए एक **मसौदा सूचना** है, कानूनी सलाह नहीं। कृपया इसे अपने संगठन के अनुसार जाँचें और बदलें।

**मराठी**
> आम्ही तुमचे **{data}** {purpose} या उद्देशासाठी गोळा करतो. या उद्देशासाठी आम्ही तुमचे {excess} गोळा करत नाही.
>
> तुम्ही कोणत्याही वेळी आमच्या ईमेलमधील “अनसब्सक्राइब” लिंकवर क्लिक करून किंवा [support email] येथे संपर्क साधून तुमची संमती मागे घेऊ शकता. संमती मागे घेतल्यानंतर आम्ही या उद्देशासाठी तुमचा डेटा वापरणे थांबवू आणि योग्य कालावधीत तो हटवू.
>
> ही मार्गदर्शनासाठी **मसुदा सूचना** आहे, कायदेशीर सल्ला नाही. कृपया ती तुमच्या संस्थेनुसार तपासा आणि बदला.

Wording for `{purpose}` should be chosen from a small per-purpose phrase table (e.g. newsletter signup → "send you our newsletter with updates about our products, events and offers") in each language, so grammar stays natural. If the form has children's data, add one sentence about parental/guardian consent in the same language. If no personal fields are needed, show: "No personal data is needed for this purpose."

### Panel 6: Actions (320px)
Stack of three large buttons (64px tall, radius 10px, icon left, title 15/700, subtitle 12/400), 12px gap:
1. **Download report (PDF)**: filled `--purple-600`, white text, subtitle "Complete analysis with tables and notice".
2. **Download text file**: white, 1.5px `--purple-600` border, purple text, subtitle "Summary and draft notice".
3. **Copy consent notice**: same outline style, subtitle "Copy to clipboard"; on click the subtitle changes to "Copied" for 2 seconds (`aria-live="polite"`).

Below: green **privacy card** (`#E7F6EE` bg, `#B7E2CA` border): lock icon, "100% private & secure", "All analysis is rule-based and runs entirely in your browser. No data is sent to any server."

Behaviour:
- PDF: open the browser print dialog with a print stylesheet (`window.print()`), so no PDF library or network is needed. Print layout: report title, purpose, summary tiles as plain text, fields table, score with calculation, selected-language notice, draft disclaimer in the footer of every page. White background, black text, borders kept, pills keep their words.
- Text file: `dpdp-audit-<purpose-slug>-<YYYY-MM-DD>.txt` with title, purpose, field table in plain columns, score lines, and the notice in the currently selected language.
- All three buttons are disabled (with tooltip "Analyze a form first") until an analysis exists.

---

## 6. Page heading and trust badge

- Heading row at the top of the main area: "Audit a form" (22/700) on the left.
- Right: **trust badge** (pill, `#E7F6EE` bg, `#0F7A4F` text, shield icon, "100% private · Runs entirely in your browser"). Hover/focus popover: "Analysis uses rules stored in this page. Your form is never uploaded."
- When the sidebar is expanded, keep the sidebar privacy card **and** this badge only if the viewport is wide; below 1680px show only the badge (sidebar is a rail).

---

## 7. States

| State | What the user sees |
|---|---|
| First load | Panel 1 active and focused. Panels 2-5 show empty states (one calm line + icon, e.g. Panel 2: "Paste a form and choose Analyze form to see each field classified."). Panel 6 buttons disabled. |
| After Analyze | Results render instantly; focus moves to the Panel 2 heading; `aria-live` announces "Analysis complete: 5 unnecessary fields, score 40 out of 100." |
| Edited after analysis | Panels 2-5 get a small "Out of date. Analyze again." tag next to their titles; content stays visible. No auto-reanalysis per keystroke. |
| Language switch | Notice swaps in place; scroll position and other panels unchanged. |
| Unknown field | Category "Unclassified", Personal data? "Maybe", Needed? "Check", reason "We could not tell what this collects. Review it manually." It is counted separately and never dropped silently. |
| Parse failure | Inline error under the input (see Panel 1). Never an alert dialog. |

Motion: only a 150ms opacity fade when results first appear, and smooth scrolling from the sidebar. Both disabled under `prefers-reduced-motion`.

---

## 8. Responsive layout summary

| Width | Sidebar | Row 1 | Row 2 |
|---|---|---|---|
| >= 1440 | Rail (72) or expanded (>=1680) | 3 columns: Input 360 / Results fluid / Score 320 | 3 columns: Categories fluid / Notice 1.4fr / Actions 320 |
| 1024-1439 | Rail 72 | 2 columns: Input 360 / Results fluid; Score spans below as a full-width horizontal panel (ring left, calculation right) | Categories / Notice in 2 columns; Actions as a full-width row of 3 buttons |
| 640-1023 | Drawer | 1 column stack in order 1 to 6 | 1 column |
| < 640 | Drawer | 1 column, table becomes cards, `Analyze form` button full width and sticky at the bottom (64px, safe-area padding) | |

Page padding 24px (16px on mobile). No horizontal page scroll at any width; wide tables scroll inside their panel only on tablet.

---

## 9. Accessibility and quality floor

- Contrast: text >= 4.5:1, UI borders/icons >= 3:1 (tokens above comply).
- Visible 3px focus outline on every control; keyboard order follows visual order (sidebar, input, results, score, categories, notice, actions).
- Sidebar is a `<nav aria-label="Sections">`; the active item has `aria-current="true"`.
- Language tabs and the input-mode toggle use proper tab/radio semantics with arrow-key support.
- Table is a real `<table>` with `<th scope>`; mobile cards keep the same reading order.
- Status always has text and an icon, never colour alone.
- `lang="hi"` / `lang="mr"` set on the notice container when active.
- Touch targets at least 44 x 44px.
- Layout holds at 200% zoom.

---

## 10. Privacy rules the UI must respect

- One self-contained HTML file; inline SVG icons; no network requests of any kind.
- Never store pasted content (no localStorage, no cookies).
- Parse pasted HTML with `DOMParser` into an inert document; never insert it into the page as HTML. Render all field names and labels with `textContent`.

---

## 11. Data consistency rules (the mockup got these wrong; do not copy its numbers)

The mockup tiles (5 personal / 3 non-personal / 2 necessary / 6 unnecessary) and its score list do not match its own table, which has 7 personal fields, 1 non-personal field, 3 necessary and 5 unnecessary. Every number on screen must be **computed from one results array**:

```
personal      = rows where personal === true      -> sample: 7  (87.5%)
nonPersonal   = rows where personal === false     -> sample: 1  (12.5%)
necessary     = rows where needed === true        -> sample: 3  (full_name, email, agree)
unnecessary   = rows where needed === false       -> sample: 5  (mob_no, dob, gender, pincode, aadhar)
score         = per the model in Panel 3          -> sample: 40
categoryCount = group rows by category            -> Identity 4, Contact 2, Location 1, Non-personal 1
```
Checks: personal + nonPersonal = total fields; necessary + unnecessary = total fields; category counts sum to total fields; score lines add up to the total shown. If a check fails in development, show a console error.

---

## 12. Definition of done

- [ ] Sidebar with 6 anchor items, scroll-spy, collapse, drawer on mobile
- [ ] Panel 1 with both input modes, purpose field, sample loader, validation
- [ ] Panel 2 tiles (clickable filters) and 5-column table with excess highlighting
- [ ] Panel 3 ring gauge, status sentence, itemised calculation that sums correctly
- [ ] Panel 4 seven category cards with counts matching the table
- [ ] Panel 5 notice in English, Hindi and Marathi, draft banner, highlighted placeholders
- [ ] Panel 6 PDF (print), text file, copy; disabled until analysis
- [ ] Trust badge visible, zero network requests
- [ ] Empty, error, out-of-date and unclassified-field states
- [ ] Works at 375, 768, 1024, 1440 and 1920 widths
- [ ] Judge test: paste a messy form (`usr_nm, mob_no, e_mail, dob_dd, aadhar_no, pan, addr_line1, pincode, gender_sel, income_range, csrf_token`) with purpose "newsletter signup": email needed; phone, DOB, Aadhaar, PAN, address, pincode, gender, income flagged unnecessary (Aadhaar and PAN marked sensitive); `csrf_token` non-personal; all numbers consistent
