#!/bin/bash
# Usage: tests/run.sh [0|1]  (1 = avec GESTO_EXTRAS). Base vierge, test e2e, redémarrage, test de persistance.
# Rappels : faux service push HTTPS local + clés VAPID générées pour l'occasion.
cd "$(dirname "$0")/.."
PORT=${PORT:-3300}; T=$(mktemp -d)
export GESTO_DATA_DIR=$T/data CRON_SECRET=testsecret GESTO_EXTRAS=${1:-0} BASE=http://localhost:$PORT NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1
export MOCK_PORT=$((PORT+500)) MOCK_KEY=$T/k.pem MOCK_CERT=$T/c.pem NODE_EXTRA_CA_CERTS=$T/c.pem
openssl req -x509 -newkey rsa:2048 -nodes -keyout $MOCK_KEY -out $MOCK_CERT -days 1 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost" 2>/dev/null
eval "$(node -e 'const k=require("web-push").generateVAPIDKeys();console.log(`export VAPID_PUBLIC_KEY=${k.publicKey} VAPID_PRIVATE_KEY=${k.privateKey}`)')"
node tests/mockpush.cjs & MOCK=$!
start(){ npx next start -p $PORT > $T/server.log 2>&1 & SRV=$!; for i in $(seq 1 60); do curl -s -o /dev/null localhost:$PORT/ && break; sleep 0.5; done; }
start; RC=0
NODE_PATH=$(npm root -g) node tests/e2e.cjs || RC=1
kill $SRV; wait $SRV 2>/dev/null; echo "--- redémarrage du serveur ---"
if [ $RC = 0 ]; then start; NODE_PATH=$(npm root -g) node tests/persist.cjs || RC=1; kill $SRV; fi
kill $MOCK; exit $RC
