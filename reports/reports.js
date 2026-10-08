/*
  Longhand Research: the report catalogue.

  Every published report is one entry in the list below. The site sorts
  them by date, so the order here does not matter.

  To publish a new report:
    1. Put the PDF in this folder (reports/).
    2. Add an entry below. "Add report" on the site (author mode) writes
       the entry for you, or publishes it straight into this folder.

  Fields
    id           unique, used in the report's web address
    ticker       the ticker as listed, for example "ADRO", "AAPL" or "0700.HK";
                 leave "" for sector or macro notes
    exchange     optional, for example "IDX", "NYSE" or "HKEX"
    company      company name, or the subject of a sector or macro note
    sector       optional, shown on the report page
    category     "Initiation", "Update", "Sector" or "Macro"
    title        the report headline
    date         publication date, YYYY-MM-DD
    blurb        one or two sentences for the report list
    summary      the longer abstract shown on the report page
    rating       "BUY", "HOLD", "SELL" or null
    currency     the currency of the prices, for example "IDR", "USD" or "HKD"
    price        closing price used in the report, or null
    targetPrice  target price, or null
    upside       % to target; worked out from price and target if left out
    pdfUrl       path to the PDF, for example "reports/My_Report.pdf"
    page         optional: an interactive report that is its own page, for example
                 "power-behind-ai.html"; used instead of a PDF. For an IHSG
                 weekly data edition, use "ihsg-weekly.html?week=YYYY-MM-DD"
    tags         optional list of words the library search also looks at
    pages        optional, number of pages
    fileSize     optional, size of the PDF in bytes
    extra        optional list of [label, value] pairs for the key data panel
*/
window.LONGHAND_REPORTS = [
  {
    "id": "us-treasury-update-2026-10-08",
    "ticker": "",
    "company": "US Treasury market and the US economy",
    "sector": "US rates and economic activity",
    "category": "Update",
    "title": "Higher Yields, Uneven Effects",
    "date": "2026-10-08",
    "blurb": "Treasury yields and mortgage rates have risen, while spending, business equipment and housing show a mixed economic picture.",
    "summary": "US Treasury yields rose sharply over the three months to 6 October, while mortgage rates also increased. The wider economic picture remains mixed: August consumer spending and equipment measures grew, but housing was less consistent. Seven charts trace the repricing, its financial backdrop and the limits of the available evidence. Higher financing costs are visible; a broad downturn caused by Treasury repricing has yet to be established.",
    "tags": [
      "US Treasury",
      "Bonds",
      "Yields",
      "United States",
      "Federal Reserve",
      "Mortgage Rates",
      "Financial Conditions",
      "Economy"
    ],
    "rating": null,
    "currency": "USD",
    "price": null,
    "targetPrice": null,
    "upside": null,
    "pdfUrl": "reports/US_Treasury_Repricing_Update_2026-10-08.pdf",
    "pages": 6,
    "fileSize": 86394,
    "extra": [
      [
        "Market data cutoff",
        "6 October 2026"
      ],
      [
        "Assessment date",
        "8 October 2026"
      ]
    ]
  },
  {
    "id": "indonesia-ai-power-water-2026-10-05",
    "ticker": "",
    "company": "Indonesia data centers, electricity and water",
    "sector": "AI infrastructure and utilities",
    "category": "Sector",
    "title": "AI Runs on Power and Water",
    "date": "2026-10-05",
    "blurb": "An interactive Indonesia study of electricity demand, cooling water and operating costs, with a resource calculator, project atlas and reproducible research model.",
    "summary": "The investment case for Indonesian AI infrastructure depends on usable power, dependable cooling and pipeline execution. This report separates disclosed capacity from metered consumption, models electricity and direct cooling water under explicit assumptions, and examines local infrastructure requirements. It includes an interactive calculator, a regional project atlas, conditional expansion scenarios, an Excel model and the Python research files. Research cutoff: 4 October 2026.",
    "tags": ["AI", "Indonesia", "Data Centers", "Electricity", "Water", "Infrastructure", "Energy", "Utilities", "Scenarios"],
    "rating": null,
    "currency": "IDR",
    "price": null,
    "targetPrice": null,
    "upside": null,
    "page": "indonesia-ai-datacenter-research/interactive/index.html"
  },
  {
    "id": "inet-2026-09-27",
    "ticker": "INET",
    "exchange": "IDX",
    "company": "Sinergi Inti Andalan Prima Tbk",
    "sector": "Digital infrastructure",
    "category": "Initiation",
    "title": "Priced for a Network Nobody Has Paid For Yet",
    "date": "2026-09-27",
    "blurb": "Initiating at SELL, target Rp175. Revenue rose twenty times on acquisitions, but the internet EBITDA the price assumes does not exist yet.",
    "summary": "We initiate on INET with a SELL and a 12-month target of Rp175 (-39.7%), against a bear, base and bull range of Rp65, Rp158 and Rp325. INET raised about Rp4.2 trillion in H1 2026 but deployed only Rp849 billion by June, on acquisitions and network capacity, and held Rp4.34 trillion in cash. The deals lifted revenue twenty times, mostly through a thin-margin outsourcing business. The internet segment earns 92.6% of operating profit; at Rp290 the market prices roughly double our 2027 base case for its EBITDA at peer multiples.",
    "tags": ["INET", "Indonesia", "Internet", "Fiber", "Subsea cable", "Telecommunications", "Equity Research"],
    "rating": "SELL",
    "currency": "IDR",
    "price": 290,
    "targetPrice": 175,
    "upside": -39.7,
    "pdfUrl": "reports/INET_Initiation_Report.pdf",
    "pages": 24,
    "fileSize": 471328,
    "extra": [
      ["Market cap (Rp tn)", "6.49"],
      ["Shares out. (bn)", "22.37"],
      ["52-week range (Rp, rights adj.)", "157 to 685"],
      ["Price to book (June)", "1.77x"]
    ]
  },
  {
    "id": "ihsg-weekly-2026-10-02",
    "ticker": "IHSG",
    "exchange": "IDX",
    "company": "Indonesia equity market",
    "sector": "Macro and equities",
    "category": "Update",
    "title": "Foreign Selling Deepened. Technology Led the Fall.",
    "date": "2026-10-03",
    "blurb": "The IHSG fell 3.28% as IDX recorded Rp5.04tn of foreign net selling, absorbed by domestic buyers. All eleven sectors fell, and GOTO alone cost the index 36.71 points.",
    "summary": "An English IHSG Weekly Market Update for 28 September to 2 October 2026 built on IDX daily and weekly statistics, Bank Indonesia JISDOR, and primary central-bank releases. It reconciles five daily foreign flows to the weekly total and uses IDX's seller-to-buyer table to show that domestic investors absorbed the selling. It also measures market breadth and all 11 weekly sector indices, traces the leading and lagging stock contributions, shows how one low-priced stock dominated Friday's share volume, and compares the IHSG with its ASEAN peers. The currency-return lab starts from observed JISDOR endpoints.",
    "tags": ["IHSG", "Indonesia", "Weekly Market Update", "Macro", "Foreign Flow", "Rupiah", "GOTO", "Technology"],
    "rating": null,
    "currency": "IDR",
    "price": null,
    "targetPrice": null,
    "upside": null,
    "page": "ihsg-weekly.html?week=2026-10-02"
  },
  {
    "id": "ihsg-weekly-2026-09-25",
    "ticker": "IHSG",
    "exchange": "IDX",
    "company": "Indonesia equity market",
    "sector": "Macro and equities",
    "category": "Update",
    "title": "Foreign Selling Persisted. The Rebound Failed.",
    "date": "2026-09-26",
    "blurb": "The IHSG fell 3.09% as IDX recorded Rp3.16tn of foreign net selling. Official weekly sectors, index movers and BI JISDOR clarify the risk.",
    "summary": "An English IHSG Weekly Market Update for 21–25 September 2026 built on IDX daily and weekly statistics and Bank Indonesia JISDOR. It reconciles five daily foreign flows to the weekly total, ranks all 11 weekly sector indices and traces the leading stock contributions to the IHSG decline. The currency-return lab starts from observed JISDOR endpoints and labels its timing limitation.",
    "tags": ["IHSG", "Indonesia", "Weekly Market Update", "Macro", "Foreign Flow", "Rupiah", "Bank Indonesia", "Federal Reserve"],
    "rating": null,
    "currency": "IDR",
    "price": null,
    "targetPrice": null,
    "upside": null,
    "page": "ihsg-weekly-2026-09-25.html"
  },
  {
    "id": "the-power-behind-ai-2026-09-24",
    "ticker": "",
    "company": "Power, grid, land and data centres",
    "sector": "AI infrastructure and energy, Indonesia",
    "category": "Sector",
    "title": "The Power Behind AI",
    "date": "2026-09-24",
    "blurb": "Indonesia’s data-centre boom is becoming an energy story. Where does the value accrue across power, grid, connectivity, industrial land and data centres?",
    "summary": "Indonesia’s data-centre boom is becoming an energy story. PLN puts installed data-centre IT capacity at about 580 MW in 2026 and projects a power need of 25,297 MW by 2034, while Jakarta’s pipeline has grown to 1,699 MW. This interactive report maps where the economic value accrues across the chain from AI to connectivity, with a power calculator, exposure maps for ten listed companies, a DCF and a seeded Monte Carlo simulation. It makes no recommendations.",
    "tags": [
      "AI",
      "Data Centers",
      "Energy",
      "Power",
      "Infrastructure",
      "Indonesia",
      "Equity Research"
    ],
    "rating": null,
    "price": null,
    "targetPrice": null,
    "upside": null,
    "page": "power-behind-ai.html"
  },
  {
    "id": "macro-2026-09-24",
    "ticker": "",
    "company": "Rates, Currency, and Equities",
    "category": "Macro",
    "title": "Dovish or Hawkish?",
    "date": "2026-09-24",
    "summary": "This report began as a question with no settled answer. For most of 2026 the Federal Reserve sat still while the rupiah fell to the weakest level ever recorded, which is the opposite of what the textbook spillover story predicts. On 16 September the Fed finally moved, and on 23 September Bank Indonesia gave its answer. That pair of decisions is the first clean test of the argument set out here, so this version is written around it.",
    "rating": null,
    "price": null,
    "targetPrice": null,
    "upside": null,
    "pdfUrl": "reports/Dovish_or_Hawkish.pdf",
    "fileSize": 619302
  },
  {
    "id": "sector-2026-09-24",
    "ticker": "",
    "company": "DRAM, NAND, HBM",
    "category": "Sector",
    "title": "The Memory War",
    "date": "2026-09-24",
    "summary": "Memory has been one of the most cyclical corners of the chip industry for more than a decade. Oversupply and falling prices give way to shortages and price spikes, and then the whole thing repeats. Generative AI could break that pattern, or at least bend it. Every AI accelerator that ships needs HBM sitting right next to it, so memory demand is now tied directly to accelerator volumes.",
    "rating": null,
    "currency": "IDR",
    "price": null,
    "targetPrice": null,
    "upside": null,
    "pdfUrl": "reports/The_Memory_War.pdf",
    "fileSize": 6020857
  },
  {
    "id": "adro-2026-09-03",
    "ticker": "ADRO",
    "exchange": "IDX",
    "company": "Alamtri Resources Indonesia Tbk",
    "sector": "Metallurgical coal, mining services, aluminium",
    "category": "Initiation",
    "title": "The Smelter Is the Whole Thesis",
    "date": "2026-09-03",
    "blurb": "Initiating at BUY, fair value IDR 3,354. FY2025 was the trough on price alone; the 500 ktpa aluminium smelter is the re-rating case.",
    "summary": "We initiate on ADRO with a BUY and a fair value of IDR 3,354 (+22.4%), an equal weighting of two DCF variants and two target-multiple approaches. FY2025 was the trough, driven entirely by a 25% fall in metallurgical-coal ASP. At 4.0x FY2027E EV/EBITDA the finished-but-not-yet-earning smelter is close to free; the risk is a slipping ramp, not solvency.",
    "rating": "BUY",
    "currency": "IDR",
    "price": 2740,
    "targetPrice": 3354,
    "upside": 22.4,
    "pdfUrl": "reports/ADRO_Initiation_Report.pdf",
    "pages": 9,
    "fileSize": 725164,
    "extra": [
      ["Market cap (US$ mn)", "4,720"],
      ["Shares out. (bn)", "28.80"],
      ["52-week range (IDR)", "1,640 to 2,840"],
      ["EV/EBITDA FY27E", "4.0x"]
    ]
  }
];
