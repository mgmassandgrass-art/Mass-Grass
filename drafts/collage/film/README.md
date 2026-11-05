# The calendar film (home page)

A hand turns each page of "Things kept in bottles" over the wire, rendered frame by frame with Remotion and
played by the scroll on the home page (`site/assets/flip/` wide, `site/assets/flipm/` portrait, 21 frames per sheet).

- Photos (Canva): `public/wall.jpg` (the bright wall with the blank calendar), `public/h0..h3.png` (the same hand:
  reach, pinch, lift, over), `public/wire.png` (the wire cut out of the wall), `public/shade.png` (the wall's light on the page).
- `src/Turn.jsx`: one turn (48 frames). Props `from`, `to` (page names in `public/`), `crop` + `outW` for the portrait cut.
- Render (from this folder, after `npm i` and copying the pages `c27-*.webp` into `public/`):
  `npx remotion render src/index.jsx Turn out1 --props='{"from":"c27-00","to":"c27-05"}' --sequence --image-format=jpeg
   --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --gl=swangle`
  and `TurnM` with `"crop":{"x":830,"y":0,"w":900,"h":1440},"outW":720` for phones.
- Then drop the first frame of every turn after the first, resize the wide frames to 1280x720, and pack 21 frames per
  sheet (3 x 7) into `a0.webp … a8.webp`. With more months, raise `NF` (frames) in the home page script.
