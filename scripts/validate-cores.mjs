// Optional integration check against locally installed official client cores.
// Only generated demo links are used; no user links are read or saved.
import { createServer } from "vite";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const binaries = {};
for (let i = 0; i < args.length; i += 2) {
  if (!["--mihomo", "--sing-box", "--xray"].includes(args[i]) || !args[i + 1])
    throw new Error(
      "Usage: node scripts/validate-cores.mjs --mihomo PATH --sing-box PATH --xray PATH",
    );
  binaries[args[i].slice(2)] = resolve(args[i + 1]);
}
if (!Object.keys(binaries).length)
  throw new Error("Provide at least one client core binary. See README.md.");
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { convert, EXAMPLE } = await server.ssrLoadModule("/src/converter.ts");
  const work = await mkdtemp(join(tmpdir(), "proxy-converter-"));
  const id = "a6e1f0c2-8b34-4d56-9e70-123456789abc";
  const base = `vless://${id}@node.example.com:443?security=tls`;
  const cases = {
    examples: EXAMPLE,
    "vless-reality": `vless://${id}@node.example.com:443?security=reality&pbk=${"a".repeat(43)}&sid=abcdef&flow=xtls-rprx-vision&fp=chrome`,
    "vless-ws-early-data": `${base}&type=ws&path=%2Fws%3Fed%3D2048&host=cdn.example.com`,
    "vless-grpc": `${base}&type=grpc&serviceName=my-service`,
    "vless-httpupgrade": `${base}&type=httpupgrade&path=%2Fup&host=cdn.example.com`,
    "vless-h2": `${base}&type=h2&path=%2Fh2&host=cdn.example.com`,
    "vless-xhttp": `${base}&type=xhttp&path=%2Fx&mode=packet-up`,
    "tuic-options": `tuic://${id}:pw@node.example.com:443?alpn=h3&disable_sni=1&zero_rtt_handshake=1&congestion_control=bbr&udp_relay_mode=quic`,
  };
  let count = 0;
  let failed = false;
  for (const [core, binary] of Object.entries(binaries)) {
    const format = core === "mihomo" ? "clash" : core;
    for (const [name, input] of Object.entries(cases)) {
      const result = convert(input, format, "all");
      if (!result.config) {
        console.log(`SKIP ${core}: ${name} (unsupported)`);
        continue;
      }
      const folder = join(work, `${core}-${name}`);
      await mkdir(folder);
      const path = join(
        folder,
        core === "mihomo" ? "config.yaml" : "config.json",
      );
      await writeFile(path, result.config, "utf8");
      const flags =
        core === "mihomo"
          ? ["-t", "-d", folder, "-f", path]
          : core === "sing-box"
            ? ["check", "-c", path]
            : ["run", "-test", "-config", path];
      const check = spawnSync(binary, flags, {
        encoding: "utf8",
        timeout: 30000,
        windowsHide: true,
      });
      count++;
      if (check.status !== 0) {
        failed = true;
        console.error(
          `FAIL ${core}: ${name}\n${check.stdout}\n${check.stderr}\n${check.error || ""}`,
        );
      } else console.log(`PASS ${core}: ${name}`);
    }
  }
  console.log(
    `Checked ${count} demo configurations. Temporary fixtures: ${work}`,
  );
  if (failed) process.exitCode = 1;
} finally {
  await server.close();
}
