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
    pages        optional, number of pages
    fileSize     optional, size of the PDF in bytes
    extra        optional list of [label, value] pairs for the key data panel
*/
window.LONGHAND_REPORTS = [
  {
    "id": "macro-2026-09-12",
    "ticker": "",
    "company": "Rates, Currency. and Equities",
    "category": "Macro",
    "title": "Dovish or Hawkish",
    "date": "2026-09-12",
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
