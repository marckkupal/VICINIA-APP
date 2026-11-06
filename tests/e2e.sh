#!/usr/bin/env bash
# Profile + settings end to end. Each phase is a separate process = an app restart. Backend state lives in $FAKE_BACKEND, "device" storage in $VERIFY_STORE.
set -e
export NODE_PATH=$PWD/tests/stubs:$(npm root -g)
export FAKE_BACKEND=/tmp/e2e-backend.json
A=/tmp/e2e-deviceA.json; B=/tmp/e2e-deviceB.json; E=/tmp/e2e-errors.json
rm -f $FAKE_BACKEND $A $B $E
run() { VERIFY_STORE=$1 npx tsx tests/e2e.profile.ts $2; }
run $A seed
run $A session1      # launch 1 on device A: edit + toggles
run $A session2      # restart: reload from the account, pick up another device's change
run $A offline       # restart, network drops
run $B deviceB       # a different phone
run $A otherAccount  # another account on device A
run $E seed
run $E errors        # failure handling
