"""Longhand IHSG weekly cover, 13 November 2026: 'A Smaller Index, a Narrow Rally'.

A view from above the clouds. A jet half sunk in the cloud tops, a round gap in the clouds,
and sunlight through the gap onto the exchange district, where five porters hold a bull
balloon and a roped seating area is being cleared. Flat toon shading with Freestyle ink lines.
Run inside Blender 5.x. Builds everything in a new scene called LonghandCover.
"""
import bpy, math, random
from mathutils import Vector

random.seed(1113)
SCENE_NAME = "LonghandCover"

# ---------- scene ----------
if SCENE_NAME in bpy.data.scenes:
    old = bpy.data.scenes[SCENE_NAME]
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(SCENE_NAME)
if bpy.context.window:
    bpy.context.window.scene = scene
root = scene.collection

def coll(name):
    c = bpy.data.collections.new(name)
    root.children.link(c)
    return c

C_CLOUD, C_CITY, C_STORY, C_PLANE, C_SMALL = coll("Clouds"), coll("City"), coll("Story"), coll("Plane"), coll("NoInk")

# ---------- toon material ----------
INK = (0.11, 0.15, 0.20)
def hexc(h):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4) for c in srgb) + (1.0,)

_mats = {}
def toon(name, color, shade=0.72, bands=None, shade_rgb=None, edge=0.18):
    key = (name, color, shade, bands, shade_rgb, edge)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (shade_rgb or (shade, shade, shade)) + (1,)
    ramp.color_ramp.elements[1].position = edge
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = 1.0
    base = hexc(color)
    nt.links.new(diff.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mix.inputs[6])
    if bands:
        # Floor bands: a constant wave along object Z darkens alternate strips (windows).
        tc = nt.nodes.new("ShaderNodeTexCoord")
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'Z'
        wave.inputs['Scale'].default_value = bands
        r2 = nt.nodes.new("ShaderNodeValToRGB")
        r2.color_ramp.interpolation = 'CONSTANT'
        r2.color_ramp.elements[0].color = base
        r2.color_ramp.elements[1].position = 0.62
        dark = tuple(c * 0.78 for c in base[:3]) + (1,)
        r2.color_ramp.elements[1].color = dark
        nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
        nt.links.new(wave.outputs['Fac'], r2.inputs[0])
        nt.links.new(r2.outputs[0], mix.inputs[7])
    else:
        mix.inputs[7].default_value = base
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(mix.outputs[2], em.inputs[0])
    nt.links.new(em.outputs[0], out.inputs[0])
    _mats[key] = m
    return m

def put(obj, c, mat=None, smooth=False):
    for uc in obj.users_collection:
        uc.objects.unlink(obj)
    c.objects.link(obj)
    if mat:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    if smooth and obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj

def box(name, c, loc, size, color, rot=(0, 0, 0), bands=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return put(o, c, toon(name.split('_')[0], color, bands=bands))

def ball(name, c, loc, r, color, scale=(1, 1, 1), sub=3, shade=0.72, shade_rgb=None, edge=0.18):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return put(o, c, toon(name.split('_')[0], color, shade=shade, shade_rgb=shade_rgb, edge=edge), smooth=True)

def cyl(name, c, a, b, r, color, verts=10):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.active_object
    o.name = name
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return put(o, c, toon(name.split('_')[0], color))

def cone(name, c, loc, r1, r2, depth, color, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return put(o, c, toon(name.split('_')[0], color), smooth=True)

def slab(name, c, pts, z, thick, color):
    me = bpy.data.meshes.new(name)
    n = len(pts)
    verts = [(x, y, z) for x, y in pts] + [(x, y, z + thick) for x, y in pts]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me)
    c.objects.link(o)
    o.data.materials.append(toon(name.split('_')[0], color))
    return o

# ---------- v7 layout: looking straight down past skyscrapers ----------
# The camera hangs above the clouds and looks straight down. Tall towers rise toward it, so
# their sides converge on the plaza in the middle of the light. Clouds cover the top third
# and the edges, with tower crowns poking through. The jet sits on the clouds at upper left.
CAM_Z = 950.0
CLOUD_Z = 300.0
GAP_C = Vector((0, -150))
GAP_RX, GAP_RY = 290.0, 360.0
PLAZA = Vector((0, -35))

def gap_e(x, y, pad=0.0):
    """Normalised distance from the gap centre (1 = rim), with a wobbly rim."""
    dx, dy = x - GAP_C.x, y - GAP_C.y
    t = math.atan2(dy / GAP_RY, dx / GAP_RX)
    wob = 1 + 0.07 * math.sin(3 * t + 1.0) + 0.05 * math.sin(5 * t + 2.0)
    return math.sqrt((dx / (GAP_RX * wob + pad)) ** 2 + (dy / (GAP_RY * wob + pad)) ** 2)

# Ground and roads
box("Ground_base", C_CITY, (0, 0, -1), (6000, 6000, 2), "#efe2c4")
ROADS_X = (-430, -310, -190, -70, 70, 190, 310, 430)
ROADS_Y = (-710, -590, -470, -350, -230, -110, 40, 160, 280, 400, 520, 640)
for x in ROADS_X:
    box(f"Road_v{x}", C_CITY, (x, 0, 0.05), (18, 1600, 0.1), "#8a8e96")
for y in ROADS_Y:
    box(f"Road_h{y}", C_CITY, (0, y, 0.06), (1100, 18, 0.1), "#8a8e96")

# Plaza and the exchange towers just north of it
box("Plaza_floor", C_CITY, (PLAZA.x, PLAZA.y, 0.15), (124, 132, 0.2), "#f6ead2")
for i in range(-2, 3, 2):
    box(f"Plaza_band{i}", C_CITY, (i * 22, PLAZA.y, 0.22), (22, 132, 0.05), "#ead2a8")
TB = 0.04  # band scale: a darker floor stripe about every eight metres
for sx in (-34, 34):
    box(f"Tower_main{sx}", C_CITY, (sx, 100, 95), (34, 34, 190), "#5f97cf", bands=TB)
    box(f"Tower_crown{sx}", C_CITY, (sx, 100, 196), (27, 27, 12), "#7fb0de")
    box(f"Tower_top{sx}", C_CITY, (sx, 100, 207), (18, 18, 10), "#9cc4e8")
    box(f"Tower_mast{sx}", C_CITY, (sx, 100, 222), (3, 3, 20), "#e8eef4")
box("Podium_link", C_CITY, (0, 100, 11), (40, 30, 22), "#e7eef5")

# Skyscraper field, block by block
GLASS = ["#5f97cf", "#6fb3c8", "#87a9d6", "#4f86b8", "#9cc4e8"]
STONE = ["#f2e6cc", "#e4a079", "#d9d4cb", "#c9876a", "#efd59c", "#b9c7cf"]
towers = 0

def tower(x, y, w, d, h, col, kind):
    global towers
    n = f"Bldg_{towers}"
    towers += 1
    if kind == "round":
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=w / 2, depth=h, location=(x, y, h / 2))
        o = bpy.context.active_object
        o.name = n
        put(o, C_CITY, toon("Bldg", col, bands=TB))
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=w * 0.36, depth=10, location=(x, y, h + 5))
        put(bpy.context.active_object, C_CITY, toon("Roof", "#c9d3db"))
        return h + 10
    tiers = [(1.0, 0.62), (0.82, 0.86), (0.62, 1.0)] if kind == "step" else [(1.0, 1.0)]
    z0 = 0.0
    for k, (f, top) in enumerate(tiers):
        zt = h * top
        box(f"{n}_t{k}", C_CITY, (x, y, (z0 + zt) / 2), (w * f, d * f, zt - z0), col, bands=TB)
        z0 = zt
    f = tiers[-1][0]
    box(f"{n}_cap", C_CITY, (x, y, h + 3), (w * f * 0.55, d * f * 0.55, 6), "#d5dbe0")
    if random.random() < 0.4:
        box(f"{n}_mast", C_CITY, (x, y, h + 14), (2.4, 2.4, 22), "#e8eef4")
    return h + 6

xs = [-550] + list(ROADS_X) + [550]
ys = [-830] + list(ROADS_Y) + [760]
for i in range(len(xs) - 1):
    for j in range(len(ys) - 1):
        x0, x1, y0, y1 = xs[i] + 12, xs[i + 1] - 12, ys[j] + 12, ys[j + 1] - 12
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        if x0 < PLAZA.x < x1 and y0 < PLAZA.y < y1:
            continue                      # plaza block
        if x0 < 0 < x1 and y0 < 100 < y1:
            continue                      # exchange block
        dist = math.hypot(cx - PLAZA.x, cy - PLAZA.y)
        if random.random() < 0.12 and dist > 200:
            box(f"Lawn_{i}_{j}", C_CITY, (cx, cy, 0.1), (x1 - x0, y1 - y0, 0.12), "#9fca7c")
            for t in range(10):
                ball(f"Tree_{i}_{j}_{t}", C_CITY, (random.uniform(x0 + 8, x1 - 8), random.uniform(y0 + 8, y1 - 8), 6), random.uniform(5, 8), random.choice(["#5f9d58", "#78b465", "#4f8a4d"]), scale=(1, 1, 0.8), sub=2)
            continue
        n_t = 1 if random.random() < 0.6 else 2
        for k in range(n_t):
            if n_t == 1:
                tx, ty, w, d = cx + random.uniform(-10, 10), cy + random.uniform(-10, 10), random.uniform(44, 62), random.uniform(44, 62)
            else:
                horiz = (x1 - x0) >= (y1 - y0)
                off = (-1 if k == 0 else 1) * ((x1 - x0) / 4 if horiz else (y1 - y0) / 4)
                tx, ty = (cx + off, cy) if horiz else (cx, cy + off)
                w, d = random.uniform(30, 40), random.uniform(30, 40)
            if dist < 170:
                h = random.uniform(30, 80)
            else:
                h = random.uniform(150, 420)
            if ty > 170 and gap_e(tx, ty) > 0.95:
                h = min(h, 270)           # stays under the cloud sheet, keeps the headline area clear
            kind = random.choice(["box", "step", "step", "round"]) if h > 100 else "box"
            col = random.choice(GLASS) if random.random() < 0.6 else random.choice(STONE)
            tower(tx, ty, w, d, h, col, kind)

# A few named crowns that poke through the cloud sheet where the sketch put them
tower(130, 215, 46, 46, 420, "#4f86b8", "step")
tower(250, 100, 50, 44, 400, "#6fb3c8", "step")
tower(-250, 215, 44, 44, 395, "#e4a079", "box")

# Cars on the roads near the plaza
car_cols = ["#e9473f", "#f4c542", "#2f6db5", "#ffffff", "#3d9b6d", "#f08a2b"]
for i in range(60):
    if random.random() < 0.5:
        x = random.choice(ROADS_X) + random.choice((-4, 4)); y = random.uniform(-500, 300); rot = 0
    else:
        y = random.choice(ROADS_Y) + random.choice((-4, 4)); x = random.uniform(-300, 300); rot = math.pi / 2
    box(f"Car_{i}", C_CITY, (x, y, 1.0), (2.6, 5.5, 2.0), random.choice(car_cols), rot=(0, 0, rot))

# ---------- story: bull balloon, five porters, the seating area being cleared ----------
GOLD = "#f2a62e"
BULL = Vector((0, -50, 150))
S = 1.6
ball("Bull_body", C_STORY, BULL, 1, GOLD, scale=(40 * S, 17 * S, 17 * S), sub=4, shade_rgb=(0.80, 0.55, 0.35), edge=0.3)
ball("Bull_head", C_STORY, BULL + Vector((40, 0, 10)) * S, 12 * S, GOLD, scale=(1.1, 0.9, 1.0), sub=4)
ball("Bull_snout", C_STORY, BULL + Vector((51, 0, 6)) * S, 6.5 * S, "#f6c27a", scale=(0.8, 1.1, 0.8), sub=3)
for s in (-1, 1):
    cone(f"Horn_{s}", C_STORY, BULL + Vector((41, s * 11, 25)) * S, 3.0 * S, 0.8, 11 * S, "#fbf4e3", rot=(s * -0.55, -0.25, 0))
    ball(f"Ear_{s}", C_STORY, BULL + Vector((36, s * 13, 16)) * S, 4 * S, GOLD, scale=(0.6, 1.2, 0.5), sub=2)
for lx in (-24, 22):
    for s in (-1, 1):
        ball(f"Leg_{lx}{s}", C_STORY, BULL + Vector((lx, s * 9, -18)) * S, 6 * S, GOLD, scale=(1, 1, 1.8), sub=3)
cyl("Tail_a", C_STORY, BULL + Vector((-38, 0, 6)) * S, BULL + Vector((-50, 0, 2)) * S, 1.6 * S, GOLD)
ball("Bull_hump", C_STORY, BULL + Vector((18, 0, 14)) * S, 15 * S, GOLD, scale=(1.3, 1.0, 0.75), sub=4, shade_rgb=(0.80, 0.55, 0.35), edge=0.3)
ball("Bull_nose", C_STORY, BULL + Vector((56, 0, 5)) * S, 3.2 * S, "#e07b55", scale=(0.6, 1.4, 0.7), sub=2)
for s_ in (-1, 1):
    ball(f"Eye_{s_}", C_STORY, BULL + Vector((46, s_ * 6.5, 19)) * S, 1.9 * S, "#1f2a36", sub=2)
ball("Tail_tuft", C_STORY, BULL + Vector((-52, 0, 1)) * S, 3.2 * S, "#c97a1c", sub=2)

NAVY, SKIN = "#2b3f66", "#c98e63"
anchors = [BULL + Vector((ax, ay, -24)) * S for ax, ay in [(-20, -6), (-8, 7), (6, -7), (18, 6), (-30, 4)]]
group = Vector((-28, -62, 0))
for i, a in enumerate(anchors):
    p = group + Vector((i * 11 - 22, (i % 2) * 8, 0))
    cyl(f"Porter_body{i}", C_STORY, p, p + Vector((0, 0, 10)), 3.2, NAVY)
    ball(f"Porter_head{i}", C_STORY, p + Vector((0, 0, 12)), 2.8, SKIN, sub=2)
    cyl(f"Rope_{i}", C_STORY, p + Vector((0, 0, 9)), a, 0.9, "#5a3a22", verts=6)

shirts = ["#e9473f", "#ffffff", "#f4c542", "#3d9b6d", "#2f6db5", "#f08a2b", "#c75b8f", "#8ad0e0"]
for i in range(60):
    side = random.random()
    if side < 0.5:
        x, y = random.uniform(-58, 58), PLAZA.y - 62 + random.uniform(0, 6)
    elif side < 0.75:
        x, y = -58 + random.uniform(0, 6), random.uniform(PLAZA.y - 60, PLAZA.y + 60)
    else:
        x, y = random.uniform(-58, 0), PLAZA.y + 60 - random.uniform(0, 6)
    cyl(f"Crowd_body{i}", C_STORY, (x, y, 0.3), (x, y, 7.0), 2.6, random.choice(shirts))
    ball(f"Crowd_head{i}", C_STORY, (x, y, 8.6), 2.2, random.choice([SKIN, "#a8724f", "#e2b48c", "#2d2a2a"]), sub=2)

SEAT = Vector((32, -5))
for dx, dy, w, h in [(0, 21, 50, 1.0), (0, -21, 50, 1.0), (25, 0, 1.0, 42), (-25, 0, 1.0, 42)]:
    box(f"Rope_line{dx}{dy}", C_STORY, (SEAT.x + dx, SEAT.y + dy, 1.4), (w, h, 0.5), "#c0392b")
for cx in range(-21, 1, 5):
    for cy in range(-16, 17, 5):
        box(f"Chair_{cx}_{cy}", C_STORY, (SEAT.x + cx, SEAT.y + cy, 1.2), (3.2, 3.2, 2.4), "#ffffff")
for k, (dx, dy) in enumerate([(8, -12), (14, -8), (20, -14)]):
    box(f"Stack_{k}", C_STORY, (SEAT.x + dx, SEAT.y + dy, 5.0), (3.4, 3.4, 10.0), "#ffffff")
for k, (dx, dy) in enumerate([(12, 8), (19, 3)]):
    p = Vector((SEAT.x + dx, SEAT.y + dy, 0))
    cyl(f"Worker_body{k}", C_STORY, p + Vector((0, 0, 0.3)), p + Vector((0, 0, 7.0)), 2.6, "#f07f2a")
    ball(f"Worker_head{k}", C_STORY, p + Vector((0, 0, 8.6)), 2.2, SKIN, sub=2)

# ---------- clouds: a sheet with a big ragged gap, plus low wisps inside the rim ----------
WHITE = "#ffffff"
C_SOFT = coll("CloudSoft")
JET = Vector((-150, 250, CLOUD_Z + 62))
CLOUD_KW = dict(scale=(1, 1, 0.62), sub=3, shade_rgb=(0.74, 0.82, 0.95), edge=0.42)
count = 0
for i in range(20000):
    x, y = random.uniform(-470, 470), random.uniform(-720, 720)
    rad = random.uniform(30, 58)
    e = gap_e(x, y, pad=rad * 0.5)
    if e < 1.0:
        continue
    if e < 1.18:
        rad *= 0.8
    z = CLOUD_Z + random.uniform(-6, 14) + (8 if e < 1.18 else 0)
    if (Vector((x, y)) - JET.xy).length < 110:
        z -= 26
    # Only the raised rim ring gets ink. In the sheet the puff edges sink into their
    # neighbours and Freestyle draws stray short arcs, so the sheet relies on shading.
    ball(f"Cloud_{count}", C_CLOUD if e < 1.18 else C_SOFT, (x, y, z), rad, WHITE, **CLOUD_KW)
    count += 1
    if count > 900:
        break
wisps = 0

# ---------- jet half sunk in the cloud tops ----------
JS = 2.4
head = Vector((-1, -0.35, 0)).normalized()
side = Vector((-head.y, head.x, 0))
cyl("Jet_body", C_PLANE, JET - head * 26 * JS, JET + head * 22 * JS, 3.6 * JS, WHITE, verts=16)
ball("Jet_nose", C_PLANE, JET + head * 22 * JS, 3.6 * JS, WHITE, scale=(1, 1, 1), sub=3)
ball("Jet_window", C_PLANE, JET + (head * 23.2 + Vector((0, 0, 1.6))) * JS, 1.6 * JS, "#2b3f66", scale=(1.2, 1.2, 0.6), sub=2)
for s in (-1, 1):
    q = lambda f, g: tuple((JET + (head * f + side * s * g) * JS)[:2])
    slab(f"Jet_wing{s}", C_PLANE, [q(6, 2), q(-4, 2), q(-11, 27), q(-7, 27)], JET.z - 0.6 * JS, 0.9 * JS, "#e6edf3")
    eng = JET + (head * 1 + side * s * 11 + Vector((0, 0, -2.5))) * JS
    cyl(f"Jet_engine{s}", C_PLANE, eng - head * 4 * JS, eng + head * 4 * JS, 1.8 * JS, "#d7dee5", verts=12)
    slab(f"Jet_tailwing{s}", C_PLANE, [q(-20, 1), q(-25, 1), q(-28, 10), q(-25.5, 10)], JET.z + 0.6 * JS, 0.6 * JS, "#e6edf3")
fin = [JET + (-head * 19) * JS + Vector((0, 0, 2.5 * JS)), JET + (-head * 26) * JS + Vector((0, 0, 2.5 * JS)), JET + (-head * 28.5) * JS + Vector((0, 0, 12 * JS)), JET + (-head * 25) * JS + Vector((0, 0, 12 * JS))]
me = bpy.data.meshes.new("Jet_fin")
off = side * 0.5 * JS
verts = [tuple(v - off) for v in fin] + [tuple(v + off) for v in fin]
me.from_pydata(verts, [], [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
fo = bpy.data.objects.new("Jet_fin", me); C_PLANE.objects.link(fo); fo.data.materials.append(toon("Jet", "#2f6db5"))
for k, (fx, fy) in enumerate([(-22, -10), (-30, 8), (10, -14)]):
    p = JET + (head * fx + side * fy) * JS
    ball(f"Cloud_jet{k}", C_CLOUD, (p.x, p.y, CLOUD_Z + 44), random.uniform(19, 24), WHITE, **CLOUD_KW)

SMALL = ("Porter_", "Rope_", "Crowd_", "Chair_", "Stack_", "Worker_", "Carried_", "Post_", "Car_", "Tree_")
for o in list(scene.objects):
    if o.name.startswith(SMALL):
        for uc in o.users_collection:
            uc.objects.unlink(o)
        C_SMALL.objects.link(o)

# ---------- light, world, camera ----------
sun_d = Vector((0.30, 0.22, -0.93)).normalized()
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN'))
sun.data.energy = 4.0
sun.data.angle = math.radians(0.6)
sun.rotation_mode = 'QUATERNION'
sun.rotation_quaternion = (-sun_d).to_track_quat('Z', 'Y')
root.objects.link(sun)

world = bpy.data.worlds.new("CoverSky")
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
bg = wn["Background"]
bg.inputs[0].default_value = hexc("#dbe6f6")
bg.inputs[1].default_value = 1.0
lp = wn.new("ShaderNodeLightPath")
black = wn.new("ShaderNodeBackground"); black.inputs[1].default_value = 0.0
mixw = wn.new("ShaderNodeMixShader")
wl.new(lp.outputs["Is Camera Ray"], mixw.inputs[0])
wl.new(black.outputs[0], mixw.inputs[1])
wl.new(bg.outputs[0], mixw.inputs[2])
wl.new(mixw.outputs[0], wn["World Output"].inputs[0])
scene.world = world

cam = bpy.data.objects.new("CoverCam", bpy.data.cameras.new("CoverCam"))
cam.location = (0, 0, CAM_Z)
cam.rotation_euler = (0, 0, 0)        # straight down, image up = north
cam.data.lens = 22
cam.data.sensor_fit = 'VERTICAL'
cam.data.sensor_height = 36
cam.data.clip_end = 5000
root.objects.link(cam)
scene.camera = cam

# ---------- render ----------
r = scene.render
r.engine = 'BLENDER_EEVEE'
r.resolution_x, r.resolution_y, r.resolution_percentage = 2048, 3072, 100
r.film_transparent = False
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
ee = scene.eevee
for attr, val in (("taa_render_samples", 32), ("use_shadows", True), ("shadow_resolution_scale", 1.0)):
    if hasattr(ee, attr):
        setattr(ee, attr, val)

r.use_freestyle = True
r.line_thickness_mode = 'ABSOLUTE'
r.line_thickness = 2.6
vl = scene.view_layers[0]
fs = vl.freestyle_settings
fs.crease_angle = math.radians(128)
ls = fs.linesets[0] if fs.linesets else fs.linesets.new("Ink")
ls.select_by_visibility = True
ls.visibility = 'VISIBLE'
ls.select_by_edge_types = True
ls.select_silhouette = True
ls.select_border = True
ls.select_crease = True
ls.linestyle.color = INK
ls.linestyle.thickness = 2.6
tm = ls.linestyle.thickness_modifiers.new("Far", 'DISTANCE_FROM_CAMERA')
tm.range_min, tm.range_max = 400.0, 950.0
tm.value_min, tm.value_max = 1.0, 0.55
tm.blend = 'MULTIPLY'
ls.linestyle.use_length_min = True
ls.linestyle.length_min = 40.0
# Two linesets: buildings, bull and jet keep the long-stroke filter. Clouds get their own
# set with a short minimum, so the arcs between overlapping puffs are not dropped.
C_INK = coll("InkMain")
for c_ in (C_CITY, C_STORY, C_PLANE):
    root.children.unlink(c_)
    C_INK.children.link(c_)
ls.select_by_collection = True
ls.collection = C_INK
ls.collection_negation = 'INCLUSIVE'
lc = fs.linesets.new("CloudInk")
lc.select_by_visibility = True
lc.visibility = 'VISIBLE'
lc.select_by_edge_types = True
lc.select_silhouette = True
lc.select_border = True
lc.select_crease = False
lc.select_by_collection = True
lc.collection = C_CLOUD
lc.collection_negation = 'INCLUSIVE'
lc.linestyle = bpy.data.linestyles.new("CloudLine")
lc.linestyle.color = INK
lc.linestyle.thickness = 2.2
lc.linestyle.use_length_min = True
lc.linestyle.length_min = 10.0

result = {"clouds": count, "wisps": wisps, "towers": towers, "objects": len(scene.objects)}
