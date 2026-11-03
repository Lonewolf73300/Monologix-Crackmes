// Faux service push HTTPS (remplace FCM/Mozilla/Apple) : enregistre les requêtes reçues de web-push.
const https = require("https"), fs = require("fs");
const received = [];
https.createServer({ key: fs.readFileSync(process.env.MOCK_KEY), cert: fs.readFileSync(process.env.MOCK_CERT) }, (req, res) => {
  if (req.url === "/received") { res.setHeader("content-type", "application/json"); return res.end(JSON.stringify(received)); }
  const chunks = []; req.on("data", (c) => chunks.push(c));
  req.on("end", () => { received.push({ url: req.url, headers: req.headers, bytes: Buffer.concat(chunks).length }); res.statusCode = 201; res.end(); });
}).listen(Number(process.env.MOCK_PORT));
