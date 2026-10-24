"""Read one week of the owner's IDX statistics and check them against each other.

Usage:
  python -I scripts/extract-ihsg-week.py <source folder> <output json> [--prior-close N] [--render DIR]

The folder holds the daily files ds_YYMMDD.pdf and one weekly file ws_YYMMDD.pdf,
as downloaded from IDX. The originals are only read, never changed. Requires
pymupdf. The script records each file's SHA-256, the daily closes, ranges, BI
rate, official foreign net, market multiples and the regular, cash and
negotiated market tables, plus the weekly totals and foreign buy and sell.

It then reconciles the files with each other and exits with an error if any
check fails: each day's "Previous" equals the prior close, the YTD foreign net
chains day to day, the daily market tables sum to the weekly table, and the
weekly foreign buy less sell matches the printed weekly net.

Breadth is NOT taken from the text layer. Its label order is ambiguous, and IDX
has printed the declining-group percentages in the wrong order before. The raw
labels are kept for reference, and --render writes the pages that must be read
visually (weekly pages 4, 5 and 7, last daily page 5) as PNG files.
"""
import argparse
import hashlib
import json
import pathlib
import re
import sys

import pymupdf

NUM = r"[-+]?[\d,]+(?:\.\d+)?"  # IDX prints "+17.048" on rising days


def num(text):
    return float(text.replace(",", ""))


def joined(page):
    return " ".join(page.get_text().split())


def find(pattern, text, what):
    match = re.search(pattern, text)
    if not match:
        raise SystemExit(f"Could not read {what}. The IDX layout may have changed: check the page by eye.")
    return match


def market_rows(text, what):
    """The first three Volume/Value/Freq. triples after the heading are RG, TN and NG."""
    start = find(r"Volume Value Freq\. ", text, what).end()
    values = [int(n.replace(",", "")) for n in re.findall(r"[\d,]+", text[start:])[:9]]
    return {code: dict(zip(["volume", "valueIdr", "frequency"], values[i * 3:i * 3 + 3]))
            for i, code in enumerate(["RG", "TN", "NG"])}


def read_daily(path):
    doc = pymupdf.open(path)
    p1, p2, p5 = joined(doc[0]), joined(doc[1]), joined(doc[4])
    head = find(r"IDX Composite Index \(IHSG\) (" + NUM + r") (" + NUM + r") \((" + NUM + r")%\) Previous Highest Lowest ("
                + NUM + r") (" + NUM + r") (" + NUM + r")", p1, f"the index block in {path.name}")
    close, change, pct, previous, high, low = (num(g) for g in head.groups())
    caps = find(r"\(trillion IDR\) \(billion USD~\) (" + NUM + r") (" + NUM + r") (" + NUM + r") (" + NUM + r")", p1,
                f"market capitalisation in {path.name}")
    rate = find(r"USD/IDR BI = ([\d,]+)", p1, f"the BI rate in {path.name}")
    today = find(r"Today Net (?:Buy|Sell) (" + NUM + r")", p2, f"today's foreign net in {path.name}")
    ytd = find(r"YTD Net (?:Buy|Sell) (" + NUM + r")", p2, f"YTD foreign net in {path.name}")
    multiples = find(r"Market PER Market PBV \(x\) \(x\) (" + NUM + r") (" + NUM + r")", p2, f"market multiples in {path.name}")
    stamp = path.stem[-6:]
    return {
        "date": f"20{stamp[:2]}-{stamp[2:4]}-{stamp[4:]}",
        "close": close, "previous": previous, "change": change, "changePct": pct, "high": high, "low": low,
        "biUsdIdr": int(num(rate[1])), "officialNetBn": num(today[1]), "ytdNetBn": num(ytd[1]),
        "marketPer": num(multiples[1]), "marketPbv": num(multiples[2]),
        "idxMarketCapTn": num(caps[1]), "ihsgFreeFloatCapTn": num(caps[3]),
        "markets": market_rows(p5, f"the trading recapitulation in {path.name}"),
        "breadthTextOrder": re.findall(r"([\d,]+) \((\d+)%\)", p5)[:5],
    }


def read_weekly(path):
    doc = pymupdf.open(path)
    p1, p2, p4, p6 = (joined(doc[i]) for i in (0, 1, 3, 5))
    value = find(r"Value \(bill\. IDR\) (" + NUM + r") (" + NUM + r")", p1, "average daily value on weekly page 1")
    cap = find(r"Market Cap \(trill\. IDR\) (" + NUM + r") (" + NUM + r")", p1, "market capitalisation on weekly page 1")
    close = find(r"Close (" + NUM + r") (" + NUM + r") (" + NUM + r") (" + NUM + r")", p1, "the IHSG close on weekly page 1")
    net = find(r"Net (?:Buy|Sell) Net (?:Buy|Sell) (" + NUM + r") (" + NUM + r")", p2, "the weekly foreign net on page 2")
    totals = {}
    for code, label in [("RG", r"Regular \(RG\)"), ("TN", r"Cash \(TN\)"), ("NG", r"Negotiated \(NG\)")]:
        row = find(label + r" ([\d,]+) [\d.]+ ([\d,]+) [\d.]+ ([\d,]+)", p4, f"the {code} row on weekly page 4")
        totals[code] = dict(zip(["volume", "valueIdr", "frequency"], (int(g.replace(",", "")) for g in row.groups())))
    buy = find(r"\bBuy [\d,]+ ([\d,]+)", p6, "foreign buy value on weekly page 6")
    sell = find(r"\bSell [\d,]+ ([\d,]+)", p6, "foreign sell value on weekly page 6")
    return {
        "avgDailyValueBn": {"lastWeek": num(value[1]), "thisWeek": num(value[2])},
        "idxMarketCapTn": {"lastWeek": num(cap[1]), "thisWeek": num(cap[2])},
        "ihsg": {"lastWeek": num(close[1]), "thisWeek": num(close[2]), "change": num(close[3]), "changePct": num(close[4])},
        "officialNetBn": {"thisWeek": num(net[1]), "lastWeek": num(net[2])},
        "marketTotals": totals,
        "foreign": {"buyIdr": int(buy[1].replace(",", "")), "sellIdr": int(sell[1].replace(",", ""))},
        "breadthTextOrder": re.findall(r"([\d,]+) \((\d+)%\)", p4)[:5],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", type=pathlib.Path)
    ap.add_argument("output", type=pathlib.Path)
    ap.add_argument("--prior-close", type=float, help="the previous week's last close, to check the first day's Previous")
    ap.add_argument("--render", type=pathlib.Path, help="write the pages that must be read visually as PNG files here")
    args = ap.parse_args()

    dailies = sorted(args.folder.glob("ds_*.pdf"))
    weeklies = sorted(args.folder.glob("ws_*.pdf"))
    if not dailies or len(weeklies) != 1:
        raise SystemExit("Expected ds_YYMMDD.pdf daily files and exactly one ws_YYMMDD.pdf weekly file.")
    files = dailies + weeklies
    days = [read_daily(p) for p in dailies]
    week = read_weekly(weeklies[0])
    stamp = weeklies[0].stem[-6:]
    week_ending = f"20{stamp[:2]}-{stamp[2:4]}-{stamp[4:]}"

    checks = []

    def check(name, ok, detail):
        checks.append({"check": name, "ok": bool(ok), "detail": detail})

    check("last daily file is the week ending", days[-1]["date"] == week_ending, f"{days[-1]['date']} vs {week_ending}")
    if args.prior_close is not None:
        check("first Previous equals the prior week's close", abs(days[0]["previous"] - args.prior_close) < 0.0005,
              f"{days[0]['previous']} vs {args.prior_close}")
    for a, b in zip(days, days[1:]):
        check(f"{b['date']} Previous equals {a['date']} close", abs(b["previous"] - a["close"]) < 0.0005, f"{b['previous']} vs {a['close']}")
        check(f"{b['date']} YTD foreign net chains", abs(a["ytdNetBn"] + b["officialNetBn"] - b["ytdNetBn"]) <= 0.02,
              f"{a['ytdNetBn']} + {b['officialNetBn']} vs {b['ytdNetBn']}")
    check("weekly close equals the last daily close", abs(week["ihsg"]["thisWeek"] - days[-1]["close"]) < 0.0005,
          f"{week['ihsg']['thisWeek']} vs {days[-1]['close']}")
    if args.prior_close is not None:
        check("weekly last-week close equals the prior close", abs(week["ihsg"]["lastWeek"] - args.prior_close) < 0.0005,
              f"{week['ihsg']['lastWeek']} vs {args.prior_close}")
    for code in ["RG", "TN", "NG"]:
        for field in ["volume", "valueIdr", "frequency"]:
            total = sum(d["markets"][code][field] for d in days)
            check(f"daily {code} {field} sums to the weekly table", total == week["marketTotals"][code][field],
                  f"{total} vs {week['marketTotals'][code][field]}")
    exact = (week["foreign"]["buyIdr"] - week["foreign"]["sellIdr"]) / 1e9
    check("weekly buy less sell matches the printed weekly net", abs(exact - week["officialNetBn"]["thisWeek"]) <= 0.01,
          f"{exact:.6f} vs {week['officialNetBn']['thisWeek']}")
    rounded = sum(d["officialNetBn"] for d in days)
    check("rounded daily nets sum to the weekly net", abs(rounded - exact) <= 0.05, f"{rounded:.2f} vs {exact:.6f}")

    result = {
        "weekEnding": week_ending,
        "sourceFiles": [{"file": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],
        "daily": days,
        "weekly": week,
        "weeklyForeign": week["foreign"],
        "weeklyBreadth": None,
        "lastDayBreadth": None,
        "breadthMethod": "Not filled by this script. Read the counts from weekly page 4 and the last daily page 5 by "
                         "colour against the legend, then recompute every share from the counts.",
        "checks": checks,
    }
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    if args.render:
        args.render.mkdir(parents=True, exist_ok=True)
        for page in (3, 4, 6):
            pymupdf.open(weeklies[0])[page].get_pixmap(dpi=100).save(args.render / f"{weeklies[0].stem}_p{page + 1}.png")
        pymupdf.open(dailies[-1])[4].get_pixmap(dpi=100).save(args.render / f"{dailies[-1].stem}_p5.png")

    failed = [c for c in checks if not c["ok"]]
    for c in checks:
        print(("ok    " if c["ok"] else "FAIL  ") + c["check"] + "  (" + c["detail"] + ")")
    print(f"\n{len(checks) - len(failed)} of {len(checks)} checks passed. Written to {args.output}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
