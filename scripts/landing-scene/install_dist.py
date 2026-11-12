"""Install the landscape renders into the site worktree and bump the cache tags.
python -I install_dist.py <site dir> <version> <work dir>"""
import os, re, shutil, sys, glob
from PIL import Image
site, V, here = sys.argv[1], sys.argv[2], sys.argv[3]
img, vid = f'{site}/assets/img/landing', f'{site}/assets/video'
for f in os.listdir(f'{here}/out_dist/final'):
    shutil.copy2(f'{here}/out_dist/final/{f}', f'{vid}/{f}')
    print(f, os.path.getsize(f'{vid}/{f}') // 1024, 'KB')
for name in ('tree-land', 'tree-portrait', 'tree-land-day', 'tree-portrait-day'):
    for fr, tag in (('f001', 'start'), ('f150', 'end')):
        out = f'{img}/{name}-{tag}.webp'
        Image.open(f'{here}/out_dist/still_{name}/{fr}.png').convert('RGB').save(out, 'WEBP', quality=82, method=6)
        print(os.path.basename(out), os.path.getsize(out) // 1024, 'KB')
# the inner pages' hill: frames laid on the page colour, encoded separately; still from frame one
for t, bg, still in (('night', (7, 23, 29), 'horizon'), ('day', (232, 227, 215), 'horizon-day')):
    src = f'{here}/wind3_{t}'
    fs = sorted(f for f in os.listdir(src) if f.endswith('.png'))
    dst = f'{src}_c'; os.makedirs(dst, exist_ok=True)
    for f in fs:
        im = Image.open(f'{src}/{f}').convert('RGBA'); c = Image.new('RGBA', im.size, bg + (255,)); c.alpha_composite(im); c.convert('RGB').save(f'{dst}/{f}')
    Image.open(f'{src}/{fs[0]}').convert('RGBA').save(f'{img}/{still}.webp', 'WEBP', quality=82, method=6)
    print(still, os.path.getsize(f'{img}/{still}.webp') // 1024, 'KB')
# cache tags: every versioned landing image and video, and the files that name them
for p, pats in ((f'{site}/assets/css/home-grove.css', [r"(tree-[a-z-]+\.webp\?v=)[\w-]+"]),
                (f'{site}/assets/css/grove-site.css', [r"(horizon(?:-day)?\.webp\?v=)[\w-]+"]),
                (f'{site}/assets/js/home-grove.js', [r"(const VERSION = ')[\w-]+"]),
                (f'{site}/assets/js/grove-site.js', [r"(const VERSION = ')[\w-]+"])):
    s = open(p, encoding='utf-8').read()
    for pat in pats: s = re.sub(pat, lambda m: m.group(1) + V, s)
    open(p, 'w', encoding='utf-8', newline='').write(s)
for p in glob.glob(f'{site}/*.html'):
    s = open(p, encoding='utf-8').read(); n = s
    s = re.sub(r'((?:home-grove|grove-site)\.(?:css|js)\?v=)[\w-]+', lambda m: m.group(1) + V, s)
    if s != n: open(p, 'w', encoding='utf-8', newline='').write(s)
print('RESULT installed', V)
