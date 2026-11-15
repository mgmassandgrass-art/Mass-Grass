#!/usr/bin/env python3
"""TEMPORARY pages for the book reader (web/assets/book/pg-01..08.webp) until the real book pages exist.

The real pages come from the owner's PDF through the admin's Book panel (rendered in the browser and stored on the server);
these placeholders are only the static fallback (previews, local runs). Each one says it is temporary.
To swap them by hand: drop real pg-01.webp ... pg-NN.webp into web/assets/book/ and update book.json.
    python3 tools/book_placeholders.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / 'web' / 'assets'
OUT = ROOT / 'book'
W, H = 900, 1200
PAPER, INK, ROSE, GREY = (251, 248, 241), (43, 47, 44), (156, 79, 82), (107, 103, 94)
ART = ['hero', 'house', 'waves', 'dovegirl', 'boattop', 'snowglobe', 'bikeride']  # existing paintings, borrowed for now
HAND = str(ROOT.parent / 'fonts' / 'annie-use-your-telescope.ttf')
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'


def fit(im, w, h):
    s = min(w / im.width, h / im.height)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def label(d, n):
    f = ImageFont.truetype(MONO, 18)
    d.text((W / 2, H - 70), f'{n:02d}', font=f, fill=GREY, anchor='mm')
    d.text((W / 2, H - 36), 'TEMPORARY PAGE · REPLACE WITH THE BOOK', font=ImageFont.truetype(MONO, 13), fill=ROSE, anchor='mm')


def page(n, art=None, cover=False):
    pg = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(pg)
    if cover:
        d.text((W / 2, 170), 'Zero Waste &', font=ImageFont.truetype(HAND, 78), fill=INK, anchor='mm')
        d.text((W / 2, 260), 'Our Palestinian Ancestors', font=ImageFont.truetype(HAND, 62), fill=INK, anchor='mm')
        d.text((W / 2, 330), 'TEXT: NAJLA ABDELLATIF · DRAWINGS: FARAH AL-HELOU', font=ImageFont.truetype(MONO, 16), fill=GREY, anchor='mm')
        im = fit(Image.open(ROOT / f'{art}.webp').convert('RGB'), W - 200, H - 560)
        pg.paste(im, ((W - im.width) // 2, 400))
    else:
        im = fit(Image.open(ROOT / f'{art}.webp').convert('RGB'), W - 180, H - 380)
        pg.paste(im, ((W - im.width) // 2, 120 + (H - 380 - im.height) // 2))
        d.line((90, H - 170, W - 90, H - 170), fill=(214, 210, 200), width=2)
    label(d, n)
    return pg


def main():
    OUT.mkdir(exist_ok=True)
    pages = [page(1, 'pflower', cover=True)] + [page(i + 2, a) for i, a in enumerate(ART)]
    for i, p in enumerate(pages, 1):
        p.save(OUT / f'pg-{i:02d}.webp', 'WEBP', quality=80, method=6)
    print(len(pages), 'pages in', OUT)


if __name__ == '__main__':
    main()
