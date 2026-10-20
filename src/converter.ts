import { stringify } from "yaml";

export type Format = "clash" | "sing-box" | "xray";
export type Routing = "all" | "china";
export type Protocol = "vless" | "vmess" | "trojan" | "hysteria2" | "tuic";
type Config = Record<string, unknown>;
export interface Node {
  name: string;
  protocol: Protocol;
  server: string;
  port: number;
  id: string;
  password: string;
  security: string;
  network: string;
  params: URLSearchParams;
  cipher: string;
  alterId: number;
}
export interface Issue {
  line: number;
  message: string;
}
export interface Result {
  config: string;
  nodes: Node[];
  errors: Issue[];
  decoded: boolean;
}

export class ConversionError extends Error {
  constructor(
    public code: string,
    public detail = "",
  ) {
    super(code);
  }
}
const fail = (code: string, detail = ""): never => {
  throw new ConversionError(code, detail);
};
const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return fail("encoding");
  }
};
export function decodeBase64(input: string): string {
  try {
    const normalized = input
      .replace(/\s/g, "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    if (
      !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) ||
      normalized.length % 4 === 1
    )
      return fail("base64");
    const raw = atob(normalized);
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(raw, (c) => c.charCodeAt(0)),
    );
  } catch {
    return fail("base64");
  }
}
export function encodeBase64(input: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(input), (c) =>
      String.fromCharCode(c),
    ).join(""),
  );
}
function port(value: string | number): number {
  if (!/^\d+$/.test(String(value))) return fail("port");
  const n = Number(value);
  if (n < 1 || n > 65535) return fail("port");
  return n;
}
function flag(p: URLSearchParams, ...keys: string[]) {
  const value = get(p, ...keys);
  if (!value) return false;
  if (!["1", "true", "0", "false"].includes(value.toLowerCase()))
    return fail("parameterValue", keys[0]);
  return value === "1" || value.toLowerCase() === "true";
}
const get = (p: URLSearchParams, ...keys: string[]) =>
  keys.map((k) => p.get(k)).find((v) => v !== null && v !== "") ?? "";
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function parseLink(line: string): Node {
  decode(line); // URL and URLSearchParams otherwise replace malformed escapes silently.
  const scheme = line.match(/^([\w-]+):\/\//)?.[1].toLowerCase();
  if (scheme === "http" || scheme === "https") return fail("subscriptionUrl");
  if (
    !scheme ||
    !["vless", "vmess", "trojan", "hysteria2", "hy2", "tuic"].includes(scheme)
  )
    return fail("protocol");
  let node: Node;
  if (scheme === "vmess") {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(decodeBase64(line.slice(8)));
    } catch {
      return fail("vmess");
    }
    if (!data || typeof data !== "object" || Array.isArray(data))
      return fail("vmess");
    const p = new URLSearchParams();
    const keys: Record<string, string> = {
      host: "host",
      path: "path",
      sni: "sni",
      alpn: "alpn",
      fp: "fp",
      allowInsecure: "allowInsecure",
      serviceName: "serviceName",
      type: "headerType",
    };
    for (const [key, value] of Object.entries(data)) {
      if (
        ![
          "v",
          "ps",
          "add",
          "port",
          "id",
          "aid",
          "scy",
          "net",
          "tls",
          ...Object.keys(keys),
        ].includes(key) &&
        value !== "" &&
        value !== undefined
      )
        fail("parameter", key);
      if (keys[key] && value !== undefined && value !== "")
        p.set(keys[key], String(value));
    }
    if (data.net === "grpc" && !p.has("serviceName") && data.path) {
      p.set("serviceName", String(data.path));
      p.delete("path");
    }
    node = {
      name: String(data.ps || ""),
      protocol: "vmess",
      server: String(data.add || ""),
      port: port(String(data.port)),
      id: String(data.id || ""),
      password: "",
      security: String(data.tls || "none"),
      network: String(data.net || "tcp"),
      params: p,
      cipher: String(data.scy || "auto"),
      alterId: Number(data.aid || 0),
    };
    if (!Number.isInteger(node.alterId) || node.alterId < 0)
      fail("parameterValue", "aid");
  } else {
    const authority = line.slice(scheme.length + 3).split(/[/?#]/)[0];
    const hostPort = authority.slice(authority.lastIndexOf("@") + 1);
    const explicitPort = hostPort.startsWith("[")
      ? /^\[[^\]]+\]:(.*)$/.exec(hostPort)?.[1]
      : /:([^:]*)$/.exec(hostPort)?.[1];
    if (explicitPort !== undefined) port(explicitPort);
    let url: URL;
    try {
      url = new URL(line);
    } catch {
      return fail("url");
    }
    const protocol = (scheme === "hy2" ? "hysteria2" : scheme) as Protocol;
    const p = url.searchParams;
    if (url.pathname && url.pathname !== "/") fail("urlPath");
    node = {
      name: decode(url.hash.slice(1)),
      protocol,
      server: url.hostname.replace(/^\[|\]$/g, ""),
      port: port(url.port || "443"),
      id: decode(url.username),
      password: decode(url.password),
      security: get(p, "security") || (protocol === "vless" ? "none" : "tls"),
      network: get(p, "type", "network") || "tcp",
      params: p,
      cipher: "",
      alterId: 0,
    };
    if (protocol === "trojan" || protocol === "hysteria2") {
      node.password = node.id + (url.password ? `:${node.password}` : "");
      node.id = "";
    } else if (protocol === "vless" && url.password) fail("credentials");
  }
  if (!node.server || /[\s/@?#]/.test(node.server)) fail("server");
  if (["vless", "vmess", "tuic"].includes(node.protocol) && !uuid.test(node.id))
    fail(node.protocol === "tuic" ? "tuicVersion" : "uuid");
  if (["trojan", "hysteria2", "tuic"].includes(node.protocol) && !node.password)
    fail("password");
  if (!["none", "tls", "reality"].includes(node.security))
    fail("security", node.security);
  if (
    ["trojan", "hysteria2", "tuic"].includes(node.protocol) &&
    node.security !== "tls"
  )
    fail("security", node.security);
  if (node.protocol === "vmess" && node.security === "reality")
    fail("security", "reality");
  if (
    !["tcp", "ws", "grpc", "http", "h2", "httpupgrade", "xhttp"].includes(
      node.network,
    )
  )
    fail("transport", node.network);
  if (
    node.protocol === "vmess" &&
    !["auto", "aes-128-gcm", "chacha20-poly1305", "none", "zero"].includes(
      node.cipher,
    )
  )
    fail("parameterValue", "scy");
  validateParams(node);
  node.name ||= `${node.protocol.toUpperCase()} · ${node.server}:${node.port}`;
  return node;
}

function validateParams(n: Node) {
  const p = n.params;
  const common = [
    "security",
    "sni",
    "peer",
    "alpn",
    "allowInsecure",
    "insecure",
    "skip-cert-verify",
    "fp",
    "fingerprint",
  ];
  const transport = [
    "type",
    "network",
    "host",
    "path",
    "serviceName",
    "authority",
    "mode",
    "headerType",
  ];
  const specific: Record<Protocol, string[]> = {
    vless: [...transport, "encryption", "flow", "pbk", "sid", "spx"],
    vmess: transport,
    trojan: transport,
    hysteria2: ["obfs", "obfs-password", "up", "down"],
    tuic: [
      "congestion_control",
      "congestion-controller",
      "udp_relay_mode",
      "udp-relay-mode",
      "disable_sni",
      "disable-sni",
      "zero_rtt_handshake",
      "reduce-rtt",
    ],
  };
  for (const [key, value] of p) {
    if (!value) continue;
    if (/pin|cert|token/i.test(key)) fail("unmapped", key);
    if (![...common, ...specific[n.protocol]].includes(key))
      fail("parameter", key);
    if (p.getAll(key).length > 1) fail("parameterValue", key);
  }
  for (const aliases of [
    ["sni", "peer"],
    ["fp", "fingerprint"],
    ["type", "network"],
    ["allowInsecure", "insecure", "skip-cert-verify"],
    ["congestion_control", "congestion-controller"],
    ["udp_relay_mode", "udp-relay-mode"],
    ["disable_sni", "disable-sni"],
    ["zero_rtt_handshake", "reduce-rtt"],
  ]) {
    const values = aliases.filter((k) => p.has(k)).map((k) => p.get(k));
    if (new Set(values).size > 1) fail("parameterValue", aliases.join("/"));
  }
  flag(p, "allowInsecure", "insecure", "skip-cert-verify");
  flag(p, "disable_sni", "disable-sni");
  flag(p, "zero_rtt_handshake", "reduce-rtt");
  const fp = get(p, "fp", "fingerprint");
  if (["hysteria2", "tuic"].includes(n.protocol) && fp) fail("quicFingerprint");
  if (
    fp &&
    ![
      "chrome",
      "firefox",
      "safari",
      "ios",
      "android",
      "edge",
      "360",
      "qq",
      "random",
      "randomized",
    ].includes(fp)
  )
    fail("parameterValue", "fp");
  if (get(p, "encryption") && get(p, "encryption") !== "none")
    fail("unmapped", "encryption");
  if (get(p, "headerType") && get(p, "headerType") !== "none")
    fail("unmapped", "headerType");
  if (
    get(p, "flow") &&
    (get(p, "flow") !== "xtls-rprx-vision" ||
      n.security === "none" ||
      n.network !== "tcp")
  )
    fail("unmapped", "flow");
  if (n.security === "reality") {
    if (!get(p, "pbk")) fail("reality");
    if (!/^[A-Za-z0-9_-]{43}$/.test(get(p, "pbk")))
      fail("parameterValue", "pbk");
    if (!/^(?:[\da-f]{2}){0,8}$/i.test(get(p, "sid")))
      fail("parameterValue", "sid");
    if (flag(p, "allowInsecure", "insecure", "skip-cert-verify"))
      fail("unmapped", "allowInsecure + REALITY");
  } else if (get(p, "pbk", "sid", "spx"))
    fail("unmapped", "REALITY parameters without REALITY");
  if (
    n.security === "none" &&
    (get(p, "sni", "peer", "alpn", "fp", "fingerprint") ||
      flag(p, "allowInsecure", "insecure", "skip-cert-verify"))
  )
    fail("unmapped", "TLS parameters without TLS");
  if (get(p, "serviceName", "authority") && n.network !== "grpc")
    fail("unmapped", "gRPC parameters");
  if (
    get(p, "host", "path") &&
    !["ws", "http", "h2", "httpupgrade", "xhttp"].includes(n.network)
  )
    fail("unmapped", "host/path");
  if (get(p, "mode") && n.network !== "xhttp") fail("unmapped", "mode");
  if (
    n.network === "xhttp" &&
    get(p, "mode") &&
    !["auto", "packet-up", "stream-up", "stream-one"].includes(get(p, "mode"))
  )
    fail("parameterValue", "mode");
  const obfs = get(p, "obfs");
  if (obfs && obfs !== "salamander") fail("unmapped", "obfs");
  if ((obfs && !get(p, "obfs-password")) || (!obfs && get(p, "obfs-password")))
    fail("parameterValue", "obfs-password");
  for (const key of ["up", "down"])
    if (
      p.has(key) &&
      (!/^\d+(?:\.\d+)?$/.test(p.get(key)!) || Number(p.get(key)) <= 0)
    )
      fail("parameterValue", key);
  const cc = get(p, "congestion_control", "congestion-controller");
  if (cc && !["cubic", "new_reno", "bbr"].includes(cc))
    fail("parameterValue", "congestion_control");
  const relay = get(p, "udp_relay_mode", "udp-relay-mode");
  if (relay && !["native", "quic"].includes(relay))
    fail("parameterValue", "udp_relay_mode");
}

function tls(n: Node): Config | undefined {
  if (n.security === "none") return;
  const p = n.params;
  const t: Config = {
    enabled: true,
    server_name: get(p, "sni", "peer") || n.server,
    insecure: flag(p, "allowInsecure", "insecure", "skip-cert-verify"),
  };
  if (get(p, "alpn")) t.alpn = get(p, "alpn").split(",");
  if (get(p, "fp", "fingerprint") || n.security === "reality")
    t.utls = {
      enabled: true,
      fingerprint: get(p, "fp", "fingerprint") || "chrome",
    };
  if (n.security === "reality")
    t.reality = {
      enabled: true,
      public_key: get(p, "pbk"),
      short_id: get(p, "sid"),
    };
  return t;
}
function singTransport(n: Node): Config | undefined {
  const p = n.params;
  if (n.network === "tcp") return;
  if (n.network === "xhttp") return fail("targetTransport", "sing-box / XHTTP");
  const t: Config = { type: n.network === "h2" ? "http" : n.network };
  if (n.network === "grpc") {
    if (get(p, "authority")) fail("unmapped", "sing-box / gRPC authority");
    t.service_name = get(p, "serviceName");
  } else {
    t.path = get(p, "path") || "/";
    if (get(p, "host")) {
      if (["h2", "http"].includes(n.network))
        t.host = get(p, "host").split(",");
      else if (n.network === "httpupgrade") t.host = get(p, "host");
      else t.headers = { Host: get(p, "host") };
    }
    if (n.network === "ws") {
      const path = new URL(String(t.path), "https://placeholder.invalid");
      const ed = path.searchParams.get("ed");
      if (ed) {
        if (!/^\d+$/.test(ed)) fail("parameterValue", "ed");
        t.max_early_data = Number(ed);
        t.early_data_header_name = "Sec-WebSocket-Protocol";
        path.searchParams.delete("ed");
        t.path = path.pathname + path.search;
      }
    }
  }
  return t;
}
export function toSingBox(n: Node): Config {
  const p = n.params;
  if (get(p, "spx")) fail("unmapped", "sing-box / spx");
  if (n.alterId) fail("unmapped", "sing-box / legacy VMess alterId");
  const out: Config = {
    type: n.protocol,
    tag: n.name,
    server: n.server,
    server_port: n.port,
  };
  if (n.id) out.uuid = n.id;
  if (n.password) out.password = n.password;
  if (n.protocol === "vmess") out.security = n.cipher;
  if (get(p, "flow")) out.flow = get(p, "flow");
  const t = tls(n);
  if (t) out.tls = t;
  const transport = singTransport(n);
  if (transport) out.transport = transport;
  if (n.protocol === "hysteria2") {
    if (get(p, "obfs"))
      out.obfs = { type: get(p, "obfs"), password: get(p, "obfs-password") };
    if (get(p, "up")) out.up_mbps = Number(get(p, "up"));
    if (get(p, "down")) out.down_mbps = Number(get(p, "down"));
  }
  if (n.protocol === "tuic") {
    if (flag(p, "disable_sni", "disable-sni"))
      (out.tls as Config).disable_sni = true;
    out.congestion_control =
      get(p, "congestion_control", "congestion-controller") || "cubic";
    out.udp_relay_mode = get(p, "udp_relay_mode", "udp-relay-mode") || "native";
    out.zero_rtt_handshake = flag(p, "zero_rtt_handshake", "reduce-rtt");
  }
  return out;
}
export function toClash(n: Node): Config {
  const p = n.params;
  if (get(p, "spx")) fail("unmapped", "Mihomo / spx");
  const out: Config = {
    name: n.name,
    type: n.protocol,
    server: n.server,
    port: n.port,
    udp: true,
  };
  if (n.id) out.uuid = n.id;
  if (n.password) out.password = n.password;
  if (n.protocol === "vmess") {
    out.alterId = n.alterId;
    out.cipher = n.cipher;
  }
  if (get(p, "flow")) out.flow = get(p, "flow");
  if (n.security !== "none") {
    if (n.protocol === "vless" || n.protocol === "vmess") out.tls = true;
    out[n.protocol === "vmess" ? "servername" : "sni"] =
      get(p, "sni", "peer") || n.server;
    out["skip-cert-verify"] = flag(
      p,
      "allowInsecure",
      "insecure",
      "skip-cert-verify",
    );
    if (get(p, "alpn")) out.alpn = get(p, "alpn").split(",");
    if (get(p, "fp", "fingerprint"))
      out["client-fingerprint"] = get(p, "fp", "fingerprint");
    if (n.security === "reality") {
      out["client-fingerprint"] ||= "chrome";
      out["reality-opts"] = {
        "public-key": get(p, "pbk"),
        "short-id": get(p, "sid"),
      };
    }
  }
  if (n.network !== "tcp") {
    out.network = ["h2", "http"].includes(n.network) ? "h2" : n.network;
    if (n.network === "grpc") {
      if (get(p, "authority")) fail("unmapped", "Mihomo / gRPC authority");
      out["grpc-opts"] = { "grpc-service-name": get(p, "serviceName") };
    } else if (["h2", "http"].includes(n.network)) {
      out["h2-opts"] = {
        path: get(p, "path") || "/",
        ...(get(p, "host") ? { host: get(p, "host").split(",") } : {}),
      };
    } else if (n.network === "httpupgrade") {
      out.network = "ws";
      out["ws-opts"] = {
        path: get(p, "path") || "/",
        "v2ray-http-upgrade": true,
        ...(get(p, "host") ? { headers: { Host: get(p, "host") } } : {}),
      };
    } else if (n.network === "xhttp") {
      out["xhttp-opts"] = {
        path: get(p, "path") || "/",
        mode: get(p, "mode") || "auto",
        ...(get(p, "host") ? { host: get(p, "host") } : {}),
      };
    } else {
      const opts: Config = { path: get(p, "path") || "/" };
      if (get(p, "host")) opts.headers = { Host: get(p, "host") };
      const path = new URL(String(opts.path), "https://placeholder.invalid");
      if (path.searchParams.has("ed")) {
        const ed = path.searchParams.get("ed")!;
        if (!/^\d+$/.test(ed)) fail("parameterValue", "ed");
        opts["max-early-data"] = Number(ed);
        opts["early-data-header-name"] = "Sec-WebSocket-Protocol";
        path.searchParams.delete("ed");
        opts.path = path.pathname + path.search;
      }
      out["ws-opts"] = opts;
    }
  }
  if (n.protocol === "hysteria2") {
    if (get(p, "obfs")) {
      out.obfs = get(p, "obfs");
      out["obfs-password"] = get(p, "obfs-password");
    }
    if (get(p, "up")) out.up = `${get(p, "up")} Mbps`;
    if (get(p, "down")) out.down = `${get(p, "down")} Mbps`;
  }
  if (n.protocol === "tuic") {
    out["congestion-controller"] =
      get(p, "congestion_control", "congestion-controller") || "cubic";
    out["udp-relay-mode"] =
      get(p, "udp_relay_mode", "udp-relay-mode") || "native";
    out["disable-sni"] = flag(p, "disable_sni", "disable-sni");
    out["reduce-rtt"] = flag(p, "zero_rtt_handshake", "reduce-rtt");
  }
  return out;
}
export function toXray(n: Node): Config {
  if (["hysteria2", "tuic"].includes(n.protocol))
    return fail("xrayProtocol", n.protocol.toUpperCase());
  if (n.alterId) fail("unmapped", "Xray / legacy VMess alterId");
  const p = n.params;
  const user: Config =
    n.protocol === "trojan"
      ? { password: n.password }
      : {
          id: n.id,
          ...(n.protocol === "vless"
            ? { encryption: "none" }
            : { security: n.cipher }),
        };
  if (get(p, "flow")) user.flow = get(p, "flow");
  const settings =
    n.protocol === "trojan"
      ? { servers: [{ address: n.server, port: n.port, ...user }] }
      : { vnext: [{ address: n.server, port: n.port, users: [user] }] };
  const stream: Config = {
    network: ["http", "h2"].includes(n.network) ? "h2" : n.network,
    security: n.security,
  };
  if (n.security !== "none") {
    const t: Config = { serverName: get(p, "sni", "peer") || n.server };
    if (get(p, "fp", "fingerprint"))
      t.fingerprint = get(p, "fp", "fingerprint");
    if (n.security === "reality") {
      t.fingerprint ||= "chrome";
      t.publicKey = get(p, "pbk");
      t.shortId = get(p, "sid");
      if (get(p, "spx")) t.spiderX = get(p, "spx");
      if (get(p, "alpn")) fail("unmapped", "Xray REALITY / alpn");
    } else {
      t.allowInsecure = flag(
        p,
        "allowInsecure",
        "insecure",
        "skip-cert-verify",
      );
      if (get(p, "alpn")) t.alpn = get(p, "alpn").split(",");
    }
    stream[n.security === "reality" ? "realitySettings" : "tlsSettings"] = t;
  }
  if (n.network === "ws")
    stream.wsSettings = {
      path: get(p, "path") || "/",
      ...(get(p, "host") ? { headers: { Host: get(p, "host") } } : {}),
    };
  if (n.network === "grpc")
    stream.grpcSettings = {
      serviceName: get(p, "serviceName"),
      ...(get(p, "authority") ? { authority: get(p, "authority") } : {}),
    };
  if (["h2", "http"].includes(n.network))
    fail("targetTransport", "Xray / legacy HTTP/2");
  if (n.network === "httpupgrade")
    stream.httpupgradeSettings = {
      path: get(p, "path") || "/",
      host: get(p, "host"),
    };
  if (n.network === "xhttp")
    stream.xhttpSettings = {
      path: get(p, "path") || "/",
      host: get(p, "host"),
      mode: get(p, "mode") || "auto",
    };
  return {
    tag: n.name,
    protocol: n.protocol,
    settings,
    streamSettings: stream,
  };
}

function generate(
  nodes: Node[],
  outbounds: Config[],
  format: Format,
  routing: Routing,
): string {
  const names = nodes.map((n) => n.name);
  if (format === "clash")
    return (
      "# Generated locally by Proxy Converter\n# Requires Mihomo (Clash.Meta)\n" +
      stringify(
        {
          "mixed-port": 7890,
          "allow-lan": false,
          mode: "rule",
          "log-level": "info",
          ipv6: false,
          proxies: outbounds,
          "proxy-groups": [{ name: "PROXY", type: "select", proxies: names }],
          rules: [
            ...(routing === "china"
              ? ["GEOSITE,cn,DIRECT", "GEOIP,CN,DIRECT"]
              : []),
            "MATCH,PROXY",
          ],
        },
        { lineWidth: 0 },
      )
    );
  if (format === "sing-box")
    return JSON.stringify(
      {
        log: { level: "info" },
        dns: {
          servers: [
            {
              type: "udp",
              tag: "dns-direct",
              server: "223.5.5.5",
              detour: "direct",
            },
          ],
        },
        inbounds: [
          {
            type: "mixed",
            tag: "mixed-in",
            listen: "127.0.0.1",
            listen_port: 7890,
          },
        ],
        outbounds: [
          {
            type: "selector",
            tag: "PROXY",
            outbounds: names,
            default: names[0],
          },
          ...outbounds,
          { type: "direct", tag: "direct" },
        ],
        route: {
          default_domain_resolver: "dns-direct",
          ...(routing === "china"
            ? {
                rules: [
                  { ip_is_private: true, action: "route", outbound: "direct" },
                  {
                    rule_set: ["geoip-cn", "geosite-cn"],
                    action: "route",
                    outbound: "direct",
                  },
                ],
                rule_set: ["geoip", "geosite"].map((kind) => ({
                  type: "remote",
                  tag: `${kind}-cn`,
                  format: "binary",
                  url: `https://raw.githubusercontent.com/SagerNet/sing-${kind}/rule-set/${kind}-cn.srs`,
                  download_detour: "PROXY",
                })),
              }
            : {}),
          final: "PROXY",
        },
      },
      null,
      2,
    );
  return JSON.stringify(
    {
      log: { loglevel: "warning" },
      inbounds: [
        {
          tag: "socks-in",
          listen: "127.0.0.1",
          port: 7890,
          protocol: "socks",
          settings: { auth: "noauth", udp: true },
        },
        {
          tag: "http-in",
          listen: "127.0.0.1",
          port: 7891,
          protocol: "http",
          settings: {},
        },
      ],
      outbounds: [
        ...outbounds,
        { tag: "DIRECT", protocol: "freedom", settings: {} },
      ],
      routing: {
        domainStrategy: "IPIfNonMatch",
        rules: [
          ...(routing === "china"
            ? [
                {
                  type: "field",
                  domain: ["geosite:cn"],
                  outboundTag: "DIRECT",
                },
                {
                  type: "field",
                  ip: ["geoip:cn", "geoip:private"],
                  outboundTag: "DIRECT",
                },
              ]
            : []),
          { type: "field", network: "tcp,udp", outboundTag: names[0] },
        ],
      },
    },
    null,
    2,
  );
}

export function convert(
  input: string,
  format: Format,
  routing: Routing,
): Result {
  if (input.length > 2_000_000) fail("tooLarge");
  let body = input.replace(/^\uFEFF/, "");
  if (!body.trim()) fail("empty");
  let decoded = false;
  if (!body.includes("://")) {
    body = decodeBase64(body);
    decoded = true;
  }
  const nodes: Node[] = [],
    outbounds: Config[] = [],
    errors: Issue[] = [];
  const used = new Set([
    "PROXY",
    "DIRECT",
    "direct",
    "mixed-in",
    "socks-in",
    "http-in",
    "dns-direct",
  ]);
  body.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    try {
      const n = parseLink(line.trim());
      const base = n.name;
      let count = 2;
      while (used.has(n.name)) n.name = `${base} (${count++})`;
      const outbound =
        format === "clash"
          ? toClash(n)
          : format === "sing-box"
            ? toSingBox(n)
            : toXray(n);
      used.add(n.name);
      nodes.push(n);
      outbounds.push(outbound);
    } catch (error) {
      errors.push({
        line: index + 1,
        message:
          error instanceof ConversionError
            ? `${error.code}${error.detail ? `|${error.detail}` : ""}`
            : "invalid",
      });
    }
  });
  return {
    config: nodes.length ? generate(nodes, outbounds, format, routing) : "",
    nodes,
    errors,
    decoded,
  };
}

export const EXAMPLE = [
  "vless://a6e1f0c2-8b34-4d56-9e70-123456789abc@vless.example.com:443?security=tls&type=ws&host=cdn.example.com&path=%2Fproxy&sni=cdn.example.com#VLESS%20%C2%B7%20Tokyo",
  "trojan://demo-password@trojan.example.com:443?sni=trojan.example.com#Trojan%20%C2%B7%20Singapore",
  "hysteria2://demo-password@hy2.example.com:443?sni=hy2.example.com&obfs=salamander&obfs-password=demo-obfs#Hysteria2%20%C2%B7%20Frankfurt",
  "tuic://b7f2a1d3-9c45-4e67-af81-23456789abcd:demo-password@tuic.example.com:443?congestion_control=bbr&alpn=h3#TUIC%20%C2%B7%20Los%20Angeles",
  `vmess://${encodeBase64(JSON.stringify({ v: "2", ps: "VMess · Amsterdam", add: "vmess.example.com", port: "443", id: "c8a3b2e4-ad56-4f78-b092-3456789abcde", aid: "0", scy: "auto", net: "ws", type: "none", host: "vmess.example.com", path: "/proxy", tls: "tls", sni: "vmess.example.com" }))}`,
].join("\n");
