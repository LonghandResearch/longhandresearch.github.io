"""Build registry from immutable curated evidence; optionally archive live sources.

Offline mode is deterministic. Live fetches NEVER overwrite observations or evidence.
Downloads are content-addressed, and HTTP/access failures are recorded, not hidden.
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
import pandas as pd
import requests
from config import ROOT, RAW, INTERIM, SOURCE_COLUMNS, write_json, file_sha256

def collect(fetch=False):
    files = sorted((RAW / 'observations').glob('*.json'))
    if not files:
        raise FileNotFoundError('No curated observations: data/raw/observations/*.json')
    sources, manifest = [], []
    for path in files:
        obj = json.loads(path.read_text(encoding='utf-8-sig'))
        sources.extend(obj['sources'])
        manifest.append({'path': str(path.relative_to(ROOT)).replace('\\', '/'),
                         'sha256': file_sha256(path)})
    for path in sorted((RAW / 'evidence').glob('*')):
        # Full downloaded publications are local working copies, excluded from
        # the distributable evidence. Curated facts and locators are sufficient
        # for offline reproduction.
        if path.is_file() and path.suffix.lower() != '.pdf':
            manifest.append({'path': path.relative_to(ROOT).as_posix(),
                             'sha256': file_sha256(path)})
    sources.append(dict(source_id='MODEL001', category='model', organization='Analyst scenario model',
                        title='Transparent analyst assumptions and formulas', url='',
                        publication_date='', access_date='2026-10-04', data_type='scenario',
                        geography='Indonesia', facility='Not applicable', metric='Scenario drivers',
                        unit='Multiple; see assumptions.yaml', status='Analyst assumption',
                        quality_tier='Not applicable', notes='S classification; not an external observation.'))
    df = pd.DataFrame(sources)
    df['original_quality_tier'] = df.quality_tier
    df['quality_tier'] = df.quality_tier.astype(str).map(lambda v: f'Tier {v}' if v in ['1','2','3'] else v)
    research_orgs = 'Berkeley|Uptime|International Energy Agency|Cushman|Structure Research|Synergy|CBRE|Knight Frank|JLL'
    df.loc[df.organization.str.contains(research_orgs, case=False, na=False), 'quality_tier'] = 'Tier 2'
    for col in SOURCE_COLUMNS:
        if col not in df: df[col] = None
    if df.source_id.duplicated().any():
        raise ValueError('Duplicate source IDs; resolve explicitly in raw observations')
    df = df[SOURCE_COLUMNS + [c for c in df if c not in SOURCE_COLUMNS]]
    df.to_csv(ROOT / 'sources.csv', index=False, na_rep='NaN')
    write_json(INTERIM / 'input_manifest.json', manifest)
    if fetch:
        logs = []
        session = requests.Session()
        session.headers['User-Agent'] = 'IndonesiaResearch/1.0 public-source-archiver'
        for row in sources:
            url = row.get('url')
            if not url: continue
            log = {'source_id': row['source_id'], 'url': url,
                   'retrieved_at_utc': datetime.now(timezone.utc).isoformat()}
            try:
                r = session.get(url, timeout=30)
                log.update(http_status=r.status_code, final_url=r.url)
                r.raise_for_status()
                sha = hashlib.sha256(r.content).hexdigest()
                suffix = '.pdf' if 'pdf' in r.headers.get('Content-Type', '') else '.html'
                path = RAW / 'downloads' / f"{row['source_id']}_{sha}{suffix}"
                path.parent.mkdir(parents=True, exist_ok=True)
                if not path.exists(): path.write_bytes(r.content)
                log.update(sha256=sha, path=path.relative_to(ROOT).as_posix(), status='downloaded')
            except requests.RequestException as exc:
                log.update(status='unavailable', error=str(exc))
            logs.append(log)
        # Timestamped manifests preserve every live retrieval run.
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')
        write_json(INTERIM / f'live_collection_{stamp}.json', logs)
    print(f'Collected {len(df)} sources from {len(files)} observation files (offline evidence preserved).')
    return df

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--fetch', action='store_true', help='Archive live sources without changing observations')
    collect(p.parse_args().fetch)
