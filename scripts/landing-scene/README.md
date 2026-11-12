# The front page scene

The opening scene of the front page and the hill at the head of the inner
pages are drawn in Blender 5.3 from these scripts, headless. Nothing here runs
on the site: the site uses the films and stills they produce.

| Script | What it does |
| --- | --- |
| `build_tree.py` | The scene: the tree growing over 150 frames, the reader, the lantern, the hill, ridges, moon, stars and fireflies, ink lines and toon materials. `portrait` frames it for phones, `day` makes the Warm paper afternoon |
| `regrass.py` | Replaces the grass with an even field of short curved blades, dark at the root and light at the tip |
| `add_distance.py` | The far landscape in flat haze colour: a range of mountains, copses and poplars on the ridges, farmland with hedgerows, a hamlet with a church tower (windows lit at night) and a lane |
| `add_wind.py` | Moves the grass in the same four-second loop as the leaves |
| `horizon_wind.py` | The inner pages' hill: no reader, a smaller tree further along, stronger wind, the sky transparent |
| `render_stills.py`, `render_video.py` | Stills and H.264 films of a frame range |
| `encode_movie.py`, `encode_strip.py` | Re-encode a film, or encode frames laid on the page colour, through the Video Sequencer with the Standard view so colours pass through unchanged |
| `install_dist.py` | Copies films into `assets/video/`, writes the stills as WebP into `assets/img/landing/` and bumps the cache tags |
| `render_all.sh` | All of the above in order |

Frames 1 to 150 are the growth, 151 to 270 the loop. Everything that moves
(leaves, grass, fireflies, the lantern, the inner pages' tree) repeats every
120 frames, so the loop has no seam and its first frame follows the growth's
last. The stills are frames 1 and 150.

```sh
sh scripts/landing-scene/render_all.sh 2026-11-13hamlet
```

Blender writes to `WORK` (default `~/longhand-scene`), never into the site.
