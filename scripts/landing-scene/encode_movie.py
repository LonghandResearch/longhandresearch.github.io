"""Re-encode an MP4 with the Video Sequencer at a given quality, colours unchanged.
blender -b --factory-startup --python-exit-code 1 -P encode_movie.py -- <in.mp4> <out.mp4> <crf: LOW|MEDIUM|HIGH>"""
import bpy, sys
src, out, crf = sys.argv[sys.argv.index('--') + 1:][:3]
s = bpy.context.scene
s.view_settings.view_transform = 'Standard'; s.view_settings.look = 'None'
se = s.sequence_editor_create()
coll = se.strips if hasattr(se, 'strips') else se.sequences
st = coll.new_movie(name='m', filepath=src, channel=1, frame_start=1)
s.render.fps = 30
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = st.elements[0].orig_width, st.elements[0].orig_height, 100
s.frame_start, s.frame_end = 1, st.frame_final_duration
r = s.render; r.use_sequencer = True
r.image_settings.media_type = 'VIDEO'; r.image_settings.file_format = 'FFMPEG'
ff = r.ffmpeg; ff.format = 'MPEG4'; ff.codec = 'H264'; ff.constant_rate_factor = crf; ff.ffmpeg_preset = 'BEST'; ff.gopsize = 30; ff.audio_codec = 'NONE'
r.filepath = out
bpy.ops.render.render(animation=True)
print('RESULT', out, s.frame_end, 'frames', s.render.resolution_x, s.render.resolution_y)
