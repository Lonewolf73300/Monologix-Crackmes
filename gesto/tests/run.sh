#!/bin/bash
# Usage: tests/run.sh [0|1]  — lance le serveur de prod sur une base vierge puis le test e2e (1 = avec extras).
cd "$(dirname "$0")/.."
export GESTO_DATA_DIR=$(mktemp -d) CRON_SECRET=testsecret GESTO_EXTRAS=${1:-0}
npx next start -p ${PORT:-3300} > /tmp/gesto-server.log 2>&1 & SRV=$!
for i in $(seq 1 40); do curl -s -o /dev/null localhost:${PORT:-3300}/ && break; sleep 0.5; done
BASE=http://localhost:${PORT:-3300} NODE_PATH=$(npm root -g) node tests/e2e.cjs; RC=$?
kill $SRV; exit $RC
