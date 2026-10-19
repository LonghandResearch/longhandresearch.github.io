"""Read the owner's October 12-16 IDX files; never changes the originals.
Usage: python scripts/extract-ihsg-oct16.py <source folder> <output json>
Requires pdfplumber. Breadth is transcribed separately after visual legend review.
"""
import hashlib
import json
import pathlib
import re
import sys
import pdfplumber

folder, output = map(pathlib.Path, sys.argv[1:])
days = []
sources = []
for file in sorted(folder.glob("*.pdf")):
    sources.append({"file": file.name, "sha256": hashlib.sha256(file.read_bytes()).hexdigest()})
    if not file.name.startswith("ds_"):
        continue
    with pdfplumber.open(file) as doc:
        pages = [p.extract_text() for p in doc.pages]
    close = float(re.search(r"\(million shares\)\n([\d,.]+)", pages[0])[1].replace(",", ""))
    rate = int(re.search(r"USD/IDR BI = ([\d,]+)", pages[0])[1].replace(",", ""))
    net = float(re.search(r"NET FOREIGN FUNDAMENTAL\n(-?[\d,.]+)", pages[1])[1].replace(",", ""))
    markets = {}
    for code in ["RG", "TN", "NG"]:
        row = re.search(r"^" + code + r" ([\d,]+) ([\d,]+) ([\d,]+)", pages[4], re.M)
        markets[code] = dict(zip(["volume", "valueIdr", "frequency"], [int(n.replace(",", "")) for n in row.groups()]))
    days.append({"date": f"2026-10-{file.stem[-2:]}", "close": close, "biUsdIdr": rate, "officialNetBn": net, "markets": markets})
with pdfplumber.open(folder / "ws_261016.pdf") as doc:
    text = doc.pages[5].extract_text()
buy = int(re.search(r"^Buy [\d,]+ ([\d,]+)", text, re.M)[1].replace(",", ""))
sell = int(re.search(r"^Sell [\d,]+ ([\d,]+)", text, re.M)[1].replace(",", ""))
result = {"weekEnding": "2026-10-16", "sourceFiles": sources, "daily": days,
          "weeklyForeign": {"buyIdr": buy, "sellIdr": sell},
          "weeklyBreadth": {"upAbove2": 21, "upTo2": 8, "flat": 127, "downTo2": 28, "downBeyond2": 779},
          "fridayBreadth": {"upAbove2": 3, "upTo2": 8, "flat": 140, "downTo2": 20, "downBeyond2": 792},
          "breadthMethod": "Counts checked visually against colors and legend on weekly page 4 and Friday daily page 5. Weekly printed percentages for the two declining groups are swapped. Recompute all percentages from counts."}
output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
