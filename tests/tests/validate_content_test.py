#!/usr/bin/env python3
"""Run: python3 tests/validate_content_test.py
Builds a throwaway content folder from FIXTURES (made-up orgs/events, never shipped) and checks that
tools/validate_content.py accepts a correct set and rejects each kind of mistake."""
import json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
VALIDATOR = os.path.join(HERE, '..', 'tools', 'validate_content.py')
FEATURED = ['valorant-summit-5v5', 'code-relay-2026', 'datastream-jacked-into-the-grid', 'rgc-review-group-conference']


def build(root, orgs=9, academic=6, mutate=None):
    shutil.rmtree(root, ignore_errors=True)
    for i in range(orgs):
        d = os.path.join(root, 'organizations', f'org-{i}'); os.makedirs(d)
        org = {'id': f'org-{i}', 'group': 'academic' if i < academic else 'non-academic', 'full_name': f'Fixture Org {i}', 'short_name': f'FO{i}',
               'category': 'Fixture', 'description': 'Made-up.', 'description_verified': i % 2 == 0, 'tags': ['a']}
        json.dump(org, open(os.path.join(d, 'organization.json'), 'w'))
    for i, eid in enumerate(FEATURED):
        d = os.path.join(root, 'organizations', f'org-{i}', 'events', eid); os.makedirs(d)
        ev = {'id': eid, 'title': f'Fixture {eid}', 'start_at': '2026-12-01T10:00:00+08:00', 'verified_by_human': i % 2 == 0, 'organization_id': f'org-{i}'}
        json.dump(ev, open(os.path.join(d, 'event.json'), 'w'))
    if mutate: mutate(root)


def run(root):
    r = subprocess.run([sys.executable, VALIDATOR, root], capture_output=True, text=True)
    return r.returncode, r.stdout


def edit(path, fn):
    def go(root):
        p = os.path.join(root, 'organizations', *path)
        d = json.load(open(p)); fn(d); json.dump(d, open(p, 'w'))
    return go


fails = 0
def check(name, code, out, expect_ok, needle=None):
    global fails
    good = (code == 0) == expect_ok and (needle is None or needle in out)
    print(('PASS ' if good else 'FAIL ') + name)
    if not good: fails += 1; print(out)

tmp = tempfile.mkdtemp()
root = os.path.join(tmp, 'content')
cases = [
    ('correct set (9 orgs: 6 academic + 3 non-academic, 4 featured events)', {}, True, None),
    ('8 organizations rejected', dict(orgs=8, academic=6), False, 'exactly 9'),
    ('5 academic + 4 non-academic rejected', dict(academic=5), False, 'exactly 9'),
    ('missing description_verified rejected', dict(mutate=edit(['org-0', 'organization.json'], lambda d: d.pop('description_verified'))), False, 'description_verified'),
    ('logo path that does not exist rejected', dict(mutate=edit(['org-0', 'organization.json'], lambda d: d.update(logo='nope.png'))), False, 'file not found'),
    ('featured event missing verified_by_human rejected', dict(mutate=edit(['org-0', 'events', FEATURED[0], 'event.json'], lambda d: d.pop('verified_by_human'))), False, 'verified_by_human'),
    ('date without a time zone offset rejected', dict(mutate=edit(['org-0', 'events', FEATURED[0], 'event.json'], lambda d: d.update(start_at='2026-12-01T10:00:00'))), False, 'start_at'),
    ('event pointing at an unknown organization rejected', dict(mutate=edit(['org-0', 'events', FEATURED[0], 'event.json'], lambda d: d.update(organization_id='ghost'))), False, 'does not match'),
    ('explicit date_tba event accepted', dict(mutate=edit(['org-0', 'events', FEATURED[0], 'event.json'], lambda d: (d.pop('start_at'), d.update(date_tba=True)))), True, None),
    ('event with neither start_at nor date_tba rejected', dict(mutate=edit(['org-0', 'events', FEATURED[0], 'event.json'], lambda d: d.pop('start_at'))), False, 'is required'),
    ('old name "Talents Guild" rejected', dict(mutate=edit(['org-0', 'organization.json'], lambda d: d.update(description='Talents Guild'))), False, 'Talents Guild'),
    ('payopitongpitik under the wrong name rejected', dict(mutate=edit(['org-0', 'organization.json'], lambda d: d.update(id='payopitongpitik', full_name='Other'))), False, 'payopitongpitik'),
]
for name, kw, expect_ok, needle in cases:
    build(root, **kw); code, out = run(root); check(name, code, out, expect_ok, needle)

def drop_event(root):
    shutil.rmtree(os.path.join(root, 'organizations', 'org-3', 'events'))
build(root, mutate=drop_event); code, out = run(root); check('a featured id with no event.json rejected', code, out, False, 'has no event.json')
shutil.rmtree(tmp)
print('\n%s' % ('%d FAILED' % fails if fails else 'ALL PASSED')); sys.exit(1 if fails else 0)
