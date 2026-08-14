# Version 3 — Visual Overhaul

Version 3 keeps Version 2's functionality and gives the public site a major Greek-mythology visual redesign:

- deep midnight / black-marble background
- gold ceremonial accents and Greek-key borders
- shield-style house crests
- more dramatic Overall and Weekly Champion panels
- upgraded Race to Olympus presentation
- stronger individual house identities
- ceremonial typography and decorative details
- subtler treatment of deductions
- matching but intentionally simpler teacher dashboard styling

## Before uploading

This package intentionally contains placeholder Supabase values.

Copy the TWO real lines from your currently working `config.js`:

```js
const SUPABASE_URL = "...";
const SUPABASE_ANON_KEY = "...";
```

and use them to replace the placeholders at the top of Version 3's `config.js`.

Do not change the rest of Version 3's `config.js`, because it contains the house mottos and point-category configuration.

## Test locally

From the Version 3 `greek-house-points` folder:

```text
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
http://localhost:8000/teacher.html
```

No new SQL is needed.
