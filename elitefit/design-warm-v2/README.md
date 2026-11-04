# Elite Fit group classes: Warm v2 (design concept)

| | |
| --- | --- |
| Version | **2.0** |
| Date | 4 Nov 2026 |
| Concept | Warm v2 (class-schedule booking page for Elite Fit Bali), the next version of Warm v1 |
| Snapshot | Built 4 Nov 2026 from the Warm v2.0 source. Warm v1 stays untouched in `../design-warm-v1/`. |

## What this is

Warm v2 is the next version of the Warm group-classes concept for Elite Fit Bali. It is a working demo, not the live website: the week schedule, the live "Now / Next" bar, the class finder and the booking steps all run in your browser, from the first tap to the "Booked" screen.

**Nothing is charged and nothing is sent.** Bookings, names and phone numbers stay in your own browser. Class spots, waitlists and dates are sample data. Items marked "Sample" on the page are placeholders. Three class clips are free stock footage (Pexels).

What is different from Warm v1:

- **Fewer frames.** Cards, photo frames and boxes are gone or square. Photos and clips run edge to edge. Only things you press keep a small corner, and circles stay for faces and dots.
- **More pace.** The headline at poster scale, bands of class names that slide with your scroll, class titles that slide in beside their clips, headlines that rise word by word, large numbers for times and prices.
- **Unchanged from v1:** every word of copy and every fact, the booking steps, the class finder, the Google rating next to Book, the Book bar, the Now / Next bar, the week schedule, the coach faces, the +1 offer, the terracotta colour and the Gilroy type.

## How to open it

Open `index.html` through any static web server. Double-clicking the file does not work, because the page loads its data files.

```
cd design-warm-v2
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. All paths are relative, so the folder also works from any subfolder of a static host.

Useful links on top of the page address:

- `?finder=day` opens the class finder on "By day"
- `?now=2026-11-04T07:30` sets the Bali time (the "Now / Next" bar and the week follow it)

## Folder map

| Path | What is in it |
| --- | --- |
| `index.html` | The Warm v2 page |
| `assets/` | Warm v2's own CSS, scripts, images, videos and data (`assets/data/v2.json`) |
| `engine-v2/` | The shared booking engine: `api.js`, `booking.js`, `sheet-base.css`, its data (`data/v2.json`) and the coach photo and avatar crops (`img/r/`) |
| `v1/assets/` | Shared brand and class files: Gilroy fonts, logos, coach photos, the stock mobility clip and poster, the shared class data |
| `og-warm-v2.jpg` | The link-preview image (1200 x 630) used by the page |
| `thumbnail/` | The two Warm v2 concept thumbnails (see below) |

## Thumbnails

- `thumbnail/warm-v2-thumb-1200x630-v1.jpg`: 1200 x 630, for link previews (same picture as `og-warm-v2.jpg`)
- `thumbnail/warm-v2-thumb-1080-v1.jpg`: 1080 px, for the concept chooser

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 2.0 | 4 Nov 2026 | First snapshot of Warm v2 as a self-contained folder: the page, the shared engine and brand files, the link preview and the thumbnails. All paths relative. |
