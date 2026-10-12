# Charts and maps that carry a story

The difference between a competent explainer and one people finish is usually not
the writing. It is whether each beat gets the *right* visualization instead of the
same bar chart four times.

## One chart type per beat

A video with three bar charts reads as a slideshow, even when the numbers are great.
Give consecutive data beats visually distinct forms so each cut feels like new
information rather than the same graphic with different labels.

| The data is... | Reach for | Because |
|---|---|---|
| a value over time | **line chart** | the *shape* carries the argument; a flat decade then a cliff needs no narration |
| a part of a whole | **donut** | viewers read proportion directly, no axis needed |
| composition of one total | **stacked bar** | shows what a number is made of, and lets one segment carry the accent |
| two values compared | paired bars, or a slope | fine once, tiring twice |
| a place, a region, a spread | **map** (see below) | geography is instantly legible and nobody else bothers |
| a share of a population | dot / unit chart | unusually visceral; 100 dots beats "62%" |

**Prefer the fuller series to the tidy pair.** If the script says "it went from $29 to
$329," you can draw two bars, or you can draw the ten years that surround those two
points and let the viewer *see* a decade of stability end. The second is dramatically
better television and usually costs one more query to the same source you already
fetched. Label only the two points the narration names; the rest establish the shape.

## Static base first, data second

Every chart scene lands on a cut, and the cut frame must already be composed. For a
chart that means the **axis, gridlines, tick labels, and source line are present at the
cut**, and only the data animates in on top. This is also just how a chart is read: the
frame of reference exists before the values arrive.

Getting this wrong produces a genuinely blank cut frame - a bare axis line on an empty
field for a second or more - which the linter cannot see and which reads as a bug.

```js
// on the cut: the whole frame of reference
tl.set('#kicker',{opacity:1,y:0}, CUT).set('#axis',{opacity:1}, CUT)
  .set('#xlab1',{opacity:1,y:0}, CUT).set('#src',{opacity:1,y:0}, CUT)
// on the trigger word: the data
  .fromTo('#bar1',{scaleY:0},{scaleY:1,duration:.5,ease:'power3.out'}, T1);
```

## Geometry: compute it, do not eyeball it

Chart coordinates are the one part of a composition where arithmetic errors are
invisible until you look at a rendered frame. Compute the point list, the path
`d` string, and the dash length in a script and paste the result in.

```python
# value -> y, with the axis top at AXMAX
y = base - (value / AXMAX) * (base - top)
# a polyline's stroke-dasharray must be >= its true length or the draw stops short
L = sum(math.dist(pts[i], pts[i+1]) for i in range(len(pts)-1))
```

Overestimating `stroke-dasharray` is safe; underestimating truncates the draw.

**Check callout labels against the line, not against the frame.** A label placed in
visually empty space can still be crossed by a steeply rising segment a second later,
because you positioned it while looking at a half-drawn chart. Evaluate the line's y at
the label box's left and right x, and confirm the box clears it at both ends.

## Donuts

Build the ring as a **path**, not a `<circle>`, starting at 12 o'clock so the arc grows
from the top the way people expect:

```html
<path class="ring" d="M540,566 A214,214 0 0,1 754,780 A214,214 0 0,1 540,994
                      A214,214 0 0,1 326,780 A214,214 0 0,1 540,566"/>
```

Circumference is `2πr`; a `p` percent arc means animating `strokeDashoffset` to
`C - C*p/100`. Rotating a `<circle>` with a CSS transform to start at the top instead
would collide with `gsap_css_transform_conflict`, so the path approach avoids a whole
class of problem.

Changing the centre label between two states (4.4% then 12%) is a `textContent` swap,
which will not animate under a paused seek - stack two elements and hard-swap them with
`tl.set`.

## Real maps, not illustrations

Highlighting an actual state border is one of the biggest available quality jumps, and
it is cheaper than it looks.

**Tile services are unusable here.** Mapbox, Leaflet and Google Maps fetch tiles at
runtime. The renderer seeks a paused timeline in headless Chrome and the composition
contract forbids network fetches, so tiles would race the capture and frames would
differ between runs.

**The approach that works:** project real boundary data *at build time*, simplify it, and
bundle it as static SVG paths. `assets/us-map.js` is already built - lower 48 plus DC,
Albers Equal Area Conic, ~28KB, with a `centroids` table for placing pins and labels.
Copy it into the project next to `index.html` and include it:

```html
<script src="us-map.js"></script>
```

Then build the map by appending real paths, and highlight by tweening `fill`:

```js
const M = window.US_MAP, MEMBER = new Set(M.pjm);
Object.keys(M.paths).sort().forEach(name => {
  const p = document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d', M.paths[name]);
  p.setAttribute('class','st');
  (MEMBER.has(name) ? hi : rest).push({el:p, name});
});
rest.forEach(o => g.appendChild(o.el));   // draw non-highlighted first...
hi.forEach(o => g.appendChild(o.el));     // ...so highlights paint on top
tl.to(order, { fill:'#FFEB00', duration:.42, stagger:.055 }, T);
```

Set the SVG's `viewBox` to the projection space (`0 0 1000 620`) and size it with
`width`/`height`. Everything inside is then in map coordinates, so centroids drop
straight in, and **a zoom is just a different viewBox** - the same path data serves a
whole-country establishing shot and a tight regional close-up, in any aspect ratio.

Need other geography? `scripts/make_us_map.py` regenerates the asset. Its orientation
assertions are load-bearing: a sign error in the y term renders the country upside
down and looks plausible enough to survive to a final render.

### The spread animation

For "this started here and reached everyone," sort the regions by distance from an
origin and stagger the fill in that order. It reads as propagation rather than a
generic stagger, and it is the same three lines of code:

```js
const order = regions.slice().sort((a,b) =>
  Math.hypot(...) - Math.hypot(...)).map(o => o.el);
tl.to(order, { fill:ACCENT, duration:.44, stagger:.062 }, T);
```

Pair it with lines drawing outward (`strokeDashoffset`) and two or three expanding
rings. Give the region a **pale accent** before it lights rather than a near-land grey -
if the "before" state is indistinguishable from surrounding territory, the viewer has
nothing to watch change.

**Zoom in when the detail matters.** A whole-country map is right for "this is how big
the footprint is," but at phone size individual states inside it are a few dozen pixels
and any animation on them is lost. Establish wide, then crop to the region for the beat
that needs detail.

### Say what the map actually shows

Colouring whole states when a market covers only part of several of them overstates the
claim. Use the operator's own language - "all or parts of 13 states" - rather than
implying full coverage. If radiating lines are schematic rather than real infrastructure,
do not label them as transmission routes.
