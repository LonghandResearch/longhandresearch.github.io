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

bpy.ops.wm.save_as_mainfile(filepath=out)
print('RESULT', out, 'frame_w', round(frame_w, 2))
