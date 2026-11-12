"""Give the far ridges something to look at, drawn the way a ligne-claire
landscape draws distance: flat haze colour, no ink. A line of small trees
along each ridge, and on the near ridge to the right a hamlet whose windows
are lit at night (the reader's lantern, answered from across the valley).
blender -b scene.blend --factory-startup --python-exit-code 1 -P add_distance.py -- <out.blend> <day 0|1>"""
import bpy, sys, math, random
a = sys.argv[sys.argv.index('--') + 1:]
out, DAY = a[0], a[1] == '1'
s = bpy.context.scene
cam = s.camera
landscape = s.render.resolution_x >= s.render.resolution_y
frame_w = cam.data.ortho_scale if landscape else cam.data.ortho_scale * s.render.resolution_x / s.render.resolution_y
cx = cam.location.x
X = lambda u: cx + (u - .5) * frame_w          # a share of the frame's width, as world x

def hexcol(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)
def flat(name, colour, strength=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; t = m.node_tree; t.nodes.clear()
    e = t.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = hexcol(colour); e.inputs['Strength'].default_value = strength
    o = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e.outputs[0], o.inputs['Surface'])
    return m

def crest(obj):
    """The ridge's top edge, read from its mesh: a function of world x."""
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    top = sorted({(round(v.x, 4), v.z) for v in ws if v.z > min(w.z for w in ws) + 1}, key=lambda p: p[0])
    y = ws[0].y
    def z(x):
        for (x0, z0), (x1, z1) in zip(top, top[1:]):
            if x0 <= x <= x1: return z0 + (z1 - z0) * (x - x0) / (x1 - x0 or 1)
        return top[0][1] if x < top[0][0] else top[-1][1]
    return z, y

class Shapes:
    def __init__(self): self.v, self.f, self.mi = [], [], []
    def poly(self, pts, mat):
        i = len(self.v); self.v.extend(pts); self.f.append(list(range(i, i + len(pts)))); self.mi.append(mat)
    def build(self, name, mats):
        me = bpy.data.meshes.new(name); me.from_pydata(self.v, [], self.f)
        for m in mats: me.materials.append(m)
        for p, mi in zip(me.polygons, self.mi): p.material_index = mi
        ob = bpy.data.objects.new(name, me); s.collection.objects.link(ob); ob.visible_shadow = False
        return ob

rng = random.Random(1311)
def copses(ridge_name, colour, groups, scale):
    """Copses, not a row: a few trees close together, then open ridge.
    Most are round and leafy, some are tall and narrow like poplars."""
    rz, ry = crest(bpy.data.objects[ridge_name])
    y = ry - .06
    sh = Shapes()
    for u, n in groups:
        x0 = X(u)
        for k in range(n):
            x = x0 + (k - n / 2) * scale * rng.uniform(.13, .2)
            base = rz(x) - .04
            r = scale * rng.uniform(.07, .12) * (1.2 if k in (n // 2, n // 2 - 1) else 1)
            poplar = rng.random() < .22
            rx, ry_ = (r * .5, r * 1.9) if poplar else (r, r * 1.05)
            trunk = scale * rng.uniform(.04, .08)
            sh.poly([(x - r * .1, y, base), (x + r * .1, y, base), (x + r * .1, y, base + trunk + ry_ * .4), (x - r * .1, y, base + trunk + ry_ * .4)], 0)
            ccz = base + trunk + ry_ * .9
            sh.poly([(x + rx * math.cos(t * math.tau / 18) * (1 + .07 * math.sin(t * 2.7 + k)), y - .001 - k * .0004, ccz + ry_ * math.sin(t * math.tau / 18)) for t in range(18)], 0)
    return sh.build(f'LH_Far{ridge_name[8:]}Trees', [flat(f'LH_Far{ridge_name[8:]}TreeMat', colour)])

if DAY:
    P = dict(far_tree='#bfcbb2', near_tree='#a2b48f', mountain='#d9dfcd', mountain_snow='#e4e8da',
             field_a='#bac8a5', field_b='#a8ba92', field_c='#c3cfac', hedge='#94a881', road='#d9d5c1',
             wall='#dcd7c3', wall2='#d2ccb6', roof='#c4a68b', roof2='#b8977d', window='#8f9d8c', door='#9aa596', glow=1.0)
else:
    P = dict(far_tree='#0d2428', near_tree='#081a1d', mountain='#163339', mountain_snow='#1b3a40',
             field_a='#0e2428', field_b='#0a1d21', field_c='#10292d', hedge='#071619', road='#16323a',
             wall='#14313a', wall2='#112b33', roof='#0b2025', roof2='#0d2328', window='#f6cf74', door='#0b2025', glow=2.4)

# Furthest of all: a low range of mountains, paler than the ridges (more air
# between them and the reader), with a lighter face where the light falls
rzf, ryf = crest(bpy.data.objects['LH_RidgeFar'])
my = ryf + 4          # in front of the sky (at 30), behind the far ridge
mbase = sum(rzf(X(u)) for u in (.1, .3, .5, .7, .9)) / 5 - .55
sh = Shapes()
xs = [X(-.25) + i * (1.5 * frame_w / 240) for i in range(241)]
def mz(x):
    # sharp crests from folded sines, small and far, two ranges overlapping
    a = .42 * (1 - abs(math.sin(x * .19 + .7))) ** 2.2
    b = .30 * (1 - abs(math.sin(x * .33 + 2.1))) ** 2.6
    return mbase + max(a, b) + .03 * math.sin(x * 2.3)
top = [(x, my, mz(x)) for x in xs]
sh.poly(top + [(x, my, mbase - 8) for x in reversed(xs)], 0)
sh.build('LH_FarMountains', [flat('LH_FarMountainMat', P['mountain'])])

copses('LH_RidgeFar', P['far_tree'], [(.05, 4), (.16, 2), (.47, 5), (.83, 3), (.95, 4)], 1.0)

# The near ridge is farmland: patches in three tints following the slope,
# hedgerows between them, a few trees standing in the hedges
rz, ry = crest(bpy.data.objects['LH_RidgeNear'])
y = ry - .03
sh = Shapes()
edges = [-.08, .03, .11, .2, .27, .36, .45, .52, .61, .7, .79, .86, .95, 1.08]
tints = [0, 1, 2, 1, 0, 2, 1, 0, 2, 0, 1, 2, 0]
for (u0, u1), tint in zip(zip(edges, edges[1:]), tints):
    x0, x1 = X(u0), X(u1)
    n = 12
    xsx = [x0 + (x1 - x0) * k / n for k in range(n + 1)]
    lean = (x1 - x0) * .35                     # patch edges run down the slope at a slant
    poly = [(x, y, rz(x) - .035) for x in xsx] + [(x1 + lean, y, rz(x1) - 1.2), (x0 + lean, y, rz(x0) - 1.2)]
    sh.poly(poly, tint)
    hx = x1
    sh.poly([(hx - .012, y - .002, rz(hx) - .03), (hx + .012, y - .002, rz(hx) - .03), (hx + lean + .012, y - .002, rz(hx) - 1.2), (hx + lean - .012, y - .002, rz(hx) - 1.2)], 3)
sh.build('LH_FarFields', [flat('LH_FarFieldA', P['field_a']), flat('LH_FarFieldB', P['field_b']), flat('LH_FarFieldC', P['field_c']), flat('LH_FarHedge', P['hedge'])])
copses('LH_RidgeNear', P['near_tree'], [(.08, 5), (.27, 2), (.4, 2), (.63, 3), (.86, 2), (.93, 4)], 1.3)

# A lane winds down from the hamlet into the valley
sh = Shapes()
pts = []
for k in range(40):
    t = k / 39
    x = X(.50 - .12 * t) + .18 * math.sin(t * 7.5)
    z = rz(X(.50)) - .05 - 1.1 * t
    pts.append((x, z, .022 + .03 * t))
for (xa, za, wa), (xb, zb, wb) in zip(pts, pts[1:]):
    sh.poly([(xa - wa, y - .004, za), (xa + wa, y - .004, za), (xb + wb, y - .004, zb), (xb - wb, y - .004, zb)], 0)
sh.build('LH_FarLane', [flat('LH_FarLaneMat', P['road'])])

# The hamlet, between the tree and the words: gabled houses and a small
# church tower, lit windows at night
y = ry - .12
sh = Shapes()
mats = [flat('LH_FarWall', P['wall']), flat('LH_FarRoof', P['roof']), flat('LH_FarWindow', P['window'], P['glow']), flat('LH_FarDoor', P['door']),
        flat('LH_FarWall2', P['wall2']), flat('LH_FarRoof2', P['roof2'])]
def window(wx, wz, on, d=0):
    ww, wh = .03, .038
    sh.poly([(wx - ww / 2, y - .003 - d, wz), (wx + ww / 2, y - .003 - d, wz), (wx + ww / 2, y - .003 - d, wz + wh), (wx - ww / 2, y - .003 - d, wz + wh)], 2 if on else 3)
houses = ((.453, .26, .15, (1,), 0), (.468, .32, .18, (1, 1), 1), (.487, .24, .14, (0,), 0), (.521, .38, .22, (0, 1, 1), 1), (.541, .22, .13, (1,), 0), (.555, .28, .15, (1, 0), 1))
for i, (u, w, h, lit, alt) in enumerate(houses):
    x = X(u); base = rz(x) - .03; d = i * .003
    sh.poly([(x - w / 2, y - d, base), (x + w / 2, y - d, base), (x + w / 2, y - d, base + h), (x - w / 2, y - d, base + h)], 4 if alt else 0)
    sh.poly([(x - w / 2 - .03, y - .001 - d, base + h - .01), (x + w / 2 + .03, y - .001 - d, base + h - .01), (x, y - .001 - d, base + h + w * .42)], 5 if alt else 1)
    if i in (1, 3):     # a chimney
        cxh = x + w * .22
        sh.poly([(cxh - .016, y - .002 - d, base + h + w * .1), (cxh + .016, y - .002 - d, base + h + w * .1), (cxh + .016, y - .002 - d, base + h + w * .3), (cxh - .016, y - .002 - d, base + h + w * .3)], 5 if alt else 1)
    for k, on in enumerate(lit):
        window(x - w / 2 + (k + 1) * w / (len(lit) + 1), base + h * .42, on, d)
# the church: a nave and a tower with a pointed roof, its belfry lit
x = X(.504); base = rz(x) - .03; d = .03
sh.poly([(x - .07, y - d, base), (x + .07, y - d, base), (x + .07, y - d, base + .5), (x - .07, y - d, base + .5)], 0)
sh.poly([(x - .085, y - d - .001, base + .49), (x + .085, y - d - .001, base + .49), (x, y - d - .001, base + .74)], 1)
window(x, base + .36, 1, d)
sh.build('LH_FarHamlet', mats)

# ------------------------------------------------------------- fine detail
from mathutils import Vector
rows_c, hay_c, hay_s, smoke_c, bird_c, wall_c = (('#a6b691', '#dcc68e', '#bea66f', '#ebe7da', '#6f7d70', '#cfc9b2') if DAY
                                                 else ('#0b2125', '#0e2428', '#0b1f22', '#13303a', '#0b2226', '#10282e'))

# A second, further range behind the first: paler still, its peaks just showing
sh = Shapes()
my2 = ryf + 6.5
def mz2(x):
    a = .55 * (1 - abs(math.sin(x * .15 + 2.4))) ** 2.4
    b = .38 * (1 - abs(math.sin(x * .27 + .3))) ** 2.8
    return mbase + .12 + max(a, b)
xs2 = [X(-.25) + i * (1.5 * frame_w / 240) for i in range(241)]
sh.poly([(x, my2, mz2(x)) for x in xs2] + [(x, my2, mbase - 8) for x in reversed(xs2)], 0)
sh.build('LH_FarMountains2', [flat('LH_FarMountainMat2', '#e3e7da' if DAY else '#183740')])

# Farm detail on the near ridge: vine rows, an orchard, hay bales by day
y = ry - .035
sh = Shapes()
patches = list(zip(zip(edges, edges[1:]), tints))
def slant(u0, u1):
    x0, x1 = X(u0), X(u1); return x0, x1, (x1 - x0) * .35
for idx in (2, 5, 8, 11):                      # vine rows down the slope
    (u0, u1), _ = patches[idx]
    x0, x1, lean = slant(u0, u1)
    k = 0
    xr = x0 + .05
    while xr < x1 - .03:
        top = rz(xr) - .06
        sh.poly([(xr - .008, y, top), (xr + .008, y, top), (xr + lean + .008, y, top - 1.2), (xr + lean - .008, y, top - 1.2)], 0)
        xr += .065
for idx in (4,):                               # an orchard in rows
    (u0, u1), _ = patches[idx]
    x0, x1, lean = slant(u0, u1)
    for r_ in range(5):
        dz = .1 + r_ * .1
        xr = x0 + .07
        while xr < x1 - .05:
            cx_ = xr + lean * dz / 1.2; cz = rz(xr) - .05 - dz
            sh.poly([(cx_ + .034 * math.cos(t * math.tau / 10), y - .001, cz + .036 * math.sin(t * math.tau / 10)) for t in range(10)], 1)
            xr += .1
if DAY:
    for idx in (10,):                          # hay bales
        (u0, u1), _ = patches[idx]
        x0, x1, lean = slant(u0, u1)
        for j, (fx, dz) in enumerate(((.25, .12), (.55, .18), (.4, .3), (.75, .27))):
            cx_ = x0 + (x1 - x0) * fx + lean * dz / 1.2; cz = rz(x0 + (x1 - x0) * fx) - .06 - dz
            sh.poly([(cx_ + .045 * math.cos(t * math.tau / 12), y - .002, cz + .03 * math.sin(t * math.tau / 12)) for t in range(12)], 2)
            sh.poly([(cx_ - .045, y - .003, cz - .006), (cx_ + .045, y - .003, cz - .006), (cx_ + .04, y - .003, cz - .03), (cx_ - .04, y - .003, cz - .03)], 3)
sh.build('LH_FarFarm', [flat('LH_FarRows', rows_c), flat('LH_FarOrchard', P['near_tree']), flat('LH_FarHay', hay_c), flat('LH_FarHayShade', hay_s)])

# Cypresses along the lane, larger as it comes nearer
sh = Shapes()
for k in range(3, len(pts) - 2, 4):
    xa, za, wa = pts[k]
    for side in (-1, 1):
        cx_ = xa + side * (wa + .045); hgt = .12 + .1 * k / len(pts); wid = .028 + .02 * k / len(pts)
        sh.poly([(cx_ + wid * math.cos(t * math.tau / 14), y - .006, za + hgt * .5 + hgt * .5 * math.sin(t * math.tau / 14)) for t in range(14)], 0)
sh.build('LH_FarCypress', [flat('LH_FarCypressMat', P['near_tree'])])

# The hamlet's finer parts: doors, a low stone wall, smoke by day
y = ry - .12
sh = Shapes()
for i, (u, w, h, lit, alt) in enumerate(houses):
    x = X(u); base = rz(x) - .03; d = i * .003
    dx = x + (w * .25 if i % 2 else -w * .25)
    sh.poly([(dx - .018, y - .004 - d, base), (dx + .018, y - .004 - d, base), (dx + .018, y - .004 - d, base + .06), (dx - .018, y - .004 - d, base + .06)], 0)
xw0, xw1 = X(.44), X(.57)
n = 30
sh.poly([(xw0 + (xw1 - xw0) * k / n, y - .05, rz(xw0 + (xw1 - xw0) * k / n) + .015) for k in range(n + 1)] + [(xw1, y - .05, rz(xw1) - .05), (xw0, y - .05, rz(xw0) - .05)], 1)
if DAY:
    for i in (1, 3):
        u, w, h, lit, alt = houses[i]
        x = X(u) + w * .22; base = rz(X(u)) - .03 + h + w * .32
        for j in range(4):
            r_ = .02 + .012 * j
            sh.poly([(x + .02 * j + r_ * math.cos(t * math.tau / 12), y - .02, base + .05 + .065 * j + r_ * .8 * math.sin(t * math.tau / 12)) for t in range(12)], 2)
sh.build('LH_FarHamletDetail', [flat('LH_FarDoor2', P['door']), flat('LH_FarWallStone', wall_c), flat('LH_FarSmoke', smoke_c)])

# Birds by day, far off to the right of the words, under the sun
if DAY:
    sh = Shapes()
    by = ryf - 1
    for bu, bh, sc in ((.905, 1.55, 1.0), (.93, 1.75, .8), (.95, 1.45, .9), (.972, 1.68, .7)):
        bx = X(bu); bz = rzf(bx) + bh; w_ = .06 * sc
        for sgn in (-1, 1):
            sh.poly([(bx, by, bz), (bx + sgn * w_, by, bz + w_ * .45), (bx + sgn * w_ * 1.04, by, bz + w_ * .36), (bx, by, bz - .012)], 0)
    sh.build('LH_FarBirds', [flat('LH_FarBirdMat', bird_c)])

# Wild flowers in the grass of the reader's hill
hill = bpy.data.objects['LH_Hill']
inv = hill.matrix_world.inverted()
def ground(x, yy):
    o = inv @ Vector((x, yy, 50)); dd = (inv.to_3x3() @ Vector((0, 0, -1))).normalized()
    hit, loc, *_ = hill.ray_cast(o, dd)
    return (hill.matrix_world @ loc).z if hit else None
fl = random.Random(77)
cols = (['#f4e9b8', '#fbfaf2', '#e2b3c4', '#f0d27a'] if DAY else ['#5f7a6c', '#6d8a7a', '#58705f', '#7a9480'])
sh = Shapes()
reader = Vector((.75, -.55))
for c in range(26):
    cx_, cy_ = fl.uniform(X(-.05), X(1.05)), fl.uniform(-3.2, .8)
    if Vector((cx_, cy_)).length < .7 or (Vector((cx_, cy_)) - reader).length < 1.1: continue
    colour = fl.randrange(len(cols))
    for k in range(fl.randint(3, 7)):
        px, py = cx_ + fl.uniform(-.25, .25), cy_ + fl.uniform(-.2, .2)
        z0 = ground(px, py)
        if z0 is None: continue
        r_ = fl.uniform(.012, .02) * (1 + max(0, -py) * .12)
        pz = z0 + fl.uniform(.07, .14)
        sh.poly([(px + r_ * math.cos(t * math.tau / 8), py - .3, pz + r_ * math.sin(t * math.tau / 8)) for t in range(8)], colour)
sh.build('LH_FarWildflowers', [flat(f'LH_Wildflower{i}', c) for i, c in enumerate(cols)])

bpy.ops.wm.save_as_mainfile(filepath=out)
print('RESULT', out, 'frame_w', round(frame_w, 2))
