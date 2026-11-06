#!/usr/bin/env python3
"""Validates src/content/organizations/**/organization.json and event.json.
Usage: python3 tools/validate_content.py [content_dir]   (exit 1 on any error)"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'src')
CONTENT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SRC, 'content')
ORGS = os.path.join(CONTENT, 'organizations')
errors, warnings = [], []
err = lambda p, m: errors.append(f'{os.path.relpath(p, CONTENT)}: {m}')

BANNED = re.compile(r'talents[\s_-]?guild', re.I)
ISO = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$')
HEX = re.compile(r'^#[0-9A-Fa-f]{6}$')
ORG_REQ = {'id': str, 'name': str, 'emoji': str, 'members': int}
EVENT_REQ = ['id', 'kind', 'title', 'icon', 'bg', 'mon', 'day', 'dateLong', 'dateShort', 'time', 'venue', 'campus', 'about']
EXPECTED_ORGS, EXPECTED_ACADEMIC, EXPECTED_NON_ACADEMIC = 9, 6, 3
FEATURED_TS = os.path.join(SRC, 'featuredEvents.ts')
PAYO = {'id': 'payopitongpitik', 'name': 'PayoPitongPitik Society'}


def valid_date(v, day_only=False):
    import datetime
    if not isinstance(v, str): return False
    m = re.match(r'^(\d{4})-(\d{2})(?:-(\d{2}))?$', v)
    if not m or (day_only and not m.group(3)): return False
    try: datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3) or 1)); return True
    except ValueError: return False


def load(p):
    try:
        return json.load(open(p, encoding='utf-8'))
    except Exception as e:
        err(p, f'invalid JSON ({e})'); return None


def check_assets(p, d):
    for f in ('logo', 'image', 'poster'):
        v = d.get(f)
        if v is None: continue
        if not isinstance(v, str) or not v: err(p, f'"{f}" must be a relative path string'); continue
        if os.path.isabs(v) or '://' in v or '..' in v.split('/'): err(p, f'"{f}" must be a plain relative path inside its folder: {v}'); continue
        if not os.path.isfile(os.path.join(os.path.dirname(p), v)): err(p, f'"{f}" file not found: {v}')


orgs, events, dir_orgs = {}, {}, {}
for dp, _, files in sorted(os.walk(ORGS)):
    for n in sorted(files):
        p = os.path.join(dp, n)
        if n not in ('organization.json', 'event.json'):
            continue
        raw = open(p, encoding='utf-8').read()
        if BANNED.search(raw): err(p, 'contains the old "Talents Guild" name; use "PayoPitongPitik Society" (id payopitongpitik)')
        d = load(p)
        if not isinstance(d, dict):
            if d is not None: err(p, 'top level must be an object')
            continue
        if not isinstance(d.get('order', 0), int) or isinstance(d.get('order'), bool): err(p, '"order" must be an integer')
        check_assets(p, d)
        if n == 'organization.json' and 'group' in d:
            # Directory organization (Boards page): academic / non-academic.
            if d['group'] not in ('academic', 'non-academic'): err(p, '"group" must be "academic" or "non-academic"')
            for k in ('id', 'category', 'description'):
                if not isinstance(d.get(k), str) or not d.get(k).strip(): err(p, f'"{k}" is required (string)')
            if not any(isinstance(d.get(k), str) and d.get(k).strip() for k in ('full_name', 'fullName', 'name')): err(p, '"full_name" is required')
            if not isinstance(d.get('short_name', d.get('shortName')), str): err(p, '"short_name" is required (string)')
            if not isinstance(d.get('description_verified', d.get('descriptionVerified')), bool): err(p, '"description_verified" must be true or false')
            if not isinstance(d.get('tags'), list) or not all(isinstance(t, str) and t.strip() for t in d.get('tags', [])): err(p, '"tags" must be a list of strings')
            if not d.get('logo'): warnings.append(f'{os.path.relpath(p, CONTENT)}: no logo (the app shows a neutral placeholder)')
            i = d.get('id')
            if i in orgs: err(p, f'duplicate organization id "{i}"')
            else: orgs[i] = p; dir_orgs[i] = d
            if i == PAYO['id'] and d.get('full_name', d.get('name')) != PAYO['name']: err(p, f'id payopitongpitik must be named "{PAYO["name"]}"')
            if d.get('full_name', d.get('name')) == PAYO['name'] and i != PAYO['id']: err(p, f'"{PAYO["name"]}" must use id "{PAYO["id"]}"')
        elif n == 'organization.json':
            for k, t in ORG_REQ.items():
                if not isinstance(d.get(k), t) or isinstance(d.get(k), bool) or d.get(k) == '': err(p, f'"{k}" is required ({t.__name__})')
            for k in ('tint',):
                if k in d and not HEX.match(str(d[k])): err(p, f'"{k}" must be #RRGGBB')
            i = d.get('id')
            if i in orgs: err(p, f'duplicate organization id "{i}" (also in {os.path.relpath(orgs[i], CONTENT)})')
            else: orgs[i] = p
            if i == PAYO['id'] and d.get('name') != PAYO['name']: err(p, f'id payopitongpitik must be named "{PAYO["name"]}"')
            if d.get('name') == PAYO['name'] and i != PAYO['id']: err(p, f'"{PAYO["name"]}" must use id "{PAYO["id"]}"')
        else:
            start = d.get('start_at', d.get('startAt'))
            if start is not None:
                # New format: one ISO timestamp with an offset; date, time and status are derived from it.
                for k in ('id', 'title'):
                    if not isinstance(d.get(k), str) or not d.get(k).strip(): err(p, f'"{k}" is required (string)')
                if not isinstance(start, str) or not ISO.match(start): err(p, '"start_at" must be an ISO time with an offset, e.g. 2026-11-05T13:00:00+08:00')
                end = d.get('end_at', d.get('endAt'))
                if end is not None and (not isinstance(end, str) or not ISO.match(end) or (isinstance(start, str) and ISO.match(start) and end <= start and end[19:] == start[19:])): err(p, '"end_at" must be an ISO time with an offset, after "start_at"')
            elif d.get('date') is not None:
                # Date without a clock time ("2026-10-28" or "2024-04"); `time` is free text shown as written.
                for k in ('id', 'title'):
                    if not isinstance(d.get(k), str) or not d.get(k).strip(): err(p, f'"{k}" is required (string)')
                if not valid_date(d.get('date')): err(p, '"date" must be a real YYYY-MM-DD or YYYY-MM date')
                de = d.get('date_end')
                if de is not None and (not valid_date(de, day_only=True) or not valid_date(d.get('date'), day_only=True) or de <= d['date']): err(p, '"date_end" must be a real YYYY-MM-DD date after "date" (and "date" must be a full day)')
                if 'time' in d and not isinstance(d['time'], str): err(p, '"time" must be text')
            elif d.get('date_tba', d.get('dateTba')) is True:
                for k in ('id', 'title'):
                    if not isinstance(d.get(k), str) or not d.get(k).strip(): err(p, f'"{k}" is required (string)')
            else:
                if 'date_tba' in d and d['date_tba'] is not True: err(p, '"date_tba" must be true (or leave it out and give start_at)')
                for k in EVENT_REQ:
                    if not isinstance(d.get(k), str) or not d.get(k): err(p, f'"{k}" is required (string)')
            if 'fee' in d and not (d['fee'] is None or (isinstance(d['fee'], (int, float)) and not isinstance(d['fee'], bool))): err(p, '"fee" must be a number or null')
            if 'bg' in d and not (isinstance(d.get('bg'), str) and HEX.match(d['bg'])): err(p, '"bg" must be #RRGGBB')
            vh = d.get('verified_by_human', d.get('verifiedByHuman'))
            if vh is not None and not isinstance(vh, bool): err(p, '"verified_by_human" must be true or false')
            i = d.get('id')
            if i in events: err(p, f'duplicate event id "{i}" (also in {os.path.relpath(events[i], CONTENT)})')
            else: events[i] = (p, d)

if True:
    ac = [i for i, d in dir_orgs.items() if d.get('group') == 'academic']
    na = [i for i, d in dir_orgs.items() if d.get('group') == 'non-academic']
    if (len(dir_orgs), len(ac), len(na)) != (EXPECTED_ORGS, EXPECTED_ACADEMIC, EXPECTED_NON_ACADEMIC):
        errors.append(f'Boards page needs exactly {EXPECTED_ORGS} organizations ({EXPECTED_ACADEMIC} academic, {EXPECTED_NON_ACADEMIC} non-academic); found {len(dir_orgs)} ({len(ac)} academic, {len(na)} non-academic)')

if os.path.isfile(FEATURED_TS):
    m = re.search(r'FEATURED_EVENT_IDS\s*=\s*\[(.*?)\]', open(FEATURED_TS, encoding='utf-8').read(), re.S)
    ids = re.findall(r"'([^']+)'", m.group(1)) if m else []
    if len(ids) != 4 or len(set(ids)) != 4: errors.append(f'featuredEvents.ts must list exactly 4 distinct ids; found {len(ids)}')
    for fid in ids:
        if fid not in events: errors.append(f'featuredEvents.ts: featured event "{fid}" has no event.json'); continue
        fp, fd = events[fid]
        if not isinstance(fd.get('verified_by_human', fd.get('verifiedByHuman')), bool): err(fp, '"verified_by_human" is required (true or false) on a featured event')
        if not fd.get('poster'): warnings.append(f'{os.path.relpath(fp, CONTENT)}: no poster (the app shows a neutral placeholder)')

for i, (p, d) in events.items():
    oid = d.get('organizationId', d.get('organization_id'))
    if oid is None: warnings.append(f'{os.path.relpath(p, CONTENT)}: no organizationId')
    elif oid not in orgs: err(p, f'organizationId "{oid}" does not match any organization')

# The app source must not carry the old name either.
for dp, _, files in os.walk(SRC):
    for n in files:
        if n.endswith(('.ts', '.tsx', '.json')) and BANNED.search(open(os.path.join(dp, n), encoding='utf-8', errors='ignore').read()):
            errors.append(f'{os.path.relpath(os.path.join(dp, n), SRC)}: contains "Talents Guild"')

# generated.ts must match the content on disk.
gen = os.path.join(CONTENT, 'generated.ts')
if CONTENT == os.path.join(SRC, 'content') and os.path.isfile(gen):
    before = open(gen, encoding='utf-8').read()
    subprocess.run([sys.executable, os.path.join(HERE, 'build_content_index.py')], check=True, stdout=subprocess.DEVNULL)
    if open(gen, encoding='utf-8').read() != before:
        errors.append('generated.ts was out of date and has been regenerated; re-run the check')

print(f'{len(orgs)} organizations, {len(events)} events checked')
for w in warnings: print('WARN ', w)
for e in errors: print('ERROR', e)
print('FAILED' if errors else 'OK')
sys.exit(1 if errors else 0)
