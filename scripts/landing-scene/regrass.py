"""Replace the hill's grass with a fuller field: even, close tufts of short
curved blades, dark at the root and light at the tip, in the scene's toon
bands. Every blade keeps eight vertices in four rows, so the wind (index % 8)
still finds how far up a blade each vertex is. Saves a new .blend.
blender -b scene.blend --factory-startup --python-exit-code 1 -P regrass.py -- <out.blend> <day 0|1> <keep_clear 0|1>"""
import bpy, sys, math, random
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
out, DAY, CLEAR = a[0], a[1] == '1', a[2] == '1'
s = bpy.context.scene

def hexcol(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)

old = bpy.data.objects['LH_Grass']
old_mods = [(m.name, m.node_group) for m in old.modifiers if m.type == 'NODES']
bpy.data.objects.remove(old, do_unlink=True)
hill = bpy.data.objects['LH_Hill']
cam = s.camera
ortho = cam.data.ortho_scale
vis_w = ortho if s.render.resolution_x >= s.render.resolution_y else ortho * s.render.resolution_x / s.render.resolution_y
x_lo, x_hi = cam.location.x - vis_w * .62, cam.location.x + vis_w * .62
reader_at = Vector((.30 + .45, -.55))
def clear_of_things(x, y):
    if not CLEAR: return True
    return Vector((x, y)).length > .45 and (Vector((x, y)) - reader_at).length > .95

inv = hill.matrix_world.inverted()
def ground(x, y):
    o = inv @ Vector((x, y, 50)); d = (inv.to_3x3() @ Vector((0, 0, -1))).normalized()
    hit, loc, *_ = hill.ray_cast(o, d)
    return (hill.matrix_world @ loc).z if hit else None

rng = random.Random(97)
verts, faces, tip = [], [], []
def tuft(cx, cy, size, z0):
    n = rng.randint(6, 10)
    lean_dir = rng.uniform(-.5, .5)          # a tuft leans together, a little
    for b in range(n):
        a_ = lean_dir + rng.uniform(-1.1, 1.1) + (math.pi if rng.random() < .35 else 0)
        h = size * rng.uniform(.55, 1.0)
        lean = rng.uniform(.18, .5)
        w = size * rng.uniform(.06, .085)
        side = Vector((math.cos(a_ + 1.5708), math.sin(a_ + 1.5708), 0)) * w
        root = Vector((cx + rng.uniform(-1, 1) * size * .22, cy + rng.uniform(-1, 1) * size * .22, z0 - .012))
        outv = Vector((math.cos(a_), math.sin(a_), 0))
        i0 = len(verts)
        for k in range(4):
            t = k / 3
            c = root + outv * lean * h * t * t + Vector((0, 0, h * (t - .18 * t * t)))
            ww = 1 - t * .94
            verts.extend([c - side * ww, c + side * ww]); tip.extend([t, t])
        for k in range(3):
            faces.append((i0 + 2 * k, i0 + 2 * k + 1, i0 + 2 * k + 3, i0 + 2 * k + 2))

# an even field on a jittered grid, closer and larger towards the viewer
step = .17
y = -5.6
while y < 1.8:
    x = x_lo
    near = min(1.0, max(0.0, -y) / 3.6)
    st = step * (1.0 - .25 * near)
    while x < x_hi:
        px, py = x + rng.uniform(-.45, .45) * st, y + rng.uniform(-.45, .45) * st
        if clear_of_things(px, py) and rng.random() < .82:
            z0 = ground(px, py)
            if z0 is not None:
                tuft(px, py, rng.uniform(.10, .17) * (1 + .55 * near), z0)
        x += st
    y += st

me = bpy.data.meshes.new('LH_GrassMesh2'); me.from_pydata(verts, [], faces)
attr = me.attributes.new('tip', 'FLOAT', 'POINT'); attr.data.foreach_set('value', tip)
grass = bpy.data.objects.new('LH_Grass', me); s.collection.objects.link(grass)
grass.visible_shadow = False
for name, ng in old_mods:
    grass.modifiers.new(name, 'NODES').node_group = ng

# Toon light (three flat steps) times a root-to-tip colour
root_c, tip_c = (('#3f6136', '#a9c66f') if DAY else ('#0a2420', '#2e6a4c'))
m = bpy.data.materials.new('LH_GrassField'); m.use_nodes = True
nt = m.node_tree; nt.nodes.clear()
outn = nt.nodes.new('ShaderNodeOutputMaterial')
dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); s2r = nt.nodes.new('ShaderNodeShaderToRGB')
nt.links.new(dif.outputs[0], s2r.inputs[0])
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
els = ramp.color_ramp.elements
els[0].position = 0; els[0].color = (.72, .72, .72, 1)
els[1].position = .30; els[1].color = (.88, .88, .88, 1)
e = els.new(.62); e.color = (1, 1, 1, 1)
nt.links.new(s2r.outputs['Color'], ramp.inputs['Fac'])
at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'tip'
grad = nt.nodes.new('ShaderNodeValToRGB')
g = grad.color_ramp.elements
g[0].position = 0.0; g[0].color = hexcol(root_c)
g[1].position = 1.0; g[1].color = hexcol(tip_c)
nt.links.new(at.outputs['Fac'], grad.inputs['Fac'])
mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
mul.inputs['Factor'].default_value = 1.0
nt.links.new(grad.outputs['Color'], mul.inputs[6]); nt.links.new(ramp.outputs['Color'], mul.inputs[7])
em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(mul.outputs[2], em.inputs['Color'])
nt.links.new(em.outputs[0], outn.inputs['Surface'])
me.materials.append(m)

bpy.ops.wm.save_as_mainfile(filepath=out)
print('RESULT', out, len(faces) // 3, 'blades')
