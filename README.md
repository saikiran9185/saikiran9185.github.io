# Portfolio

Saikiran Chepuri's portfolio. A plain static site (no build step) that GitHub Pages can host for free.

## See it on your Mac

```sh
cd ~/Portfolio
python3 -m http.server 8095
```

Open http://localhost:8095. Opening `index.html` by double-clicking won't work, because the page loads `content/site.json`.

## How it is organised

```
index.html            the page (wall, Best work, case study, Customize panel)
assets/site.css       styles; every colour, font and size is a token
assets/site.js        builds the page from site.json
content/site.json     ALL text, theme, categories, projects and case studies
media/<project>/      images, videos and GIFs for each project
```

## Add a project

1. Make a folder `media/<project-id>/` and drop the files in (JPG/PNG/GIF/WebP/MP4).
   Keep images under about 1600 px wide and videos under about 20 MB.
2. Add an entry to `projects` in `content/site.json`:

```json
{
  "id": "my-project",
  "title": "My Project",
  "year": 2026,
  "cats": ["3D & Motion"],
  "one": "One sentence about it.",
  "role": "Design",
  "tools": "Blender",
  "tiles":  [ { "type": "image", "src": "media/my-project/a.jpg", "w": 1600, "h": 900, "caption": "Hero" } ],
  "blocks": [ { "type": "text", "title": "Why", "body": "..." } ]
}
```

3. Put its id in `best` if it should appear in Best work.

`w` and `h` only set the shape (ratio), so `16` and `9` work as well as pixel sizes.

### Tile types (on the wall)
`image`, `video` (plays muted while on screen), `text` (live type that cycles through `fonts`).

### Block types (in the case study)
`text`, `quote`, `image`, `video`, `gallery`, `compare` (before/after slider), `switcher` (pick a variant),
`stats` (numbers count up), `tester` (type tester), `figma` (embed a Figma prototype by share link).

### Per-project style
Add `"style": { "display": "Instrument Serif", "weight": 400, "bg": "#ECECEC", "fg": "#1E0E3E", "accent": "#433270" }`
and that project's case study uses its own fonts and colours.

## Customize panel

Changes save in your browser only. Click **Copy settings** and paste over `site` and `theme`
in `content/site.json` to make them live for everyone.
