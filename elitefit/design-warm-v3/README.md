# Elite Fit group classes: Warm v3 (design concept)

| | |
| --- | --- |
| Version | **3.0** |
| Date | 4 Nov 2026 |
| Concept | Warm v3 (class-schedule booking page for Elite Fit Bali), the next version of Warm v2 |
| Snapshot | Built 5 Nov 2026 from the finished Warm v3.0 source (after the design audit). This folder is the only version published here. |

## What this is

Warm v3 is the next version of the Warm group-classes concept for Elite Fit Bali. It is a working demo, not the live website: the week schedule, the live "Now / Next" bar, the class finder and the booking steps all run in your browser, from the first tap to the "Booked" screen.

**Nothing is charged and nothing is sent.** Bookings, names and phone numbers stay in your own browser. Class spots, waitlists and dates are sample data. Items marked "Sample" on the page are placeholders. Three class clips are free stock footage (Pexels).

What is different from the earlier Warm v2 concept:

- **A film first screen.** The headline and the Book button sit directly on a full-width club film (the kettlebell loop, with every head whole and the text below the faces). "PEOPLE" is white with a terracotta underline.
- **Reviews.** A black reviews band shows one real Google review at a time, with previous and next buttons (swipe, trackpad or arrow keys work too). There is no autoplay.
- **Schedule.** On desktop the week grid is gone; the schedule shows one day at a time, as on phones.
- **Recharge.** The text sits on the steam-room photo under a soft scrim, led by the white club logogram.
- **Map.** The visit section shows a street-map picture. The live Google Map loads only when you press "Show the live map", so the page makes no request to Google until you ask. That one request goes to a third party (Google).
- **Footer.** The club's social links include TikTok.
- **Unchanged from v2:** the look (square frames, edge-to-edge photos and clips, terracotta colour, Gilroy type), the booking steps, the class finder, the Google rating next to Book, the Book bar, the Now / Next bar and the coach faces.

## How to open it

Open `index.html` through any static web server. Double-clicking the file does not work, because the page loads its data files.

```
cd design-warm-v3
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. All paths are relative, so the folder also works from any subfolder of a static host.

Useful links on top of the page address:

- `?finder=day` opens the class finder on "By day"
- `?now=2026-11-04T07:30` sets the Bali time (the "Now / Next" bar and the week follow it)

## Folder map

| Path | What is in it |
| --- | --- |
| `index.html` | The Warm v3 page |
| `assets/` | Warm v3's own CSS, scripts, images, videos and data (`assets/data/v2.json`) |
| `engine-v2/` | The shared booking engine: `api.js`, `booking.js`, `sheet-base.css`, its data (`data/v2.json`) and the coach photo and avatar crops (`img/r/`) |
| `v1/assets/` | Shared brand and class files: Gilroy fonts, logos, coach photos, the stock mobility clip and poster, the shared class data |
| `og-warm-v3.jpg` | The link-preview image (1200 x 630) used by the page |
| `thumbnail/` | The two Warm v3 concept thumbnails (see below) |

## Thumbnails

- `thumbnail/warm-v3-thumb-1200x630-v1.jpg`: 1200 x 630, for link previews (same picture as `og-warm-v3.jpg`)
- `thumbnail/warm-v3-thumb-1080-v1.jpg`: 1080 px, for the concept chooser

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 3.0 | 4 Nov 2026 | First snapshot of Warm v3 as a self-contained folder: the page, the shared engine and brand files, the link preview and the thumbnails. All paths relative. The page is `noindex, nofollow` with its own canonical address. Snapshot rebuilt 5 Nov 2026 from the audited source (reviews and Recharge polish, white hero accent with underline, map picture, footer links). |
