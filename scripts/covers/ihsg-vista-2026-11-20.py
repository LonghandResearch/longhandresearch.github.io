"""Longhand IHSG weekly cover, 20 November 2026: 'The World Sold AI. Jakarta Sold Its Miners.'

A wide view over Jakarta in late-afternoon sun, with no figure in focus. A terraced gold and copper
pit sits in the foreground, the twin exchange towers stand in the sun in the middle distance, and a
storm with curtains of rain rolls in over the sea on the left.
Flat toon shading with Freestyle ink lines, like the 13 November cover.
Run inside Blender 5.x. Builds everything in a new scene called LonghandCover.
"""
import bpy, bmesh, math, random
from mathutils import Vector

random.seed(1120)
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

def coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or root).children.link(c)
    return c

C_INK = coll("InkMain")
C_LAND, C_CITY, C_STORY = coll("Land", C_INK), coll("City", C_INK), coll("Story", C_INK)
C_CLOUD = coll("Clouds")
C_SOFT = coll("NoInk")

CAM = Vector((0.0, -1300.0, 320.0))
HAZE = (0.949, 0.890, 0.776)        # warm late-afternoon haze, linear-ish mix target in sRGB space

def hex_srgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def lin(c):
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)

def hazed(col, dist):
    """Mix toward the haze with distance, in steps so materials stay few."""
    f = min(0.6, max(0.0, (dist - 1500.0) / 4200.0))
    f = round(f * 10) / 10
    c = hex_srgb(col)
    return tuple(c[i] * (1 - f) + HAZE[i] * f for i in range(3)), f

_mats = {}
def toon(name, col_srgb, shade=0.74, shade_rgb=None, edge=0.2, bands=None):
    key = (name, tuple(round(v, 3) for v in col_srgb), shade, shade_rgb, edge, bands)
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
    base = lin(col_srgb)
    nt.links.new(diff.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mix.inputs[6])
    if bands:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'Z'
        wave.inputs['Scale'].default_value = bands
        r2 = nt.nodes.new("ShaderNodeValToRGB")
        r2.color_ramp.interpolation = 'CONSTANT'
        r2.color_ramp.elements[0].color = base
        r2.color_ramp.elements[1].position = 0.62
        r2.color_ramp.elements[1].color = tuple(c * 0.8 for c in base[:3]) + (1,)
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

def put(o, c, mat=None, smooth=False):
    for uc in o.users_collection:
        uc.objects.unlink(o)
    c.objects.link(o)
    if mat:
        o.data.materials.clear()
        o.data.materials.append(mat)
    if smooth and o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True
    return o

def dist_to_cam(loc):
    return (Vector(loc) - CAM).length

def box(name, c, loc, size, col, rot=(0, 0, 0), bands=None, haze=True, shade=0.74):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    c_s, f = hazed(col, dist_to_cam(loc)) if haze else (hex_srgb(col), 0)
    return put(o, c, toon(name.split('_')[0], c_s, shade=shade + (1 - shade) * f * 0.6, bands=bands))

def ball(name, c, loc, r, col, scale=(1, 1, 1), sub=2, shade=0.74, shade_rgb=None, edge=0.2, haze=True):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    c_s, f = hazed(col, dist_to_cam(loc)) if haze else (hex_srgb(col), 0)
    return put(o, c, toon(name.split('_')[0], c_s, shade=shade, shade_rgb=shade_rgb, edge=edge), smooth=True)

def cyl(name, c, a, b, r, col, verts=10, haze=True):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.active_object
    o.name = name
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    c_s, f = hazed(col, dist_to_cam((a + b) / 2)) if haze else (hex_srgb(col), 0)
    return put(o, c, toon(name.split('_')[0], c_s))

def mesh_obj(name, c, verts, faces, col, smooth=False, haze_at=None, shade=0.74):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    c.objects.link(o)
    c_s = hazed(col, dist_to_cam(haze_at))[0] if haze_at else hex_srgb(col)
    o.data.materials.append(toon(name.split('_')[0], c_s, shade=shade))
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return o

# ---------- land with a hole for the pit, and the sea ----------
PIT = Vector((-80.0, -520.0))
PIT_R = 230.0
BENCHES, BENCH_H = 8, 13.0
BENCH_W = (PIT_R - 50.0) / BENCHES
SEG = 72
COAST_Y = 2200.0

def ring_pts(cx, cy, r, z):
    return [(cx + r * math.cos(2 * math.pi * i / SEG), cy + r * math.sin(2 * math.pi * i / SEG), z) for i in range(SEG)]

# Land: an annulus around the pit out to a big square edge, built as quads to a far circle.
inner = ring_pts(PIT.x, PIT.y, PIT_R, 0.0)
outer = ring_pts(PIT.x, PIT.y, 9000.0, 0.0)
verts = inner + outer
faces = [(i, (i + 1) % SEG, SEG + (i + 1) % SEG, SEG + i) for i in range(SEG)]
mesh_obj("Land_ground", C_LAND, verts, [tuple(reversed(f)) for f in faces], "#ddd5b8")
ap_in = ring_pts(PIT.x, PIT.y, PIT_R, 0.25)
ap_out = ring_pts(PIT.x, PIT.y, PIT_R + 75.0, 0.25)
mesh_obj("Apron_pit", C_SOFT, ap_in + ap_out, [tuple(reversed(f)) for f in faces], "#ead2a0")
mesh_obj("Field_near", C_SOFT, [(-900, -940, 0.15), (900, -940, 0.15), (900, -760, 0.15), (-900, -760, 0.15)], [(0, 1, 2, 3)], "#bcd18f")

# Pit benches and walls, stepping down. Bench colours alternate gold, copper and sand.
BENCH_COLS = ["#e2b26c", "#c47a46", "#edc98f", "#b8693f", "#dcae6a", "#c98552", "#e6bf86", "#c27a48"]
WALL_COLS = ["#a86a3c", "#8f5232", "#b47a48", "#86492c", "#a46a3e", "#93583a", "#a8743f", "#8c5434"]
for k in range(BENCHES):
    r_out = PIT_R - k * BENCH_W
    r_in = r_out - BENCH_W * 0.45            # bench is the flat outer part, wall drops at r_in
    z_top = -k * BENCH_H
    z_bot = -(k + 1) * BENCH_H
    a = ring_pts(PIT.x, PIT.y, r_out, z_top)
    b = ring_pts(PIT.x, PIT.y, r_in, z_top)
    vb = a + b
    fb = [(i, SEG + i, SEG + (i + 1) % SEG, (i + 1) % SEG) for i in range(SEG)]
    mesh_obj(f"Bench_{k}", C_LAND, vb, fb, BENCH_COLS[k])
    r_next = r_out - BENCH_W                 # top of the next bench, slightly inside
    c1 = ring_pts(PIT.x, PIT.y, r_in, z_top)
    c2 = ring_pts(PIT.x, PIT.y, r_next, z_bot)
    vw = c1 + c2
    fw = [(i, SEG + i, SEG + (i + 1) % SEG, (i + 1) % SEG) for i in range(SEG)]
    mesh_obj(f"Wall_{k}", C_LAND, vw, [tuple(reversed(f)) for f in fw], WALL_COLS[k], shade=0.66)
floor_r = PIT_R - BENCHES * BENCH_W
fv = ring_pts(PIT.x, PIT.y, floor_r, -BENCHES * BENCH_H)
mesh_obj("Floor_pit", C_LAND, fv, [tuple(range(SEG))], "#d6a463")
pv = ring_pts(PIT.x + 6, PIT.y + 10, floor_r * 0.55, -BENCHES * BENCH_H + 0.3)
mesh_obj("Pool_pit", C_LAND, [(x, y * 1.0, z) for x, y, z in pv], [tuple(range(SEG))], "#6fa6b8")

# Haul road: a ramp line drawn as small boxes along one bench, and a yellow truck on it
def on_bench(k, ang, lift=0.0):
    r = PIT_R - k * BENCH_W - BENCH_W * 0.22
    return Vector((PIT.x + r * math.cos(ang), PIT.y + r * math.sin(ang), -k * BENCH_H + lift))

def truck(name, p, heading, s=1.0):
    fwd = Vector((math.cos(heading), math.sin(heading), 0))
    side = Vector((-fwd.y, fwd.x, 0))
    rot = (0, 0, heading)
    box(f"{name}_bed", C_STORY, p + fwd * (-2.0 * s) + Vector((0, 0, 4.6 * s)), (8.5 * s, 6.2 * s, 3.2 * s), "#f2b134", rot=rot, haze=False)
    box(f"{name}_cab", C_STORY, p + fwd * (4.4 * s) + Vector((0, 0, 4.4 * s)), (3.2 * s, 5.4 * s, 3.4 * s), "#f6c453", rot=rot, haze=False)
    box(f"{name}_chassis", C_STORY, p + Vector((0, 0, 2.4 * s)), (12.0 * s, 5.0 * s, 1.4 * s), "#3b3f47", rot=rot, haze=False)
    for fx in (-3.8, 3.6):
        for sy in (-1, 1):
            q = p + fwd * (fx * s) + side * (sy * 2.9 * s) + Vector((0, 0, 1.8 * s))
            cyl(f"{name}_wheel", C_STORY, q - side * 0.9 * s, q + side * 0.9 * s, 1.8 * s, "#2a2d33", verts=14, haze=False)
    ball(f"{name}_load", C_STORY, p + fwd * (-2.0 * s) + Vector((0, 0, 7.0 * s)), 2.6 * s, "#c47a46", scale=(1.4, 1.0, 0.55), haze=False)

truck("Truck_a", on_bench(2, math.radians(70)), math.radians(70 + 90), s=1.9)
truck("Truck_b", on_bench(4, math.radians(112)), math.radians(112 - 90), s=1.7)
truck("Truck_c", on_bench(6, math.radians(58)), math.radians(58 + 90), s=1.5)
# a shovel on the pit floor
fl = Vector((PIT.x - 20, PIT.y + 18, -BENCHES * BENCH_H))
box("Shovel_body", C_STORY, fl + Vector((0, 0, 5)), (10, 7, 6), "#f2b134", haze=False)
cyl("Shovel_arm", C_STORY, fl + Vector((3, 0, 8)), fl + Vector((14, -3, 14)), 1.2, "#3b3f47", haze=False)
box("Shovel_bucket", C_STORY, fl + Vector((15, -3, 11)), (4, 4.5, 3.5), "#3b3f47", haze=False)

# Sea: from the coast to the far horizon, lighter in a band where the sun catches it
sea_v = [(-30000, COAST_Y, 2.0), (30000, COAST_Y, 2.0), (30000, 60000, 2.0), (-30000, 60000, 2.0)]
mesh_obj("Sea_main", C_LAND, sea_v, [(0, 1, 2, 3)], "#6fa5c2")
glint_v = [(-2500, 7000, 2.4), (30000, 7000, 2.4), (30000, 11000, 2.4), (-2500, 11000, 2.4)]
mesh_obj("Sea_glint", C_SOFT, glint_v, [(0, 1, 2, 3)], "#b9d6e0")
storm_sea = [(-30000, COAST_Y + 200, 2.6), (-900, COAST_Y + 200, 2.6), (-400, 9000, 2.6), (-30000, 9000, 2.6)]
mesh_obj("Sea_shadow", C_SOFT, storm_sea, [(0, 1, 2, 3)], "#56758f")
# A low headland far out on the right
mesh_obj("Hill_far", C_SOFT, [(2600, 9000, 2.5), (9000, 9000, 2.5), (8000, 9300, 120), (4200, 9200, 160)], [(0, 1, 2, 3)], "#9db7a6")

# ---------- city ----------
ROADS_X = [x for x in range(-1700, 2100, 170)]
ROADS_Y = [y for y in range(-350, 2200, 150)]
for x in ROADS_X:
    box(f"Road_v{x}", C_SOFT, (x, (ROADS_Y[0] + COAST_Y) / 2, 0.08), (16, COAST_Y - ROADS_Y[0], 0.12), "#a7a59d")
for y in ROADS_Y:
    box(f"Road_h{y}", C_SOFT, (200, y, 0.1), (3800, 16, 0.12), "#a7a59d")

TOWERS = Vector((300.0, 200.0))
GLASS = ["#5f97cf", "#6fb3c8", "#87a9d6", "#4f86b8", "#9cc4e8"]
STONE = ["#f2e6cc", "#e4a079", "#d9d4cb", "#c9876a", "#efd59c", "#b9c7cf", "#f4d7b0"]
nb = 0

def building(x, y, w, d, h, col, kind):
    global nb
    nb += 1
    n = f"Bldg_{nb}"
    TB = 0.05
    if kind == "round":
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=w / 2, depth=h, location=(x, y, h / 2))
        o = bpy.context.active_object
        o.name = n
        c_s, f = hazed(col, dist_to_cam((x, y, h / 2)))
        put(o, C_CITY, toon("Bldg", c_s, bands=TB))
        return
    tiers = [(1.0, 0.64), (0.8, 0.88), (0.6, 1.0)] if kind == "step" else [(1.0, 1.0)]
    z0 = 0.0
    for k, (f, top) in enumerate(tiers):
        zt = h * top
        box(f"{n}_t{k}", C_CITY, (x, y, (z0 + zt) / 2), (w * f, d * f, zt - z0), col, bands=TB if h > 40 else None)
        z0 = zt
    if h > 90 and random.random() < 0.35:
        box(f"{n}_mast", C_CITY, (x, y, h + 10), (2.2, 2.2, 20), "#e8eef4")

xs = ROADS_X
ys = ROADS_Y + [COAST_Y]
for i in range(len(xs) - 1):
    for j in range(len(ys) - 1):
        x0, x1, y0, y1 = xs[i] + 10, xs[i + 1] - 10, ys[j] + 10, ys[j + 1] - 10
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        if math.hypot(cx - PIT.x, cy - PIT.y) < PIT_R + 160:
            continue
        if abs(cx - TOWERS.x) < 120 and abs(cy - TOWERS.y) < 90:
            continue
        dcbd = math.hypot(cx - TOWERS.x, cy - (TOWERS.y + 250))
        r = random.random()
        if r < 0.13:
            box(f"Park_{i}_{j}", C_SOFT, (cx, cy, 0.15), (x1 - x0, y1 - y0, 0.12), "#a9cf86")
            for t in range(7):
                ball(f"Tree_{i}_{j}_{t}", C_SOFT, (random.uniform(x0 + 8, x1 - 8), random.uniform(y0 + 8, y1 - 8), 7), random.uniform(6, 9), random.choice(["#5f9d58", "#78b465", "#4f8a4d"]), scale=(1, 1, 0.8), sub=1)
            continue
        n_b = random.choice([1, 2, 2, 3])
        for k in range(n_b):
            w = random.uniform(30, 60) if n_b == 1 else random.uniform(24, 40)
            dd = random.uniform(30, 60) if n_b == 1 else random.uniform(24, 40)
            bx = cx + (random.uniform(-25, 25) if n_b == 1 else (k - (n_b - 1) / 2) * 46)
            by = cy + random.uniform(-20, 20)
            if dcbd < 650:
                h = min(150.0, random.uniform(60, 200) * (1.0 - dcbd / 1100))
            elif cy > 1500:
                h = random.uniform(14, 70)
            else:
                h = random.uniform(10, 46)
            if random.random() < 0.04 and dcbd > 650:
                h *= 2.2
            kind = random.choice(["box", "step", "step", "round"]) if h > 80 else "box"
            col = random.choice(GLASS) if (h > 70 and random.random() < 0.7) else random.choice(STONE)
            building(bx, by, w, dd, h, col, kind)

# Port cranes and a few ships at the coast
for k, x in enumerate(range(-200, 1600, 260)):
    box(f"Crane_leg{k}", C_CITY, (x, COAST_Y - 30, 22), (6, 6, 44), "#d8534b")
    box(f"Crane_boom{k}", C_CITY, (x, COAST_Y + 10, 46), (6, 80, 5), "#d8534b")
for k in range(6):
    sx = random.uniform(-600, 2600); sy = random.uniform(COAST_Y + 500, COAST_Y + 3200)
    box(f"Ship_hull{k}", C_CITY, (sx, sy, 6), (90, 22, 10), random.choice(["#2f4a6b", "#8e3b36", "#3d6b5a"]))
    box(f"Ship_deck{k}", C_CITY, (sx + 30, sy, 16), (18, 18, 10), "#f2efe8")

# The twin exchange towers in the sun: tall blue glass shafts with stepped crowns and masts
for sx in (-48, 48):
    tx, ty = TOWERS.x + sx, TOWERS.y
    box(f"Twin_shaft{sx}", C_STORY, (tx, ty, 170), (60, 60, 340), "#5b95d0", bands=0.05, haze=False)
    box(f"Twin_crownA{sx}", C_STORY, (tx, ty, 349), (50, 50, 18), "#7fb0de", haze=False)
    box(f"Twin_crownB{sx}", C_STORY, (tx, ty, 366), (37, 37, 16), "#9cc4e8", haze=False)
    box(f"Twin_crownC{sx}", C_STORY, (tx, ty, 380), (24, 24, 12), "#bcd8ef", haze=False)
    box(f"Twin_mast{sx}", C_STORY, (tx, ty, 402), (3.4, 3.4, 32), "#eef3f7", haze=False)
box("Twin_podium", C_STORY, (TOWERS.x, TOWERS.y - 10, 14), (170, 90, 28), "#e9eef3", haze=False)
box("Twin_plaza", C_SOFT, (TOWERS.x, TOWERS.y - 85, 0.3), (190, 60, 0.3), "#f4ead4", haze=False)

# Foreground: the hill where the viewer stands, palms and shrubs around the pit rim
for t in range(70):
    a = random.uniform(0, 2 * math.pi)
    rr = random.uniform(PIT_R + 12, PIT_R + 120)
    x, y = PIT.x + rr * math.cos(a), PIT.y + rr * math.sin(a)
    if y < -1150:
        continue
    ball(f"Shrub_{t}", C_SOFT, (x, y, 4), random.uniform(5, 10), random.choice(["#6aa35b", "#82b86a", "#5a9150"]), scale=(1, 1, 0.75), sub=1)

def palm(name, base, h, lean):
    top = base + Vector((lean, 0, h))
    cyl(f"{name}_trunk", C_STORY, base, top, 1.1, "#9b7a55", verts=8, haze=False)
    for k in range(7):
        ang = 2 * math.pi * k / 7
        tip = top + Vector((math.cos(ang) * 11, math.sin(ang) * 11, -5))
        cyl(f"{name}_leaf", C_STORY, top, tip, 1.4, "#4f9a52", verts=6, haze=False)

for k, (px, py) in enumerate([(-175, -800), (-140, -815), (-105, -795), (95, -805), (130, -790), (165, -812), (60, -830)]):
    hgt = random.uniform(9, 13)
    cyl(f"Trunk_{k}", C_STORY, (px, py, 0), (px, py, hgt), 1.4, "#8a6a48", verts=8, haze=False)
    ball(f"Canopy_{k}", C_STORY, (px, py, hgt + 5), random.uniform(7, 9), random.choice(["#5f9d58", "#78b465", "#4f8a4d"]), scale=(1, 1, 0.85), sub=2, haze=False)
# haul road from the pit rim to the plant, with a loaded truck on it
box("Haul_road", C_SOFT, (170, -600, 0.4), (40, 380, 0.3), "#b8a07a", rot=(0, 0, math.radians(-8)), haze=False)
truck("Truck_d", Vector((175, -660, 0.5)), math.radians(84), s=2.0)
# processing plant, silos, conveyor and ore stockpiles beside the pit
box("Plant_hall", C_STORY, (250, -380, 14), (60, 40, 28), "#d9d4cb")
box("Plant_roof", C_STORY, (250, -380, 30), (64, 44, 4), "#c9876a")
for k, (sx_, sy_) in enumerate([(205, -430), (222, -440), (239, -450)]):
    cyl(f"Silo_{k}", C_STORY, (sx_, sy_, 0), (sx_, sy_, 34), 7.5, "#eef0f2", verts=14)
cyl("Conveyor_belt", C_STORY, (130, -470, 2), (225, -405, 24), 2.2, "#5d6470", verts=8)
for k, (cx_, cy_, rr, col) in enumerate([(255, -560, 26, "#d4a14f"), (275, -505, 20, "#b86a3c"), (232, -615, 18, "#e2b866")]):
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=rr, radius2=2, depth=rr * 0.9, location=(cx_, cy_, rr * 0.45))
    put(bpy.context.active_object, C_STORY, toon("Pile", hex_srgb(col), shade=0.72), smooth=True)
# small cars on the roads nearest the pit and towers
car_cols = ["#e9473f", "#f4c542", "#2f6db5", "#ffffff", "#3d9b6d", "#f08a2b"]
for i in range(90):
    if random.random() < 0.55:
        y = random.choice(ROADS_Y[:6]) + random.choice((-4, 4)); x = random.uniform(-700, 900); size = (6.0, 2.8, 2.4)
    else:
        x = random.choice(ROADS_X[6:18]) + random.choice((-4, 4)); y = random.uniform(-300, 900); size = (2.8, 6.0, 2.4)
    box(f"Car_{i}", C_SOFT, (x, y, 1.4), size, random.choice(car_cols))

# ---------- the storm over the sea on the left, with rain ----------
STORM_C = Vector((-1100.0, 3300.0))
nc = 0
def storm_top(x):
    u = (x + 1900) / 1650.0                         # 0 at the far left, 1 at the right edge of the storm
    return 300 + 170 * math.sin(math.pi * min(1.0, max(0.0, u * 1.1)))
for i in range(80):                                  # dark flat base
    x = random.uniform(-1950, -260); y = random.uniform(2950, 3750)
    ball(f"CloudBase_{i}", C_CLOUD, (x, y, random.uniform(150, 185)), random.uniform(70, 110), "#566278", scale=(1.6, 1, 0.38), sub=2, shade_rgb=(0.72, 0.74, 0.82), edge=0.45, haze=False)
for i in range(190):                                 # grey body
    x = random.uniform(-1900, -300); y = random.uniform(2950, 3700)
    z = random.uniform(200, storm_top(x) - 50)
    ball(f"Cloud_{nc}", C_CLOUD, (x, y, z), random.uniform(55, 95), "#7b879c", scale=(1.15, 1, 0.8), sub=3, shade_rgb=(0.62, 0.66, 0.76), edge=0.45, haze=False)
    nc += 1
for i in range(70):                                  # sunlit tops, lighter
    x = random.uniform(-1800, -320); y = random.uniform(2950, 3300)
    z = storm_top(x) - random.uniform(10, 60)
    ball(f"CloudTop_{i}", C_CLOUD, (x, y, z), random.uniform(45, 80), "#c9ced9", scale=(1.1, 1, 0.85), sub=3, shade_rgb=(0.66, 0.70, 0.80), edge=0.4, haze=False)
for i in range(96):                                  # rain curtains, slanted by the wind
    x = random.uniform(-1900, -330); y = random.uniform(2950, 3600)
    cyl(f"Rain_{i}", C_SOFT, (x, y, 165), (x + 60, y - 30, 2.5), random.uniform(2.5, 4.0), random.choice(["#93a0b4", "#a3aec0", "#8592a8"]), verts=6, haze=False)
# fair-weather clouds low on the right horizon
for i in range(26):
    x = random.uniform(900, 3200); y = random.uniform(6000, 8000)
    ball(f"Fair_{i}", C_CLOUD, (x, y, random.uniform(260, 420)), random.uniform(80, 150), "#fbf2e2", scale=(1.6, 1, 0.55), sub=2, shade_rgb=(0.86, 0.84, 0.86), edge=0.4, haze=False)

# ---------- light, world, camera ----------
sun_d = Vector((-0.62, 0.42, -0.66)).normalized()      # sun low in the west, behind the viewer's right
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN'))
sun.data.energy = 4.0
sun.data.angle = math.radians(0.8)
sun.rotation_mode = 'QUATERNION'
sun.rotation_quaternion = (-sun_d).to_track_quat('Z', 'Y')
root.objects.link(sun)

world = bpy.data.worlds.new("CoverSky")
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
bg = wn["Background"]
tc = wn.new("ShaderNodeTexCoord")
sep = wn.new("ShaderNodeSeparateXYZ")
rampw = wn.new("ShaderNodeValToRGB")
rampw.color_ramp.elements[0].position = 0.52
rampw.color_ramp.elements[0].color = lin(hex_srgb("#f8e2bf"))
rampw.color_ramp.elements[1].position = 1.0
rampw.color_ramp.elements[1].color = lin(hex_srgb("#9fc6e6"))
mid = rampw.color_ramp.elements.new(0.7)
mid.color = lin(hex_srgb("#d9e4ec"))
wl.new(tc.outputs["Window"], sep.inputs[0])
wl.new(sep.outputs["Y"], rampw.inputs[0])
wl.new(rampw.outputs[0], bg.inputs[0])
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
cam.location = CAM
cam.rotation_euler = (math.radians(83.0), 0, 0)
cam.data.lens = 30
cam.data.sensor_fit = 'VERTICAL'
cam.data.sensor_height = 36
cam.data.clip_start = 3.0
cam.data.clip_end = 70000
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
r.line_thickness = 2.4
INK = (0.11, 0.15, 0.20)
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
ls.select_by_collection = True
ls.collection = C_INK
ls.collection_negation = 'INCLUSIVE'
ls.linestyle.color = INK
ls.linestyle.thickness = 2.4
tm = ls.linestyle.thickness_modifiers.new("Far", 'DISTANCE_FROM_CAMERA')
tm.range_min, tm.range_max = 500.0, 4200.0
tm.value_min, tm.value_max = 1.0, 0.35
tm.blend = 'MULTIPLY'
ls.linestyle.use_length_min = True
ls.linestyle.length_min = 14.0
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
lc.linestyle.color = (0.24, 0.27, 0.34)
lc.linestyle.thickness = 1.6
lc.linestyle.use_length_min = True
lc.linestyle.length_min = 24.0

result = {"clouds": nc, "buildings": nb, "objects": len(scene.objects)}
