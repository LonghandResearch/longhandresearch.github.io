"""Add the grass wind to a hero scene and save it as a new .blend.
blender -b scene.blend --factory-startup --python-exit-code 1 -P add_wind.py -- <out.blend> <wind>"""
import bpy, sys, math
a = sys.argv[sys.argv.index('--') + 1:]
out, WIND = a[0], float(a[1])
LOOP = 120
W = 2 * math.pi / LOOP
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

bpy.ops.wm.save_as_mainfile(filepath=out)
print('RESULT', out)
