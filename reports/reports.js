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
                 "power-behind-ai.html"; used instead of a PDF
    tags         optional list of words the library search also looks at
    pages        optional, number of pages
    fileSize     optional, size of the PDF in bytes
    extra        optional list of [label, value] pairs for the key data panel
*/
window.LONGHAND_REPORTS = [
  {
    "id": "ihsg-weekly-2026-09-25",
    "ticker": "IHSG",
    "exchange": "IDX",
    "company": "Indonesia equity market",
    "sector": "Macro and equities",
    "category": "Update",
    "title": "The Fed Tightened. BI Held.",
    "date": "2026-09-26",
    "blurb": "The IHSG lost 3.09% as Wednesday’s recovery gave way. Five charts, transparent calculations and an interactive currency-return lab examine the week.",
    "summary": "An English IHSG Weekly Market Update for 21–25 September 2026, with closing-price charts, daily sector comparisons, breadth, trading-mix analysis and bank flows. Explore hypothetical dollar returns in the Longhand Return Lab and download the source-linked inputs. Observations, calculation methods and data-window limitations are disclosed throughout.",
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
    "summary": "Indonesia’s data-centre boom is becoming an energy story. PLN puts installed data-centre IT capacity at about 580 MW in 2026 and projects a power need of 25,297 MW by 2034, while Jakarta’s pipeline has grown to 1,699 MW. This interactive report maps where the economic value accrues across the chain from AI to connectivity, with a power calculator, exposure maps for nine listed companies, a DCF and a seeded Monte Carlo simulation. It makes no recommendations.",
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
    "title": "Dovish or Hawkish",
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
