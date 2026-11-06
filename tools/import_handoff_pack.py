#!/usr/bin/env python3
"""Imports the Vicinia handoff pack (content/organizations/**) into src/content/organizations/<id>/.
Converts the pack schema (docs/DATA_SCHEMA.md) to the app schema (see src/CHANGES.md, "Boards page"/"Events page").
Usage: python3 tools/import_handoff_pack.py <path-to-Vicinia_Claude_Handoff_Pack>
Safe to re-run: it only rewrites the nine pack organizations, never the starter boards. Afterwards run
  python3 tools/build_content_index.py && python3 tools/validate_content.py
Nothing is invented: unknown venues/times stay unset, every event keeps verified_by_human=false from the pack."""
import glob, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, '..', 'src', 'content', 'organizations')
if len(sys.argv) != 2: sys.exit(__doc__)
PACK = os.path.join(sys.argv[1], 'content', 'organizations')
ORDER_BASE = {'academic': 200, 'non-academic': 210}


def dump(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2); f.write('\n')


def title(tag): return tag.replace('-', ' ').title()


def copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst)


n_org = n_ev = 0
EVENT_ORDER_BASE = 200   # after the starter events (0-7), so ordering never collides
seen = {'academic': 0, 'non-academic': 0}
for opath in sorted(glob.glob(os.path.join(PACK, '*', '*', 'organization.json'))):
    folder = os.path.dirname(opath)
    o = json.load(open(opath, encoding='utf-8'))
    oid, group = o['id'], o['category']
    assert os.path.basename(folder) == oid, f'{folder}: folder name must equal id'
    out_dir = os.path.join(DEST, oid)
    if os.path.isdir(out_dir): shutil.rmtree(out_dir)
    org = {
        'order': ORDER_BASE[group] + seen[group], 'id': oid, 'group': group,
        'full_name': o['name'], 'short_name': o['short_name'],
        # The pack has no display category, so it is the first tag, title-cased (e.g. "Computing"). Change in organization.json if wrong.
        'category': title(o['tags'][0]) if o.get('tags') else ('Academic' if group == 'academic' else 'Non-academic'),
        'description': o['description'], 'description_verified': o['description_verified'] is True,
        'tags': o['tags'], 'publication_status': o.get('publication_status', 'draft_needs_review'),
    }
    seen[group] += 1
    if o.get('logo'):
        copy(os.path.join(folder, o['logo']), os.path.join(out_dir, o['logo'])); org['logo'] = o['logo']
        if o.get('logo_kind'): org['logo_kind'] = o['logo_kind']
    feat = o.get('featured_event')
    if feat: org['featured_event_id'] = json.load(open(os.path.join(folder, feat), encoding='utf-8'))['id']
    dump(os.path.join(out_dir, 'organization.json'), org); n_org += 1

    for rel in o.get('events', []):
        e = json.load(open(os.path.join(folder, rel), encoding='utf-8'))
        ev = {'order': EVENT_ORDER_BASE + n_ev, 'id': e['id'], 'organization_id': oid, 'title': e['title']}
        if e.get('date'):
            ev['date'] = e['date']
            if e.get('date_end'): ev['date_end'] = e['date_end']
        else:
            ev['date_tba'] = True      # the pack has no date: say so, never guess one
        if e.get('time'): ev['time'] = e['time']          # free text exactly as printed on the poster
        if e.get('venue'): ev['venue'] = e['venue']
        if e.get('summary'): ev['about'] = e['summary']
        ev['verified_by_human'] = e.get('verified_by_human') is True
        ev_dir = os.path.join(out_dir, 'events', e['id'])
        if e.get('image'):
            copy(os.path.join(os.path.dirname(os.path.join(folder, rel)), e['image']), os.path.join(ev_dir, e['image'])); ev['poster'] = e['image']
        dump(os.path.join(ev_dir, 'event.json'), ev); n_ev += 1
print(f'imported {n_org} organizations, {n_ev} events -> src/content/organizations/')
