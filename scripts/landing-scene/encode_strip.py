"""Encode opaque PNG frames (already laid on the page colour) as an H.264 MP4
with the Video Sequencer, Standard view so the colours pass through unchanged.
blender -b --factory-startup --python-exit-code 1 -P encode_strip.py -- <frames_dir> <out.mp4> <w> <h>"""
import bpy, sys, os
src, out, w, h = sys.argv[sys.argv.index('--') + 1:][:4]
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
s = bpy.context.scene
s.view_settings.view_transform = 'Standard'
s.view_settings.look = 'None'
s.render.fps = 30
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = int(w), int(h), 100
se = s.sequence_editor_create()
coll = se.strips if hasattr(se, 'strips') else se.sequences
st = coll.new_image(name='strip', filepath=os.path.join(src, files[0]), channel=1, frame_start=1)
for f in files[1:]:
    st.elements.append(f)
s.frame_start, s.frame_end = 1, len(files)
r = s.render
r.use_sequencer = True
r.image_settings.media_type = 'VIDEO'
r.image_settings.file_format = 'FFMPEG'
ff = r.ffmpeg
ff.format = 'MPEG4'; ff.codec = 'H264'
ff.constant_rate_factor = 'MEDIUM'; ff.ffmpeg_preset = 'BEST'; ff.gopsize = 30
ff.audio_codec = 'NONE'
r.filepath = out
bpy.ops.render.render(animation=True)
print('RESULT', out, len(files), 'frames')
