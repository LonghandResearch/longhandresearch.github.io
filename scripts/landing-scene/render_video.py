"""blender -b scene.blend --factory-startup --python-exit-code 1 -P render_video.py -- <out.mp4> <start> <end>
H.264 MP4 of frames start..end."""
import bpy, sys
out, start, end = sys.argv[sys.argv.index('--') + 1:][:3]
s = bpy.context.scene
s.frame_start, s.frame_end = int(start), int(end)
s.render.resolution_percentage = 100
s.render.image_settings.media_type = 'VIDEO'
s.render.image_settings.file_format = 'FFMPEG'
ff = s.render.ffmpeg
ff.format = 'MPEG4'; ff.codec = 'H264'
ff.constant_rate_factor = 'HIGH'; ff.ffmpeg_preset = 'GOOD'; ff.gopsize = 30
ff.audio_codec = 'NONE'
s.render.filepath = out
bpy.ops.render.render(animation=True)
print('RESULT', out)
