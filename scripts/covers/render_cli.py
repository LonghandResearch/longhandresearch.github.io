import bpy, sys, time
t0 = time.time()
path = sys.argv[sys.argv.index("--") + 1]
out = sys.argv[sys.argv.index("--") + 2]
ns = {"__name__": "__main__"}
exec(open(path, encoding="utf-8").read(), ns)
print("BUILT", ns.get("result"), round(time.time() - t0, 1), flush=True)
scene = bpy.data.scenes["LonghandCover"]
scene.render.filepath = out
args = sys.argv[sys.argv.index("--") + 1:]
if len(args) > 2:
    scene.render.resolution_percentage = int(args[2])
bpy.ops.render.render(write_still=True, scene=scene.name)
bpy.ops.wm.save_as_mainfile(filepath=out.replace(".png", ".blend"))
print("RENDERED", out, round(time.time() - t0, 1), flush=True)
