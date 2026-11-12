"""blender -b tree.blend --factory-startup --python-exit-code 1 -P render_stills.py -- <out_dir> <pct> <frame> [frame ...]"""
import bpy, sys, os
args = sys.argv[sys.argv.index('--') + 1:]
out, pct, frames = args[0], int(args[1]), [int(f) for f in args[2:]]
os.makedirs(out, exist_ok=True)
s = bpy.context.scene
s.render.resolution_percentage = pct
s.render.image_settings.file_format = 'PNG'
done = []
for f in frames:
    s.frame_set(f)
    s.render.filepath = os.path.join(out, f'f{f:03d}.png')
    bpy.ops.render.render(write_still=True)
    done.append(s.render.filepath)
print('RESULT', done)
