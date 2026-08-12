# Olympian House Cup

A simple Greek-mythology-themed house point system for a middle school.

## Houses

- House of Odysseus — pink — bow
- House of Achilles — grey/silver — shield
- House of Circe — purple — wand/spark
- House of Athena — bright green — owl

No student names or individual student points are stored.

## Teachers

- Mx. Owens
- Mrs. Wheelus
- Mr. Dubin

The site uses one Supabase login account that all three teachers can share. Each transaction still requires the teacher to select their own name.

## Point reasons

- Hallway Behavior
- Specials Behavior
- Class Behavior
- Participation
- Teamwork
- Act of Kindness
- Other/custom category

## Files

- `index.html` — public scoreboard
- `teacher.html` — password-protected teacher dashboard
- `styles.css` — site design
- `config.js` — Supabase credentials
- `app.js` — public scoreboard logic
- `teacher.js` — teacher dashboard logic
- `supabase-setup.sql` — database + security rules

## 1. Create the Supabase project

1. Create a free project at Supabase.
2. Open **SQL Editor**.
3. Paste everything from `supabase-setup.sql` and run it.
4. Go to **Authentication → Users** and create one teacher user.
   - Use a school-controlled email address.
   - Set a strong shared password.

## 2. Add the Supabase keys

In Supabase go to:

**Project Settings → API**

Copy your Project URL and anon/public key.

Open `config.js` and replace:

```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

The anon key is designed to be visible in frontend code. Security is enforced by the Row Level Security policies in the SQL file.

Never place your Supabase `service_role` key in this website.

## 3. Test locally

Because the site is plain HTML/CSS/JavaScript, you can test it with a tiny local server.

If Python is installed:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

The public scoreboard is `index.html`.
Teacher controls are `teacher.html`.

## 4. Publish it

The simplest hosting options are GitHub Pages, Netlify, or Cloudflare Pages.

For GitHub Pages:

1. Create a new repository.
2. Upload all files in this folder.
3. In repository Settings → Pages, enable deployment from the main branch.
4. GitHub will give you a public URL.
5. Students can bookmark the root URL.
6. Teachers can bookmark `/teacher.html`.

## Security model

Students/public visitors can:

- View scores
- View house activity
- View which teacher awarded/deducted the points

They cannot:

- Add points
- Deduct points
- Edit transactions
- Delete transactions

Signed-in teachers can add transactions.

The Undo button does not delete history. It creates an equal and opposite transaction. This keeps the audit trail intact.

## Optional improvements for version 2

Good next additions would be:

- weekly points alongside year-to-date points
- a configurable "Quest of the Week"
- animated champion changes
- teacher-specific login accounts
- a reason/category report
- date filters
- reset/archiving at the end of a semester or school year
- house crest artwork instead of emoji symbols
