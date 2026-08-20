import http from "http";

export class RemoteMachineBridge {
  constructor(port = 4002) {
    this.port = port;
    this.server = http.createServer((req, res) => {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        const clientIp = req.socket.remoteAddress;
        console.log(`\n[REMOTE_VPC_INGRESS]: Intercepted call from remote host IP: ${clientIp} on ${req.url}`);
        console.log(`[PAYLOAD]: ${body}`);

        // Verify remote token header
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer syn_")) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Unauthorized: Missing Synapse Remote VPC Token" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "VERIFIED_ACROSS_NETWORK",
          ingressIp: clientIp,
          timestamp: new Date().toISOString(),
          decision: { verdict: "ALLOWED", latencyMs: 1.2 }
        }));
      });
    });
  }

  start() {
    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`🌐 Synapse Remote Network Gateway listening on 0.0.0.0:${this.port} (Accepts all remote VPC IPs)`);
    });
  }
}

const bridge = new RemoteMachineBridge(4002);
bridge.start();
