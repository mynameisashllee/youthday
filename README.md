# Youth Day Meeting Notes

Static website for sharing dated Youth Day meeting notes and follow-up tasks with each level team.

## Folder Structure

```text
content/
  meetings/
    level-1/
      2026-06-08.md
    level-2/
      2026-06-09.md
    level-3/
      2026-06-10.md
    level-4/
      2026-06-11.md
  templates/
    meeting-note.md
data/
  manifest.json
assets/
  styles.css
  app.js
index.html
```

## Add A Meeting Note

1. Copy `content/templates/meeting-note.md`.
2. Save it as `content/meetings/<team-slug>/<YYYY-MM-DD>.md`.
3. Fill in the front matter and notes.
4. Run:

```bash
npm run build
```

Example filename:

```text
content/meetings/level-2/2026-06-09.md
```

## Share Links

After the site is online, send a team/date link like:

```text
https://your-domain.example/?team=level-2&date=2026-06-09
```

The homepage also lists all available meeting notes.

## Preview Locally

```bash
npm run build
npm run dev
```

Then open `http://localhost:4173`.

## Host Online With GitHub Pages

1. Create a GitHub repository for this folder.
2. Push these files to the repository.
3. In GitHub, go to `Settings -> Pages`.
4. Set `Source` to `GitHub Actions`.
5. Every push to `main` will publish the site.

The included workflow builds `data/manifest.json` before deploying.
