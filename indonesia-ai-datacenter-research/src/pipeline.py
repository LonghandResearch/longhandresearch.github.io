"""One-command, offline, end-to-end reproduction of research outputs."""
import argparse
import hashlib
import importlib.metadata
import json
import platform
import subprocess
import sys
from config import ROOT, PROCESSED, INTERIM, write_json, file_sha256
from collect_data import collect
from clean_data import clean
from validate_data import validate
from scenario_model import run_scenarios
from sensitivity import run_sensitivity
from national_impact import run_national_impact
from charts import generate_charts

def pipeline(skip_excel=False):
    collect()
    clean()
    validate()
    run_scenarios()
    run_sensitivity()
    run_national_impact()
    validate()
    generate_charts()
    if not skip_excel:
        from export_excel import export_excel
        export_excel()
    from research_summary import write_summary
    write_summary()
    from export_interactive import export_interactive
    export_interactive()
    result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', str(ROOT / 'tests'), '-v'], cwd=ROOT)
    if result.returncode: raise RuntimeError('Model tests failed')
    manifest = {
        'python': platform.python_version(),
        'packages': {n: importlib.metadata.version(n) for n in ['pandas','numpy','matplotlib','openpyxl','requests','PyYAML','nbformat','nbclient']},
        'hash_policy': 'SHA-256 after CRLF-to-LF normalization for text files. Binary files use original bytes.',
        'inputs_sha256': {p.relative_to(ROOT).as_posix(): file_sha256(p)
                          for p in [ROOT / 'assumptions.yaml', ROOT / 'sources.csv', ROOT / 'docs/newsletter_copy.md',
                                    ROOT / 'data/raw/evidence/indonesia_geometry.json',
                                    *sorted((ROOT / 'data' / 'raw' / 'observations').glob('*.json'))]},
        'interactive_sha256': {p.name: file_sha256(p)
                               for p in sorted((ROOT / 'interactive').glob('*')) if p.is_file()},
        'processed_sha256': {p.name: file_sha256(p) for p in sorted(PROCESSED.glob('*.csv'))},
        'research_cutoff': '2026-10-04', 'mode': 'offline curated evidence; no live data substitution',
    }
    write_json(ROOT / 'outputs' / 'run_manifest.json', manifest)
    print('Research pipeline completed. See outputs/summary.md and the workbook.')

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--skip-excel', action='store_true')
    pipeline(p.parse_args().skip_excel)
