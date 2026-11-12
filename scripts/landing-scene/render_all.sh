#!/bin/sh
# Build and render the front page scene and the inner pages' hill, then
# install the films and stills into the site.
#
#   sh scripts/landing-scene/render_all.sh <version tag>
#
# BLENDER  path to Blender 5.x (default: the Windows install path)
# WORK     scratch folder for .blend files and frames (default: ~/longhand-scene)
#
# Assembled from the steps used to make the November 2026 renders. Each step
# ran on its own then; this file has not been run end to end in one go.
set -e
V=${1:?give a version tag for the cache, for example 2026-11-13hamlet}
S="$(cd "$(dirname "$0")" && pwd)"
SITE="$(cd "$S/../.." && pwd)"
B=${BLENDER:-"/c/Program Files/Blender Foundation/Blender 5.3/blender.exe"}
WORK=${WORK:-"$HOME/longhand-scene"}
mkdir -p "$WORK" && cd "$WORK"
W="$(cygpath -w "$WORK" 2>/dev/null || echo "$WORK")"
run() { "$B" -b "$@" | grep -E "RESULT|rror" || true; }

rm -rf out_dist; mkdir -p out_dist/raw out_dist/final
for spec in "tree_land::tree-land:0" "tree_portrait:portrait:tree-portrait:0" "tree_day_land:day:tree-land-day:1" "tree_day_portrait:portrait day:tree-portrait-day:1"; do
  blend=${spec%%:*}; rest=${spec#*:}; flags=${rest%%:*}; rest=${rest#*:}; name=${rest%%:*}; day=${rest##*:}
  # the scene: tree, reader, hill, sky; then the grass field, the far landscape and the wind
  run --factory-startup --python-exit-code 1 -P "$S/build_tree.py" -- "$W/$blend.blend" $flags
  run $blend.blend --factory-startup --python-exit-code 1 -P "$S/regrass.py" -- "$W/${blend}_g.blend" $day 1
  run ${blend}_g.blend --factory-startup --python-exit-code 1 -P "$S/add_distance.py" -- "$W/${blend}_gd.blend" $day
  run ${blend}_gd.blend --factory-startup --python-exit-code 1 -P "$S/add_wind.py" -- "$W/${blend}_gdw.blend" 3
  # stills (first and last frame of the growth), the growth film and the loop
  run ${blend}_gdw.blend --factory-startup --python-exit-code 1 -P "$S/render_stills.py" -- "$W/out_dist/still_$name" 100 1 150
  run ${blend}_gdw.blend --factory-startup --python-exit-code 1 -P "$S/render_video.py" -- "$W/out_dist/raw/$name.mp4" 1 150
  run ${blend}_gdw.blend --factory-startup --python-exit-code 1 -P "$S/render_video.py" -- "$W/out_dist/raw/$name-loop.mp4" 151 270
  for f in $name $name-loop; do run --factory-startup --python-exit-code 1 -P "$S/encode_movie.py" -- "$W/out_dist/raw/$f.mp4" "$W/out_dist/final/$f.mp4" MEDIUM; done
  # the inner pages' hill is the landscape scene without the reader, its grass
  # unbroken, with a smaller tree further along
  if [ -z "${flags##*portrait*}" ] && [ -n "$flags" ]; then continue; fi
  t=night; [ "$day" = 1 ] && t=day
  run $blend.blend --factory-startup --python-exit-code 1 -P "$S/regrass.py" -- "$W/${blend}_hz.blend" $day 0
  run ${blend}_hz.blend --factory-startup --python-exit-code 1 -P "$S/add_distance.py" -- "$W/${blend}_hzd.blend" $day
  rm -rf "wind3_$t"
  run ${blend}_hzd.blend --factory-startup --python-exit-code 1 -P "$S/horizon_wind.py" -- "$W/wind3_$t" 7.6 0.4 0.42 5
done

python -I "$S/install_dist.py" "$SITE" "$V" "$W"
for t in night day; do
  run --factory-startup --python-exit-code 1 -P "$S/encode_strip.py" -- "$W/wind3_${t}_c" "$SITE/assets/video/horizon-wind-$t.mp4" 1920 372
done
echo DONE
