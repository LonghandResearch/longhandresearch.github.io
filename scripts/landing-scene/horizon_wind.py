"""The inner-page hill in the wind: a four-second loop (frames 151-270) of the
bare hill with the small tree, its leaves and the grass moving.
Writes RGBA PNG frames of the strip only.
blender -b tree_land.blend --factory-startup --python-exit-code 1 -P horizon_wind.py -- <out_dir> <x> <y> <scale> <wind>"""
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
out, X, Y, S, WIND = a[0], float(a[1]), float(a[2]), float(a[3]), float(a[4])
os.makedirs(out, exist_ok=True)
s = bpy.context.scene
LOOP = 120
W = 2 * math.pi / LOOP

keep = ('LH_Hill', 'LH_Grass', 'LH_Flowers', 'LH_Stone', 'LH_Ridge', 'LH_Moon', 'LH_Cam', 'LH_Tree', 'LH_LeafPoints', 'LH_Far')
for o in bpy.data.objects:
    if o.name in ('LH_MoonDisc', 'LH_MoonHalo') or not o.name.startswith(keep):
        o.hide_render = True

# Stronger wind in the crown: scale the sway amplitudes of the leaf nodes
amped = 0
for ng in bpy.data.node_groups:
    for n in ng.nodes:
        if n.bl_idname == 'ShaderNodeMath' and n.operation == 'MULTIPLY':
            for sock in n.inputs[1:2]:
                if not sock.is_linked and round(sock.default_value, 3) in (0.034, 0.012):
                    sock.default_value *= WIND; amped += 1

# Grass in the wind: every blade is eight vertices, root to tip in four rows,
# so the row (index % 8 // 2) says how far up the blade a vertex sits
grass = bpy.data.objects['LH_Grass']
g = bpy.data.node_groups.new('HZ_GrassWind', 'GeometryNodeTree')
g.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
g.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
gi, go = g.nodes.new('NodeGroupInput'), g.nodes.new('NodeGroupOutput')
def m(op, x, y):
    n = g.nodes.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((x, y)):
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: g.links.new(v, n.inputs[i])
    return n.outputs[0]
idx = g.nodes.new('GeometryNodeInputIndex').outputs[0]
row = m('FLOOR', m('DIVIDE', m('MODULO', idx, 8), 2), 0)
t = m('DIVIDE', row, 3)
bend = m('MULTIPLY', t, t)
pos = g.nodes.new('GeometryNodeInputPosition'); sep = g.nodes.new('ShaderNodeSeparateXYZ'); g.links.new(pos.outputs[0], sep.inputs[0])
time = g.nodes.new('GeometryNodeInputSceneTime').outputs['Frame']
phase = m('ADD', m('MULTIPLY', time, W), m('ADD', m('MULTIPLY', sep.outputs['X'], .7), m('MULTIPLY', sep.outputs['Y'], .4)))
gust = m('ADD', m('SINE', phase, 0), m('MULTIPLY', m('SINE', m('ADD', m('MULTIPLY', time, 2 * W), m('MULTIPLY', sep.outputs['X'], 1.9)), 0), .35))
dx = m('MULTIPLY', m('MULTIPLY', gust, .055 * WIND / 3), bend)
off = g.nodes.new('ShaderNodeCombineXYZ'); g.links.new(dx, off.inputs['X'])
sp = g.nodes.new('GeometryNodeSetPosition')
g.links.new(gi.outputs[0], sp.inputs['Geometry']); g.links.new(off.outputs[0], sp.inputs['Offset']); g.links.new(sp.outputs[0], go.inputs[0])
grass.modifiers.new('Wind', 'NODES').node_group = g

# Plant the smaller tree further along the hill
s.frame_set(150)
dg = bpy.context.evaluated_depsgraph_get()
hit, loc, *_ = s.ray_cast(dg, Vector((X, Y, 50)), Vector((0, 0, -1)))
Z = loc.z if hit else 0.0
for o in [o for o in bpy.data.objects if o.name.startswith(('LH_Tree', 'LH_LeafPoints'))]:
    o.location = Vector((X, Y, Z)) + o.location.copy() * S - Vector((0, 0, 0.12 * S))
    o.scale = o.scale * S
    # the whole tree leans with the gusts, from its foot, on the same loop
    d = o.driver_add('rotation_euler', 1).driver
    d.type = 'SCRIPTED'
    d.expression = f'(sin(frame*2*pi/{LOOP}) + 0.3*sin(frame*4*pi/{LOOP} + 1.1)) * {0.018 * WIND / 3:.5f}'

# Only the strip the page uses: rows 980-1600 of an 1800-row frame
r = s.render
r.film_transparent = True
r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100
r.use_border, r.use_crop_to_border = True, True
r.border_min_x, r.border_max_x = 0.0, 1.0
r.border_min_y, r.border_max_y = (1800 - 1600) / 1800, (1800 - 980) / 1800
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
s.frame_start, s.frame_end = 151, int(a[5]) if len(a) > 5 else 270
s.frame_step = int(a[6]) if len(a) > 6 else 1
r.filepath = os.path.join(out, 'f')
bpy.ops.render.render(animation=True)
print('RESULT', out, 'amped', amped, 'ground', round(Z, 2))
