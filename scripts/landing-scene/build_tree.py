"""Longhand landing: a stylized night tree that grows.

Headless:  blender -b --factory-startup --python-exit-code 1 -P build_tree.py -- <out.blend>

Skeleton: seeded recursive branches as mesh polylines. Every vertex stores
`gt` (the growth time at which the growing tip reaches it, 0..1) and `rad`
(its final radius). Geometry Nodes keeps only the points already reached at the
current frame and thickens each one with its age, so the tree really grows:
the trunk rises, limbs fork off as the tip passes, wood thickens, then the
leaf clumps swell open. Shading is flat toon (three bands) with an ink hull.
"""
import bpy, bmesh, math, random, sys
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['tree.blend']
OUT = ARGS[0]
PORTRAIT = 'portrait' in ARGS[1:]
DAY = 'day' in ARGS[1:]
SEED = 7
FPS = 30
GROW_START, GROW_END = 1, 132     # frames over which the skeleton grows
LAST = 270                        # 150 frames of growth, then one 120-frame ambient loop
LOOP = 120                        # sway and flicker repeat exactly every LOOP frames
W = 2 * math.pi / LOOP

rng = random.Random(SEED)
scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

def hexcol(h, a=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, a)

# ---------------------------------------------------------------- skeleton
STEP = 0.035
polylines = []      # list of [(co, dist_from_root, radius)]
leaves = []         # (co, dist, size)

def perpendicular(v):
    a = Vector((1, 0, 0)) if abs(v.x) < .9 else Vector((0, 1, 0))
    return v.cross(a).normalized()

def branch(start, direction, length, r0, depth, dist0, kind):
    pts = []
    d = direction.normalized()
    pos = start.copy()
    n = max(3, int(length / STEP))
    bend = Vector((rng.uniform(-1, 1), rng.uniform(-.6, .6), rng.uniform(-.3, .3))) * .012
    for i in range(n + 1):
        t = i / n
        r = r0 * (1 - .55 * t) if kind != 'twig' else r0 * (1 - .7 * t)
        pts.append((pos.copy(), dist0 + i * STEP, r))
        if i == n: break
        # wander, reach for light, and let long outer limbs droop a little
        d += bend + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * .045
        d.z += .010 if depth < 2 else (-.004 if depth >= 3 else .002)
        d.normalize()
        if d.z < -.12: d.z = -.12; d.normalize()          # outer twigs may droop, never dive to the ground
        pos += d * STEP
    polylines.append(pts)
    end_dist = pts[-1][1]
    if depth >= MAX_DEPTH:
        leaves.append((pts[-1][0] + Vector((0, 0, .08)), end_dist, rng.uniform(.46, .62)))
        k = len(pts) // 2
        if rng.random() < .45:
            p = pts[k][0] + Vector((rng.uniform(-.2, .2), rng.uniform(-.2, .2), rng.uniform(.05, .25)))
            leaves.append((p, pts[k][1] + .05, rng.uniform(.36, .5)))
        return
    # children
    if depth == 0:
        spots = [(.62, -50), (.74, 38), (.82, -8), (.9, 64), (.95, -78)]
    else:
        count = 3 if depth < 2 else rng.choice((2, 3))
        spots = [(rng.uniform(.45, .95), rng.uniform(-70, 70)) for _ in range(count)]
        spots.append((1.0, rng.uniform(-18, 18)))
    for frac, swing in spots:
        idx = min(len(pts) - 1, int(frac * (len(pts) - 1)))
        co, dist, r = pts[idx]
        parent_d = (pts[min(idx + 1, len(pts) - 1)][0] - pts[max(idx - 1, 0)][0]).normalized()
        # rotate within the picture plane (broad crown) with some depth
        ang = math.radians(swing)
        side = Matrix.Rotation(ang, 3, Vector((0, 1, 0))) @ parent_d
        side += Vector((0, rng.uniform(-.55, .55), 0))
        side.z = max(side.z, .35 if depth == 0 else -.05)
        child_len = length * (rng.uniform(.62, .78) if depth else rng.uniform(.9, 1.15))
        if depth == 0: child_len *= 1.0 + .25 * abs(swing) / 80   # long spreading limbs
        branch(co, side, child_len, r * (.72 if depth else .62), depth + 1, dist, 'twig' if depth + 1 >= MAX_DEPTH else 'limb')

MAX_DEPTH = 4
branch(Vector((0, 0, -.05)), Vector((0.06, 0, 1)), 1.75, .30, 0, 0.0, 'trunk')
# Roots spread from the foot of the trunk and dive into the hill
for ang in (-165, -128, -95, -40, -8, 30, 70, 112, 150):
    a = math.radians(ang + rng.uniform(-8, 8))
    d = Vector((math.cos(a), math.sin(a) * .8, -.30)).normalized()
    pos = Vector((0, 0, .16)); L = rng.uniform(.38, .70); n = int(L / STEP); pts = []
    for i in range(n + 1):
        t = i / n
        pts.append((pos.copy(), i * STEP * .5, .19 * (1 - .82 * t) * (1 if abs(math.sin(a)) < .7 else .8)))
        d.z = min(d.z + .022, -.04); d.normalize(); pos += d * STEP
    polylines.append(pts)

max_dist = max(p[1] for line in polylines for p in line)
max_leaf = max(l[1] for l in leaves)
span = max(max_dist, max_leaf)

def mesh_object(name, verts, edges, attrs):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, [])
    for key, values in attrs.items():
        a = me.attributes.new(key, 'FLOAT', 'POINT')
        a.data.foreach_set('value', values)
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    return ob

verts, edges, gts, rads = [], [], [], []
for line in polylines:
    base = len(verts)
    for i, (co, dist, r) in enumerate(line):
        verts.append(co); gts.append(dist / span * .86); rads.append(r)
        if i: edges.append((base + i - 1, base + i))
wood = mesh_object('LH_TreeSkeleton', verts, edges, {'gt': gts, 'rad': rads})

lv = [l[0] for l in leaves]
leaf = mesh_object('LH_LeafPoints', lv, [], {
    'lt': [min(.97, l[1] / span * .86 + .06 + rng.uniform(0, .05)) for l in leaves],
    'ls': [l[2] for l in leaves],
    'tint': [rng.random() for _ in leaves],
    'rz': [rng.uniform(0, 6.283) for _ in leaves],
})

# A leaf clump: a lumpy, slightly flattened ball (a drawn cloud of foliage)
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
crng = random.Random(23)
lobes = [(Vector((0, 0, 0)), .70)]
for k in range(11):
    u = Vector((crng.uniform(-1, 1), crng.uniform(-1, 1), crng.uniform(-.35, 1))).normalized()
    lobes.append((u * crng.uniform(.42, .56), crng.uniform(.34, .48)))
for v in bm.verts:
    n = v.co.normalized(); best = 0
    for c, r in lobes:
        b = n.dot(c); disc = b * b - (c.length_squared - r * r)
        if disc >= 0: best = max(best, b + math.sqrt(disc))
    v.co = n * best
    v.co.z *= .82
clump_me = bpy.data.meshes.new('LH_ClumpMesh'); bm.to_mesh(clump_me); bm.free()
for p in clump_me.polygons: p.use_smooth = True
clump = bpy.data.objects.new('LH_Clump', clump_me); scene.collection.objects.link(clump)
clump.hide_render = True; clump.hide_viewport = True; clump.location = (0, 0, -50)

# ---------------------------------------------------------------- materials
def toon(name, shadow, mid, light, tint_attr=None, bands=(.30, .62), grain=0.0, grain_scale=8.0, streaks=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position = 0; els[0].color = hexcol(shadow)
    els[1].position = bands[0]; els[1].color = hexcol(mid)
    e = els.new(bands[1]); e.color = hexcol(light)
    emit = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(dif.outputs[0], s2r.inputs[0])
    fac = s2r.outputs['Color']
    if grain:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = grain_scale
        nz.inputs['Detail'].default_value = 3.0
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        sb = nt.nodes.new('ShaderNodeMath'); sb.operation = 'SUBTRACT'; sb.inputs[1].default_value = .5
        nt.links.new(nz.outputs['Fac'], sb.inputs[0])
        ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; ad.inputs[1].default_value = grain
        nt.links.new(sb.outputs[0], ad.inputs[0]); nt.links.new(fac, ad.inputs[2])
        fac = ad.outputs[0]
    nt.links.new(fac, ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    if streaks:
        tc2 = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (16, 16, 1.4)
        nt.links.new(tc2.outputs['Object'], mp.inputs['Vector'])
        nz2 = nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 3.0
        nz2.inputs['Detail'].default_value = 2.0
        nt.links.new(mp.outputs[0], nz2.inputs['Vector'])
        th = nt.nodes.new('ShaderNodeMapRange'); th.clamp = True
        th.inputs['From Min'].default_value = .60; th.inputs['From Max'].default_value = .64
        th.inputs['To Max'].default_value = .9
        nt.links.new(nz2.outputs['Fac'], th.inputs['Value'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        mx.inputs['B'].default_value = hexcol('#0b0807')
        nt.links.new(th.outputs['Result'], mx.inputs['Factor']); nt.links.new(col, mx.inputs['A'])
        col = mx.outputs['Result']
    if tint_attr:
        att = nt.nodes.new('ShaderNodeAttribute'); att.attribute_type = 'INSTANCER'; att.attribute_name = tint_attr
        mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs['To Min'].default_value = .82; mr.inputs['To Max'].default_value = 1.12
        nt.links.new(att.outputs['Fac'], mr.inputs['Value'])
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
        mul.inputs['Factor'].default_value = 1.0
        comb = nt.nodes.new('ShaderNodeCombineColor')
        for k in ('Red', 'Green', 'Blue'): nt.links.new(mr.outputs['Result'], comb.inputs[k])
        nt.links.new(col, mul.inputs['A']); nt.links.new(comb.outputs[0], mul.inputs['B'])
        col = mul.outputs['Result']
    nt.links.new(col, emit.inputs['Color'])
    nt.links.new(emit.outputs[0], out.inputs['Surface'])
    return m

INK = '#081115'
M_WOOD = toon('LH_Wood', '#140f0d', '#2e231e', '#6a5040', grain=.10, grain_scale=14, streaks=True)
M_LEAF = toon('LH_Leaf', '#0a2223', '#1a443e', '#477a63', tint_attr='tint', bands=(.30, .74), grain=.22, grain_scale=11)
M_HILL = toon('LH_Hill', '#071a1c', '#10302f', '#24503f', bands=(.25, .70), grain=.12, grain_scale=3)
M_INK = bpy.data.materials.new('LH_Ink'); M_INK.use_nodes = True
M_INK.use_backface_culling = True
nt = M_INK.node_tree; nt.nodes.clear()
e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = hexcol(INK)
o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs['Surface'])

# ---------------------------------------------------------------- geometry nodes
def new_group(name):
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi = ng.nodes.new('NodeGroupInput'); go = ng.nodes.new('NodeGroupOutput')
    return ng, gi, go

def math_node(ng, op, a=None, b=None, c=None):
    n = ng.nodes.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b, c)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: ng.links.new(v, n.inputs[i])
    return n.outputs[0]

def growth_time(ng):
    """T: 0 at GROW_START, 1 at GROW_END, eased so the tree slows as it matures."""
    st = ng.nodes.new('GeometryNodeInputSceneTime')
    mr = ng.nodes.new('ShaderNodeMapRange'); mr.clamp = True
    mr.inputs['From Min'].default_value = GROW_START; mr.inputs['From Max'].default_value = GROW_END
    ng.links.new(st.outputs['Frame'], mr.inputs['Value'])
    lin = mr.outputs['Result']
    inv = math_node(ng, 'SUBTRACT', 1.0, lin)
    cube = math_node(ng, 'POWER', inv, 2.2)
    return math_node(ng, 'SUBTRACT', 1.0, cube)        # ease-out

def named(ng, name):
    n = ng.nodes.new('GeometryNodeInputNamedAttribute'); n.data_type = 'FLOAT'
    n.inputs['Name'].default_value = name
    return n.outputs['Attribute']

def ink_hull(ng, geo, width):
    sp = ng.nodes.new('GeometryNodeSetPosition')
    nrm = ng.nodes.new('GeometryNodeInputNormal')
    sc = ng.nodes.new('ShaderNodeVectorMath'); sc.operation = 'SCALE'
    sc.inputs['Scale'].default_value = width
    ng.links.new(nrm.outputs['Normal'], sc.inputs[0])
    ng.links.new(geo, sp.inputs['Geometry']); ng.links.new(sc.outputs['Vector'], sp.inputs['Offset'])
    flip = ng.nodes.new('GeometryNodeFlipFaces'); ng.links.new(sp.outputs[0], flip.inputs['Mesh'])
    sm = ng.nodes.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = M_INK
    ng.links.new(flip.outputs[0], sm.inputs['Geometry'])
    return sm.outputs[0]

def ink_object(src, width):
    """The ink line is its own object that casts no shadow: a hull that cast
    shadows would wrap the tree in its own darkness."""
    ng, gi, go = new_group(f'LH_Ink_{src.name}')
    oi = ng.nodes.new('GeometryNodeObjectInfo'); oi.inputs['Object'].default_value = src
    oi.transform_space = 'RELATIVE'
    ng.links.new(ink_hull(ng, oi.outputs['Geometry'], width), go.inputs[0])
    me = bpy.data.meshes.new(f'{src.name}_InkMesh')
    ob = bpy.data.objects.new(f'{src.name}_Ink', me); scene.collection.objects.link(ob)
    ob.modifiers.new('Ink', 'NODES').node_group = ng
    ob.visible_shadow = False
    return ob

# --- wood
ng, gi, go = new_group('LH_GrowWood')
T = growth_time(ng)
m2c = ng.nodes.new('GeometryNodeMeshToCurve'); ng.links.new(gi.outputs[0], m2c.inputs['Mesh'])
gt = named(ng, 'gt'); rad = named(ng, 'rad')
not_yet = math_node(ng, 'GREATER_THAN', gt, T)
dele = ng.nodes.new('GeometryNodeDeleteGeometry'); dele.domain = 'POINT'
ng.links.new(m2c.outputs[0], dele.inputs['Geometry']); ng.links.new(not_yet, dele.inputs['Selection'])
age = math_node(ng, 'SUBTRACT', T, gt)
grow = ng.nodes.new('ShaderNodeMapRange'); grow.clamp = True
grow.inputs['From Max'].default_value = .30; grow.inputs['To Min'].default_value = .18
ng.links.new(age, grow.inputs['Value'])
smooth = math_node(ng, 'POWER', grow.outputs['Result'], .7)
radius = math_node(ng, 'MULTIPLY', rad, smooth)
circle = ng.nodes.new('GeometryNodeCurvePrimitiveCircle')
circle.inputs['Resolution'].default_value = 10; circle.inputs['Radius'].default_value = 1.0
c2m = ng.nodes.new('GeometryNodeCurveToMesh')
ng.links.new(circle.outputs['Curve'], c2m.inputs['Profile Curve'])
c2m.inputs['Fill Caps'].default_value = True
if 'Scale' in c2m.inputs:
    ng.links.new(dele.outputs[0], c2m.inputs['Curve']); ng.links.new(radius, c2m.inputs['Scale'])
else:
    scr = ng.nodes.new('GeometryNodeSetCurveRadius')
    ng.links.new(dele.outputs[0], scr.inputs['Curve']); ng.links.new(radius, scr.inputs['Radius'])
    ng.links.new(scr.outputs[0], c2m.inputs['Curve'])
smat = ng.nodes.new('GeometryNodeSetMaterial'); smat.inputs['Material'].default_value = M_WOOD
ng.links.new(c2m.outputs[0], smat.inputs['Geometry'])
shade = ng.nodes.new('GeometryNodeSetShadeSmooth'); ng.links.new(smat.outputs[0], shade.inputs['Geometry'])
ng.links.new(shade.outputs[0], go.inputs[0])
wood.modifiers.new('Grow', 'NODES').node_group = ng

# --- leaves
ng, gi, go = new_group('LH_GrowLeaves')
T = growth_time(ng)
lt = named(ng, 'lt'); ls = named(ng, 'ls')
age = math_node(ng, 'SUBTRACT', T, lt)
open_ = ng.nodes.new('ShaderNodeMapRange'); open_.clamp = True
open_.inputs['From Max'].default_value = .16
ng.links.new(age, open_.inputs['Value'])
# a little overshoot as each clump opens: s = x * (1 + .18 * sin(pi x))
sinx = math_node(ng, 'SINE', math_node(ng, 'MULTIPLY', open_.outputs['Result'], math.pi))
bump = math_node(ng, 'MULTIPLY_ADD', sinx, .18, 1.0)
scale = math_node(ng, 'MULTIPLY', math_node(ng, 'MULTIPLY', open_.outputs['Result'], bump), ls)
shown = math_node(ng, 'GREATER_THAN', age, 0.0)
oi = ng.nodes.new('GeometryNodeObjectInfo'); oi.inputs['Object'].default_value = clump
inst = ng.nodes.new('GeometryNodeInstanceOnPoints')
ng.links.new(gi.outputs[0], inst.inputs['Points']); ng.links.new(shown, inst.inputs['Selection'])
ng.links.new(oi.outputs['Geometry'], inst.inputs['Instance']); ng.links.new(scale, inst.inputs['Scale'])
rot = ng.nodes.new('ShaderNodeCombineXYZ'); ng.links.new(named(ng, 'rz'), rot.inputs['Z'])
ng.links.new(rot.outputs[0], inst.inputs['Rotation'])
store = ng.nodes.new('GeometryNodeStoreNamedAttribute'); store.data_type = 'FLOAT'; store.domain = 'INSTANCE'
store.inputs['Name'].default_value = 'tint'
ng.links.new(inst.outputs[0], store.inputs['Geometry']); ng.links.new(named(ng, 'tint'), store.inputs['Value'])
real = ng.nodes.new('GeometryNodeRealizeInstances'); ng.links.new(store.outputs[0], real.inputs[0])
smat = ng.nodes.new('GeometryNodeSetMaterial'); smat.inputs['Material'].default_value = M_LEAF
st_ = ng.nodes.new('GeometryNodeInputSceneTime')
ph = math_node(ng, 'MULTIPLY', st_.outputs['Frame'], W)
pos = ng.nodes.new('GeometryNodeInputPosition'); sepp = ng.nodes.new('ShaderNodeSeparateXYZ')
ng.links.new(pos.outputs[0], sepp.inputs[0])
px, pz = sepp.outputs['X'], sepp.outputs['Z']
wave = math_node(ng, 'ADD', ph, math_node(ng, 'ADD', math_node(ng, 'MULTIPLY', px, .55), math_node(ng, 'MULTIPLY', pz, .35)))
a1 = math_node(ng, 'MULTIPLY', math_node(ng, 'SINE', wave), .034)
a2 = math_node(ng, 'MULTIPLY', math_node(ng, 'SINE', math_node(ng, 'ADD', math_node(ng, 'MULTIPLY', ph, 2.0), math_node(ng, 'MULTIPLY_ADD', px, 1.3, .8))), .012)
hf = ng.nodes.new('ShaderNodeMapRange'); hf.clamp = True
hf.inputs['From Min'].default_value = 1.6; hf.inputs['From Max'].default_value = 6.0
ng.links.new(pz, hf.inputs['Value'])
dx = math_node(ng, 'MULTIPLY', math_node(ng, 'ADD', a1, a2), hf.outputs['Result'])
dz = math_node(ng, 'MULTIPLY', math_node(ng, 'MULTIPLY', math_node(ng, 'COSINE', wave), .012), hf.outputs['Result'])
off = ng.nodes.new('ShaderNodeCombineXYZ'); ng.links.new(dx, off.inputs['X']); ng.links.new(dz, off.inputs['Z'])
sway = ng.nodes.new('GeometryNodeSetPosition')
ng.links.new(real.outputs[0], sway.inputs['Geometry']); ng.links.new(off.outputs[0], sway.inputs['Offset'])
ng.links.new(sway.outputs[0], smat.inputs['Geometry'])
ng.links.new(smat.outputs[0], go.inputs[0])
leaf.modifiers.new('Grow', 'NODES').node_group = ng
# realized geometry loses the INSTANCER attribute: read the stored point copy instead
for n in M_LEAF.node_tree.nodes:
    if n.bl_idname == 'ShaderNodeAttribute': n.attribute_type = 'GEOMETRY'

# ---------------------------------------------------------------- hill
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=160, y_segments=40, size=1)
for v in bm.verts:
    x = v.co.x * 22; y = v.co.y * 4 - 2
    z = .55 * math.exp(-((x - .2) / 5.5) ** 2) - .012 * (x - 1) ** 2 * .35 - .05
    z += .04 * math.sin(x * 1.7) * math.exp(-((x - 3) / 6) ** 2)
    v.co = Vector((x, y, z - .02 * max(0, y - 1)))
hill_me = bpy.data.meshes.new('LH_HillMesh'); bm.to_mesh(hill_me); bm.free()
for p in hill_me.polygons: p.use_smooth = True
hill = bpy.data.objects.new('LH_Hill', hill_me); scene.collection.objects.link(hill)
hill.data.materials.append(M_HILL)
# sink the tree base onto the crest
crest = .55 * math.exp(-((0 - .2) / 5.5) ** 2) - .012 * 1 * .35 - .05
wood.location.z = leaf.location.z = crest - .03
for src, w in ((wood, .016), (leaf, .022), (hill, .02)):
    ink = ink_object(src, w); ink.location = src.location

# ---------------------------------------------------------------- sky
bpy.ops.mesh.primitive_plane_add(size=1, location=(3, 30, 3))
sky = bpy.context.active_object; sky.name = 'LH_Sky'
sky.rotation_euler = (math.radians(90), 0, 0); sky.scale = (80, 40, 1)
m = bpy.data.materials.new('LH_SkyMat'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'EASE'
ramp.color_ramp.elements[0].position = .44; ramp.color_ramp.elements[0].color = hexcol('#1d3d41')
ramp.color_ramp.elements[1].position = .60; ramp.color_ramp.elements[1].color = hexcol('#07171d')
em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs[0], out.inputs['Surface'])
sky.data.materials.append(m)

# ---------------------------------------------------------------- light, camera, render
moon = bpy.data.lights.new('LH_Moon', 'SUN'); moon.energy = 3.2; moon.color = (0.86, 0.93, 0.9)
moon.angle = math.radians(1)
mo = bpy.data.objects.new('LH_Moon', moon); scene.collection.objects.link(mo)
mo.rotation_euler = (math.radians(55), math.radians(-38), math.radians(28))
scene.world = bpy.data.worlds.new('LH_World'); scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value = hexcol('#0a1a1e'); bg.inputs['Strength'].default_value = .25

# Frame from the grown tree's real extent: the tree fills about 72% of the
# height, its base sits a fifth up from the bottom, and it stands in the left
# third so the open sky on the right can carry the headline.
base_z = wood.location.z
xs = [v.x for v in verts] + [l[0].x - l[2] for l in leaves] + [l[0].x + l[2] for l in leaves]
top = max([v.z for v in verts] + [l[0].z + l[2] * .8 for l in leaves]) + base_z
tree_h = top - base_z
cx = (min(xs) + max(xs)) / 2
if PORTRAIT:
    # phones: the whole crown across the width, open sky above it for the words
    frame_w = (max(xs) - min(xs)) * 1.06
    frame_h = frame_w * 16 / 9
    target = Vector((cx, 0, base_z + (.5 - .13) * frame_h))
    MOON = (.24, .40)
else:
    frame_h = tree_h / .72
    frame_w = frame_h * 16 / 9
    target = Vector((cx + .20 * frame_w, 0, base_z + (.5 - .19) * frame_h))
    MOON = (.30, .31)
TILT = math.radians(9)
cam_d = bpy.data.cameras.new('LH_Cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = max(frame_w, frame_h)
cam_d.clip_end = 200
cam = bpy.data.objects.new('LH_Cam', cam_d); scene.collection.objects.link(cam)
cam.rotation_euler = (math.radians(90) - TILT, 0, 0)
forward = Vector((0, math.cos(TILT), -math.sin(TILT)))
cam.location = target - forward * 40
scene.camera = cam

# Two far ridges, flat and unlined, so the night has depth behind the hill
def ridge(name, y, base, amp, seed, colour):
    r = random.Random(seed)
    ph = [r.uniform(0, 6.3) for _ in range(3)]
    base -= y * math.tan(TILT)        # a tilted camera lifts far things: keep the ridge low on screen
    xs_ = [target.x - frame_w + i * (2.4 * frame_w / 120) for i in range(121)]
    top_ = [Vector((x, y, base + amp * (.55 * math.sin(x * .23 + ph[0]) + .3 * math.sin(x * .51 + ph[1]) + .15 * math.sin(x * 1.3 + ph[2])))) for x in xs_]
    bottom = [Vector((x, y, base - 12)) for x in reversed(xs_)]
    me = bpy.data.meshes.new(name); me.from_pydata(top_ + bottom, [], [list(range(len(top_) * 2))])
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    ob.visible_shadow = False
    mat = bpy.data.materials.new(name + 'Mat'); mat.use_nodes = True; t = mat.node_tree; t.nodes.clear()
    em_ = t.nodes.new('ShaderNodeEmission'); em_.inputs['Color'].default_value = hexcol(colour)
    o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(em_.outputs[0], o_.inputs['Surface'])
    me.materials.append(mat)
    return lambda x: base + amp * (.55 * math.sin(x * .23 + ph[0]) + .3 * math.sin(x * .51 + ph[1]) + .15 * math.sin(x * 1.3 + ph[2]))
# The moon, upper right, with a soft halo: it explains where the light comes from
up_v = Vector((0, math.sin(TILT), math.cos(TILT)))
def sky_disc(name, radius, dx, dy, depth, colour, halo=False):
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=radius, fill_type='NGON')
    ob = bpy.context.active_object; ob.name = name
    ob.location = target + Vector((dx * frame_w, 0, 0)) + up_v * dy * frame_h + forward * depth
    ob.rotation_euler = cam.rotation_euler.copy(); ob.visible_shadow = False
    mat = bpy.data.materials.new(name + 'Mat'); mat.use_nodes = True; t = mat.node_tree; t.nodes.clear()
    em_ = t.nodes.new('ShaderNodeEmission'); em_.inputs['Color'].default_value = hexcol(colour)
    o_ = t.nodes.new('ShaderNodeOutputMaterial')
    if halo:
        mat.surface_render_method = 'BLENDED'
        tc_ = t.nodes.new('ShaderNodeTexCoord'); gr = t.nodes.new('ShaderNodeTexGradient'); gr.gradient_type = 'SPHERICAL'
        mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Location'].default_value = (0, 0, 0)
        t.links.new(tc_.outputs['Object'], mp.inputs['Vector']); t.links.new(mp.outputs[0], gr.inputs['Vector'])
        sc_ = t.nodes.new('ShaderNodeMapping'); sc_.vector_type = 'POINT'
        sc_.inputs['Scale'].default_value = (1 / radius, 1 / radius, 1 / radius)
        t.links.new(tc_.outputs['Object'], sc_.inputs['Vector']); t.links.new(sc_.outputs[0], gr.inputs['Vector'])
        pw = t.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 2.4
        mul_ = t.nodes.new('ShaderNodeMath'); mul_.operation = 'MULTIPLY'; mul_.inputs[1].default_value = .22
        t.links.new(gr.outputs['Fac'], pw.inputs[0]); t.links.new(pw.outputs[0], mul_.inputs[0])
        tr = t.nodes.new('ShaderNodeBsdfTransparent'); mix = t.nodes.new('ShaderNodeMixShader')
        t.links.new(mul_.outputs[0], mix.inputs['Fac']); t.links.new(tr.outputs[0], mix.inputs[1]); t.links.new(em_.outputs[0], mix.inputs[2])
        t.links.new(mix.outputs[0], o_.inputs['Surface'])
    else:
        t.links.new(em_.outputs[0], o_.inputs['Surface'])
    ob.data.materials.append(mat)
    return ob
sky_disc('LH_MoonHalo', 2.6, MOON[0], MOON[1], 26, '#3d6466', halo=True)
sky_disc('LH_MoonDisc', .30, MOON[0], MOON[1], 25, '#ece4cc')

far_top = ridge('LH_RidgeFar', 22, base_z + .95, .45, 3, '#11292e')
near_top = ridge('LH_RidgeNear', 12, base_z + .45, .35, 5, '#0c2125')
sky.visible_shadow = False

# ---------------------------------------------------------------- the reader under the tree
# Someone sits with their back to the trunk, knees up, writing in a notebook by
# a lantern. They are there from the first frame: the tree grows over the work.
from mathutils import Quaternion

def hill_z(x, y=0.0):
    z = .55 * math.exp(-((x - .2) / 5.5) ** 2) - .012 * (x - 1) ** 2 * .35 - .05
    z += .04 * math.sin(x * 1.7) * math.exp(-((x - 3) / 6) ** 2)
    return z - .02 * max(0, y - 1)

def metaball(name, parts, resolution=.018):
    mb = bpy.data.metaballs.new(name); mb.resolution = mb.render_resolution = resolution; mb.threshold = .6
    for kind, a, b, r in parts:
        el = mb.elements.new(); el.radius = r
        a, b = Vector(a), Vector(b) if b else None
        if kind == 'ball' or b is None:
            el.type = 'BALL'; el.co = a
        else:
            el.type = 'CAPSULE'; el.co = (a + b) / 2
            seg = b - a; el.size_x = seg.length / 2
            el.rotation = Vector((1, 0, 0)).rotation_difference(seg.normalized())
        if kind == 'ellipsoid':
            el.type = 'ELLIPSOID'; el.size_x, el.size_y, el.size_z = b
    ob = bpy.data.objects.new(name, mb); scene.collection.objects.link(ob)
    return ob

def to_mesh(ob):
    for o in scene.objects: o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    me_ob = bpy.context.view_layer.objects.active
    for p in me_ob.data.polygons: p.use_smooth = True
    return me_ob

S = 1.12                    # seated height of the figure, in scene units
def P(x, y, z): return (x * S, y * S, z * S)
body = metaball('LHP_Jacket', [
    ('cap', P(.00, 0, .16), P(-.08, 0, .52), .17 * S),      # torso, leaning back on the trunk
    ('cap', P(-.07, .13, .53), P(.06, .17, .36), .065 * S),   # upper arms
    ('cap', P(-.07, -.13, .53), P(.06, -.17, .36), .065 * S),
    ('cap', P(.06, .17, .36), P(.21, .07, .44), .055 * S),    # forearms to the notebook
    ('cap', P(.06, -.17, .36), P(.20, -.08, .46), .055 * S),
])
legs = metaball('LHP_Trousers', [
    ('cap', P(.02, .08, .12), P(.30, .09, .40), .085 * S),   # thighs, knees up
    ('cap', P(.02, -.08, .12), P(.30, -.08, .40), .085 * S),
    ('cap', P(.30, .09, .40), P(.43, .10, .06), .07 * S),    # shins
    ('cap', P(.30, -.08, .40), P(.42, -.09, .06), .07 * S),
])
shoes = metaball('LHP_Shoes', [
    ('cap', P(.42, .10, .04), P(.52, .10, .035), .045 * S),
    ('cap', P(.41, -.09, .04), P(.51, -.09, .035), .045 * S),
])
skin = metaball('LHP_Skin', [
    ('ball', P(-.035, 0, .71), None, .105 * S),               # head, bowed to the page
    ('cap', P(-.07, 0, .56), P(-.05, 0, .64), .045 * S),      # neck
    ('ball', P(.068, 0, .695), None, .026 * S),               # nose
    ('ball', P(-.045, .102, .70), None, .028 * S),            # ears
    ('ball', P(-.045, -.102, .70), None, .028 * S),
    ('ball', P(.215, .065, .445), None, .04 * S),             # hands
    ('ball', P(.205, -.075, .465), None, .04 * S),
])
hair = metaball('LHP_Hair', [
    ('ball', P(-.06, 0, .75), None, .108 * S),
    ('ball', P(-.10, 0, .70), None, .085 * S),
    ('ball', P(.015, .03, .79), None, .062 * S),              # a fringe falling forward
    ('ball', P(.02, -.045, .775), None, .05 * S),
    ('ball', P(-.06, .075, .755), None, .06 * S),
    ('ball', P(-.06, -.075, .755), None, .06 * S),
])
shirt = metaball('LHP_Shirt', [
    ('cap', P(-.04, -.08, .585), P(-.04, .08, .585), .042 * S),   # collar
    ('ball', P(.19, .08, .432), None, .035 * S),                   # cuffs
    ('ball', P(.18, -.09, .452), None, .035 * S),
])
person = [to_mesh(o) for o in (body, legs, shoes, skin, hair)]
shirt_m = to_mesh(shirt)

# notebook on the knees, a pen in the right hand
bpy.ops.mesh.primitive_cube_add(size=1)
book = bpy.context.active_object; book.name = 'LHP_Notebook'
book.scale = (.20 * S, .25 * S, .012 * S); book.location = P(.26, 0, .47)
book.rotation_euler = (0, math.radians(-38), 0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.008 * S, depth=.14 * S)
pen = bpy.context.active_object; pen.name = 'LHP_Pen'
pen.location = P(.235, -.09, .52); pen.rotation_euler = (math.radians(35), math.radians(20), 0)

M_JACKET = toon('LH_Jacket', '#1d1310', '#4a2a1f', '#8c5134')
M_TROUSER = toon('LH_Trousers', '#0f161d', '#213140', '#3c5266')
M_SHOE = toon('LH_Shoes', '#0d0a09', '#2a1f1a', '#4d3a2e')
M_SKIN = toon('LH_Skin', '#3a281f', '#7a5440', '#c08f6b')
M_HAIR = toon('LH_Hair', '#0b0909', '#1d1715', '#3b302a')
M_PAGE = toon('LH_Page', '#4d473b', '#a89f86', '#efe5c8')
M_PEN = toon('LH_PenMat', '#0d0d0d', '#262626', '#5a5a5a')
M_SHIRT = toon('LH_Shirt', '#45413a', '#a49c8e', '#e8e0d0')
shirt_m.data.materials.clear(); shirt_m.data.materials.append(M_SHIRT)
# The work beside them: a stack of books and a few loose pages
props = [shirt_m]
def box(name, size, loc, rot, mat):
    bpy.ops.mesh.primitive_cube_add(size=1)
    b = bpy.context.active_object; b.name = name
    b.scale = size; b.location = loc; b.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b.data.materials.append(mat); props.append(b); return b
M_BOOK_A = toon('LH_BookRust', '#2a120b', '#6e3420', '#b1603a')
M_BOOK_B = toon('LH_BookTeal', '#0b1f22', '#1f4d4d', '#3f8079')
M_BOOK_C = toon('LH_BookOchre', '#2b2010', '#76592a', '#c09550')
zb = 0
for i, (m, h) in enumerate(((M_BOOK_B, .055), (M_BOOK_A, .045), (M_BOOK_C, .05), (M_PAGE, .03))):
    box(f'LHP_Book{i}', (.30 * S, .21 * S, h * S), P(.30 + .01 * i, -.46, zb + h / 2), (0, 0, math.radians(8 - 11 * i)), m)
    zb += h
for i, (dx, dy, r) in enumerate(((.66, -.42, 20), (.92, -.30, -35), (.50, -.70, 62))):
    box(f'LHP_Page{i}', (.17 * S, .12 * S, .004 * S), P(dx, dy, .004), (0, 0, math.radians(r)), M_PAGE)
for ob, m in zip(person + [book, pen], (M_JACKET, M_TROUSER, M_SHOE, M_SKIN, M_HAIR, M_PAGE, M_PEN)):
    ob.data.materials.clear(); ob.data.materials.append(m)

# the lantern beside the feet: the one warm light in the night
LANTERN_GOLD = '#f0c46e'
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.065 * S, depth=.15 * S, location=P(.70, -.10, .10))
glass = bpy.context.active_object; glass.name = 'LHP_LanternGlass'
mg = bpy.data.materials.new('LH_LanternGlow'); mg.use_nodes = True; t = mg.node_tree; t.nodes.clear()
e_ = t.nodes.new('ShaderNodeEmission'); e_.inputs['Color'].default_value = hexcol(LANTERN_GOLD); e_.inputs['Strength'].default_value = 2.2
o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e_.outputs[0], o_.inputs['Surface'])
glass.data.materials.append(mg)
M_IRON = toon('LH_Iron', '#0a0a0a', '#1f1c1a', '#3d3631')
lantern = [glass]
for zc, rr, dd in ((.02, .08, .03), (.185, .075, .035)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=rr * S, depth=dd * S, location=P(.70, -.10, zc))
    cap = bpy.context.active_object; cap.data.materials.append(M_IRON); lantern.append(cap)
bpy.ops.mesh.primitive_torus_add(major_radius=.045 * S, minor_radius=.007 * S, location=P(.70, -.10, .23),
                                 rotation=(math.radians(90), 0, 0))
handle = bpy.context.active_object; handle.data.materials.append(M_IRON); lantern.append(handle)
lamp = bpy.data.lights.new('LH_LanternLight', 'POINT'); lamp.energy = 26; lamp.shadow_soft_size = .04
lamp.color = (1.0, .74, .40)
lamp_ob = bpy.data.objects.new('LH_LanternLight', lamp); scene.collection.objects.link(lamp_ob)
lamp_ob.location = P(.70, -.10, .11)
glass.visible_shadow = False
FLICKER = f'(1 + .09*sin(frame*{3*W:.6f}) + .05*sin(frame*{9*W:.6f} + 1.3) + .03*sin(frame*{20*W:.6f} + .7))'
def flicker(owner, path, base):
    fc = owner.driver_add(path); fc.driver.type = 'SCRIPTED'; fc.driver.expression = f'{base}*{FLICKER}'
    for m in list(fc.modifiers): fc.modifiers.remove(m)
flicker(lamp, 'energy', 26)
flicker(e_.inputs['Strength'], 'default_value', 2.2)

# seat the group against the trunk, turned three-quarters toward the viewer
root = bpy.data.objects.new('LHP_Root', None); scene.collection.objects.link(root)
for ob in person + [book, pen] + lantern + [lamp_ob] + props: ob.parent = root
RX = .30
root.location = (RX, -.24, hill_z(RX) - .035)
root.rotation_euler = (0, 0, math.radians(-32))
bpy.context.view_layer.update()
for ob in person + [book, pen] + lantern[1:] + props:
    ink = ink_object(ob, .010)
    ink.matrix_world = ob.matrix_world.copy()

# A warm glow round the lantern, breathing with its flame
def glow_disc(name, centre, radius, colour, peak, falloff):
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=radius, fill_type='NGON')
    ob = bpy.context.active_object; ob.name = name
    ob.location = centre - forward * 1.5          # just in front, so the glow lies over the grass and the feet
    ob.rotation_euler = cam.rotation_euler.copy(); ob.visible_shadow = False
    mat = bpy.data.materials.new(name + 'Mat'); mat.use_nodes = True; mat.surface_render_method = 'BLENDED'
    t = mat.node_tree; t.nodes.clear()
    tc_ = t.nodes.new('ShaderNodeTexCoord'); sc_ = t.nodes.new('ShaderNodeMapping')
    sc_.inputs['Scale'].default_value = (1 / radius,) * 3
    gr = t.nodes.new('ShaderNodeTexGradient'); gr.gradient_type = 'SPHERICAL'
    t.links.new(tc_.outputs['Object'], sc_.inputs['Vector']); t.links.new(sc_.outputs[0], gr.inputs['Vector'])
    pw = t.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = falloff
    amt = t.nodes.new('ShaderNodeMath'); amt.operation = 'MULTIPLY'; amt.inputs[1].default_value = peak
    t.links.new(gr.outputs['Fac'], pw.inputs[0]); t.links.new(pw.outputs[0], amt.inputs[0])
    em_ = t.nodes.new('ShaderNodeEmission'); em_.inputs['Color'].default_value = hexcol(colour)
    tr = t.nodes.new('ShaderNodeBsdfTransparent'); mix = t.nodes.new('ShaderNodeMixShader')
    o_ = t.nodes.new('ShaderNodeOutputMaterial')
    t.links.new(amt.outputs[0], mix.inputs['Fac']); t.links.new(tr.outputs[0], mix.inputs[1]); t.links.new(em_.outputs[0], mix.inputs[2])
    t.links.new(mix.outputs[0], o_.inputs['Surface'])
    ob.data.materials.append(mat)
    flicker(amt.inputs[1], 'default_value', peak)
    return ob
lamp_at = lamp_ob.matrix_world.translation.copy()
glow_disc('LH_LanternGlow', lamp_at, .95, '#e9b65f', .30, 2.6)
glow_disc('LH_LanternCore', lamp_at, .22, '#ffd98c', .55, 1.6)

# stars, baked into the sky behind everything
star_bm = bmesh.new()
srng = random.Random(11)
for i in range(300 if PORTRAIT else 220):
    sx, sy = srng.uniform(-.5, .5), srng.uniform(-.25 if PORTRAIT else -.02, .5)
    if ((sx - MOON[0]) * frame_w) ** 2 + ((sy - MOON[1]) * frame_h) ** 2 < 2.2: continue      # leave the moon's halo clear
    c = target + Vector((sx * frame_w, 0, 0)) + up_v * sy * frame_h + forward * 27
    r = .012 if srng.random() > .1 else .024
    ret = bmesh.ops.create_circle(star_bm, cap_ends=True, segments=6, radius=r)
    bmesh.ops.rotate(star_bm, verts=ret['verts'], cent=(0, 0, 0), matrix=cam.rotation_euler.to_matrix())
    bmesh.ops.translate(star_bm, verts=ret['verts'], vec=c)
star_me = bpy.data.meshes.new('LH_StarsMesh'); star_bm.to_mesh(star_me); star_bm.free()
stars = bpy.data.objects.new('LH_Stars', star_me); scene.collection.objects.link(stars)
stars.rotation_mode = 'XYZ'
ms = bpy.data.materials.new('LH_StarMat'); ms.use_nodes = True; t = ms.node_tree; t.nodes.clear()
e_ = t.nodes.new('ShaderNodeEmission'); e_.inputs['Color'].default_value = hexcol('#d9dccf')
o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e_.outputs[0], o_.inputs['Surface'])
star_me.materials.append(ms); stars.visible_shadow = False


# ---------------------------------------------------------------- the world round the tree
wrng = random.Random(41)
x_lo, x_hi = target.x - frame_w * .62, target.x + frame_w * .62
reader_at = Vector((RX + .45, -.55))
def clear_of_things(x, y):
    return Vector((x, y)).length > .42 and (Vector((x, y)) - reader_at).length > 1.0

# Grass: tufts of curved, tapering blades, thicker near the viewer and the tree
gverts, gfaces, gshade = [], [], []
def tuft(cx, cy, size):
    base_z = hill_z(cx, cy) - .01
    for b in range(wrng.randint(5, 9)):
        a = wrng.uniform(0, 6.283); lean = wrng.uniform(.15, .55); h = size * wrng.uniform(.6, 1.0)
        w = size * .07
        side = Vector((math.cos(a + 1.57), math.sin(a + 1.57), 0)) * w
        root = Vector((cx + wrng.uniform(-.05, .05) * size * 3, cy + wrng.uniform(-.05, .05) * size * 3, base_z))
        out = Vector((math.cos(a), math.sin(a), 0))
        i0 = len(gverts)
        for k in range(4):
            t = k / 3
            c = root + out * lean * h * t * t + Vector((0, 0, h * t))
            ww = 1 - t * .92
            gverts.extend([c - side * ww, c + side * ww])
        for k in range(3):
            gfaces.append((i0 + 2 * k, i0 + 2 * k + 1, i0 + 2 * k + 3, i0 + 2 * k + 2))
for i in range(900):
    x = wrng.uniform(x_lo, x_hi); y = wrng.uniform(-3.4, 1.6)
    near = math.exp(-(x / 3.2) ** 2) * .5 + max(0, -y) * .18
    if wrng.random() > .22 + near or not clear_of_things(x, y): continue
    tuft(x, y, wrng.uniform(.14, .26) * (1.25 if y < -1.5 else 1))
gme = bpy.data.meshes.new('LH_GrassMesh'); gme.from_pydata(gverts, [], gfaces)
grass = bpy.data.objects.new('LH_Grass', gme); scene.collection.objects.link(grass)
M_GRASS = toon('LH_GrassMat', '#081e1e', '#133731', '#24543f', bands=(.32, .72))
gme.materials.append(M_GRASS)
grass.visible_shadow = False

# A few flowers that catch the moon
fl_bm = bmesh.new()
for i in range(16):
    x = wrng.uniform(-3.5, 6.5); y = wrng.uniform(-3.0, .6)
    if not clear_of_things(x, y): continue
    c = Vector((x, y, hill_z(x, y) + wrng.uniform(.10, .18)))
    ret = bmesh.ops.create_icosphere(fl_bm, subdivisions=1, radius=wrng.uniform(.018, .03))
    bmesh.ops.translate(fl_bm, verts=ret['verts'], vec=c)
fl_me = bpy.data.meshes.new('LH_FlowersMesh'); fl_bm.to_mesh(fl_me); fl_bm.free()
flowers = bpy.data.objects.new('LH_Flowers', fl_me); scene.collection.objects.link(flowers)
fl_me.materials.append(toon('LH_FlowerMat', '#3d3a2f', '#8f8668', '#cfc49e')); flowers.visible_shadow = False

# Stones, half sunk in the hill
M_STONE = toon('LH_Stone', '#0d1517', '#26383a', '#4e6462', grain=.14, grain_scale=9)
for i, (x, y, sz) in enumerate(((-.95, -.35, .20), (1.55, -.95, .13), (-2.6, -1.9, .26), (4.3, -2.4, .18), (2.8, .4, .12), (-1.6, .5, .10))):
    sb = bmesh.new(); bmesh.ops.create_icosphere(sb, subdivisions=2, radius=1)
    for v in sb.verts:
        n = v.co.normalized()
        v.co = n * (1 + .16 * math.sin(n.x * 4 + i) * math.sin(n.y * 3.3 + i * .7))
    sm_ = bpy.data.meshes.new(f'LH_Stone{i}Mesh'); sb.to_mesh(sm_); sb.free()
    for pl in sm_.polygons: pl.use_smooth = True
    st = bpy.data.objects.new(f'LH_Stone{i}', sm_); scene.collection.objects.link(st)
    st.scale = (sz * 1.3, sz, sz * .62); st.location = (x, y, hill_z(x, y) - sz * .12)
    st.rotation_euler = (0, 0, wrng.uniform(0, 3.14)); sm_.materials.append(M_STONE)
    ink = ink_object(st, .012); ink.matrix_world = st.matrix_world.copy()

# Small trees standing on the far ridges, for scale
def ridge_trees(name, y, top, count, size, colour):
    tb = bmesh.new()
    for i in range(count):
        x = wrng.uniform(x_lo, x_hi); r = size * wrng.uniform(.7, 1.25)
        zt = top(x)
        for k in range(wrng.randint(2, 4)):
            ret = bmesh.ops.create_circle(tb, cap_ends=True, segments=18, radius=r * wrng.uniform(.55, .85))
            off = Vector((x + wrng.uniform(-.6, .6) * r, y - .02, zt + r * wrng.uniform(.75, 1.25)))
            bmesh.ops.rotate(tb, verts=ret['verts'], cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'X'))
            bmesh.ops.translate(tb, verts=ret['verts'], vec=off)
    me_ = bpy.data.meshes.new(name); tb.to_mesh(me_); tb.free()
    ob = bpy.data.objects.new(name, me_); scene.collection.objects.link(ob); ob.visible_shadow = False
    mat = bpy.data.materials.new(name + 'Mat'); mat.use_nodes = True; t = mat.node_tree; t.nodes.clear()
    em_ = t.nodes.new('ShaderNodeEmission'); em_.inputs['Color'].default_value = hexcol(colour)
    o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(em_.outputs[0], o_.inputs['Surface'])
    me_.materials.append(mat)

# Fireflies: they gather once the tree has grown and drift on closed paths, so
# the ambient film loops without a seam
ff_pts, ff_attr = [], {'p1': [], 'p2': [], 'amp': [], 'k': []}
for i in range(34):
    x = wrng.uniform(-3.8, 4.6); y = wrng.uniform(-1.6, .9)
    z = hill_z(x, y) + wrng.uniform(.35, 2.6)
    ff_pts.append((x, y, z))
    ff_attr['p1'].append(wrng.uniform(0, 6.283)); ff_attr['p2'].append(wrng.uniform(0, 6.283))
    ff_attr['amp'].append(wrng.uniform(.10, .26)); ff_attr['k'].append(float(wrng.choice((1, 1, 2))))
ffo = mesh_object('LH_Fireflies', [Vector(v) for v in ff_pts], [], ff_attr)
ffo.visible_shadow = False
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.022, location=(0, 0, -60))
ff_core = bpy.context.active_object; ff_core.name = 'LH_FireflyCore'; ff_core.hide_render = True
mf = bpy.data.materials.new('LH_FireflyMat'); mf.use_nodes = True; t = mf.node_tree; t.nodes.clear()
e_ = t.nodes.new('ShaderNodeEmission'); e_.inputs['Color'].default_value = hexcol('#ffd97f'); e_.inputs['Strength'].default_value = 3
o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e_.outputs[0], o_.inputs['Surface'])
ff_core.data.materials.append(mf)
halo = glow_disc('LH_FireflyHalo', Vector((0, 0, -60)) + forward * 1.5, .14, '#f3c766', .42, 2.0)
halo.hide_render = True

ng, gi, go = new_group('LH_FireflyDrift')
st_ = ng.nodes.new('GeometryNodeInputSceneTime')
ph = math_node(ng, 'MULTIPLY', st_.outputs['Frame'], W)
kph = math_node(ng, 'MULTIPLY', ph, named(ng, 'k'))
amp = named(ng, 'amp')
ox = math_node(ng, 'MULTIPLY', math_node(ng, 'SINE', math_node(ng, 'ADD', kph, named(ng, 'p1'))), amp)
oy = math_node(ng, 'MULTIPLY', math_node(ng, 'SINE', math_node(ng, 'ADD', kph, named(ng, 'p2'))), math_node(ng, 'MULTIPLY', amp, .5))
oz = math_node(ng, 'MULTIPLY', math_node(ng, 'COSINE', math_node(ng, 'ADD', math_node(ng, 'MULTIPLY', ph, 2.0), named(ng, 'p1'))), math_node(ng, 'MULTIPLY', amp, .45))
off = ng.nodes.new('ShaderNodeCombineXYZ')
for k, v in (('X', ox), ('Y', oy), ('Z', oz)): ng.links.new(v, off.inputs[k])
spos = ng.nodes.new('GeometryNodeSetPosition')
ng.links.new(gi.outputs[0], spos.inputs['Geometry']); ng.links.new(off.outputs[0], spos.inputs['Offset'])
# appear as the crown fills (frames 95 to 140), then blink on their own beat
arrive = ng.nodes.new('ShaderNodeMapRange'); arrive.clamp = True
arrive.inputs['From Min'].default_value = 95; arrive.inputs['From Max'].default_value = 140
ng.links.new(st_.outputs['Frame'], arrive.inputs['Value'])
blink = math_node(ng, 'SINE', math_node(ng, 'ADD', math_node(ng, 'MULTIPLY', ph, 3.0), named(ng, 'p2')))
blink = math_node(ng, 'MULTIPLY_ADD', math_node(ng, 'MULTIPLY', blink, blink), .65, .35)
size = math_node(ng, 'MULTIPLY', arrive.outputs['Result'], blink)
join = ng.nodes.new('GeometryNodeJoinGeometry')
for src_ob, rot in ((ff_core, None), (halo, cam.rotation_euler)):
    oi = ng.nodes.new('GeometryNodeObjectInfo'); oi.inputs['Object'].default_value = src_ob
    oi.transform_space = 'ORIGINAL'
    ip = ng.nodes.new('GeometryNodeInstanceOnPoints')
    ng.links.new(spos.outputs[0], ip.inputs['Points']); ng.links.new(oi.outputs['Geometry'], ip.inputs['Instance'])
    ng.links.new(size, ip.inputs['Scale'])
    if rot is not None: ip.inputs['Rotation'].default_value = rot
    ng.links.new(ip.outputs[0], join.inputs[0])
ng.links.new(join.outputs[0], go.inputs[0])
ffo.modifiers.new('Drift', 'NODES').node_group = ng

# ---------------------------------------------------------------- the day version
# The Warm paper theme: the same hill on a quiet afternoon. Same light setup, so
# the toon bands fall in the same places; only the colours change. No stars,
# no fireflies, the lantern resting.
if DAY:
    def recolor(name, shadow, mid, light):
        els = bpy.data.materials[name].node_tree.nodes['Color Ramp'].color_ramp.elements
        for el, c in zip(els, (shadow, mid, light)): el.color = hexcol(c)
    def emit(name, colour):
        for n in bpy.data.materials[name].node_tree.nodes:
            if n.bl_idname == 'ShaderNodeEmission': n.inputs['Color'].default_value = hexcol(colour)
    recolor('LH_Wood', '#3a291f', '#6b4a34', '#a07652')
    recolor('LH_Leaf', '#2c5134', '#4d7a43', '#8aac5c')
    recolor('LH_Hill', '#5a7343', '#7f9a57', '#adc078')
    recolor('LH_GrassMat', '#47663a', '#6f8d4b', '#9db768')
    recolor('LH_Stone', '#6b675b', '#989282', '#c6bfaa')
    recolor('LH_FlowerMat', '#a9853a', '#deb54f', '#f7de88')
    emit('LH_Ink', '#1b201d')
    els = bpy.data.materials['LH_SkyMat'].node_tree.nodes['Color Ramp'].color_ramp.elements
    els[0].color = hexcol('#f5e8c9'); els[1].color = hexcol('#e2e7d8')
    emit('LH_RidgeFarMat', '#cdd5bf'); emit('LH_RidgeNearMat', '#b2c29f')
    emit('LH_MoonHaloMat', '#f6dc95'); emit('LH_MoonDiscMat', '#fff7e0')
    for ob in (stars, ffo, bpy.data.objects['LH_LanternGlow'], bpy.data.objects['LH_LanternCore']):
        ob.hide_render = True
    lamp.animation_data_clear(); lamp.energy = 3
    mg.node_tree.animation_data_clear()
    for n in mg.node_tree.nodes:
        if n.bl_idname == 'ShaderNodeEmission': n.inputs['Strength'].default_value = .6
    moon.color = (1.0, .96, .88)
    bg.inputs['Color'].default_value = hexcol('#d6dccb')

scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y = (1080, 1920) if PORTRAIT else (1920, 1080)
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, LAST
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.film_transparent = False
try: scene.eevee.taa_render_samples = 16
except Exception: pass

bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('RESULT', {'branches': len(polylines), 'points': len(verts), 'leaves': len(leaves), 'span': round(span, 2),
                 'tree_h': round(tree_h, 2), 'x': (round(min(xs), 2), round(max(xs), 2)), 'ortho': round(frame_w, 2), 'out': OUT})
