# Elite Fit group classes: Warm (design concept)

| | |
| --- | --- |
| Version | **1.0** |
| Date | 29 Oct 2026 |
| Concept | Warm v1.3 (class-schedule booking page for Elite Fit Bali) |
| Snapshot | Taken 29 Oct 2026 at 17:38 (Bali time). The newest source file in it was saved at 17:00 the same day. |

## What this is

Warm is the recommended group-classes concept for Elite Fit Bali. It is a working demo, not the live website: the week schedule, the live "Now / Next" bar, the class finder and the booking steps all run in your browser, from the first tap to the "Booked" screen.

**Nothing is charged and nothing is sent.** Bookings, names and phone numbers stay in your own browser. Class spots, waitlists and dates are sample data. Items marked "Sample" on the page are placeholders. Three class clips are free stock footage (Pexels).

The final QA round was still running when this snapshot was taken, so this is the 29 Oct state. Later fixes are not in it.

## How to open it

Open `index.html` through any static web server. Double-clicking the file does not work, because the page loads its data files.

```
cd design-warm-v1
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. All paths are relative, so the folder also works from any subfolder of a static host.

Useful links on top of the page address:

- `?finder=day` opens the class finder on "By day"
- `?now=2026-10-29T07:30` sets the Bali time (the "Now / Next" bar and the week follow it)

## Folder map

| Path | What is in it |
| --- | --- |
| `index.html` | The Warm page |
| `assets/` | Warm's own CSS, scripts, images, videos and data (`assets/data/v2.json`) |
| `engine-v2/` | The shared booking engine: `api.js`, `booking.js`, `sheet-base.css` and its data (`data/v2.json`) |
| `v1/assets/` | Shared brand and class files: Gilroy fonts, logos, coach photos, class clips and posters, the shared class data |
| `og-warm-v1.jpg` | The link-preview image (1200 x 630) used by the page |
| `thumbnail/` | The two Warm concept thumbnails (see below) |

## Thumbnails

- `thumbnail/warm-thumb-1200x630-v1.jpg`: 1200 x 630, for link previews
- `thumbnail/warm-thumb-1080-v1.jpg`: 1080 px, for the concept chooser

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 29 Oct 2026 | First snapshot of Warm v1.3 as a self-contained folder: the page, the shared engine and brand files, the thumbnails and the build notes. All paths relative. |
