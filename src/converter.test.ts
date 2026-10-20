import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  convert,
  decodeBase64,
  encodeBase64,
  EXAMPLE,
  parseLink,
  toClash,
  toSingBox,
  toXray,
  type Format,
} from "./converter";

const id = "a6e1f0c2-8b34-4d56-9e70-123456789abc";
const vless = `vless://${id}@node.example.com:443?security=tls`;
const reality = `vless://${id}@node.example.com:443?security=reality&pbk=${"a".repeat(43)}&sid=abcdef&fp=chrome&flow=xtls-rprx-vision`;
const vmess = (patch: Record<string, unknown> = {}) =>
  "vmess://" +
  encodeBase64(
    JSON.stringify({
      v: "2",
      ps: "日本 · 测试节点",
      add: "example.com",
      port: "443",
      id,
      net: "ws",
      path: "/proxy",
      tls: "tls",
      ...patch,
    }),
  );

describe("link parsing", () => {
  it("reads all five protocols with Unicode labels", () => {
    const r = convert(EXAMPLE, "clash", "all");
    expect(r.errors).toEqual([]);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes.map((n) => n.protocol)).toEqual([
      "vless",
      "trojan",
      "hysteria2",
      "tuic",
      "vmess",
    ]);
    expect(parseLink(vmess()).name).toBe("日本 · 测试节点");
  });
  it("decodes URL-safe, unpadded and multiline UTF-8 base64", () => {
    const input = `${vless}#${encodeURIComponent("东京 ✓")}\n${vmess()}`;
    const encoded = encodeBase64(input)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    expect(decodeBase64(encoded)).toBe(input);
    expect(
      convert(encoded.match(/.{1,70}/g)!.join("\n"), "sing-box", "all"),
    ).toMatchObject({
      decoded: true,
      errors: [],
      nodes: [{ name: "东京 ✓" }, { name: "日本 · 测试节点" }],
    });
  });
  it("supports IPv6, default TLS port and escaped passwords", () => {
    expect(
      parseLink(`vless://${id}@[2001:db8::1]:8443?security=none`),
    ).toMatchObject({ server: "2001:db8::1", port: 8443 });
    expect(parseLink("trojan://a%40b%3Ac%2Fd@example.com")).toMatchObject({
      password: "a@b:c/d",
      port: 443,
    });
    expect(parseLink("hy2://user:password@example.com:443")).toMatchObject({
      password: "user:password",
      protocol: "hysteria2",
    });
  });
  it("ignores comments and blank lines, preserving original error line numbers", () => {
    const r = convert(`\n# comment\n${vless}\n\nss://invalid`, "clash", "all");
    expect(r.nodes).toHaveLength(1);
    expect(r.errors).toEqual([{ line: 5, message: "protocol" }]);
  });
  it.each([
    ["https://example.com/sub?token=private", "subscriptionUrl"],
    [`vless://bad@example.com:443`, "uuid"],
    [`vless://${id}@example.com:70000`, "port"],
    ["trojan://@example.com:443", "password"],
    ["tuic://v4-token@example.com:443", "tuicVersion"],
    [vless + "&pinSHA256=abcd", "unmapped"],
    [vless + "&unknown=1", "parameter"],
    [vless + "&sni=a&sni=b", "parameterValue"],
    [vless + "&sni=a&peer=b", "parameterValue"],
    [vless + "&insecure=maybe", "parameterValue"],
    [vless + "&path=%ZZ", "encoding"],
    ["hysteria2://pw@example.com?fp=chrome", "quicFingerprint"],
    [vless + "&flow=xtls-rprx-direct", "unmapped"],
    [`vless://${id}@example.com?security=reality`, "reality"],
    [reality + "&allowInsecure=1", "unmapped"],
    [`vless://${id}@example.com?security=none&sni=&alpn=h2`, "unmapped"],
    [`vless://${id}@example.com?security=tls&pbk=&sid=abcdef`, "unmapped"],
  ])("rejects invalid or unmappable input (%s)", (input, code) => {
    expect(() => parseLink(input)).toThrow(code);
  });
  it("rejects invalid base64, invalid VMess and oversized input", () => {
    expect(() => convert("!bad!", "clash", "all")).toThrow("base64");
    expect(() => convert("", "clash", "all")).toThrow("empty");
    expect(() => convert("x".repeat(2_000_001), "clash", "all")).toThrow(
      "tooLarge",
    );
    expect(() => parseLink("vmess://" + encodeBase64("[]"))).toThrow("vmess");
  });
});

describe("target mappings", () => {
  it("preserves TLS, REALITY and flow", () => {
    const n = parseLink(reality);
    expect(toClash(n)).toMatchObject({
      tls: true,
      flow: "xtls-rprx-vision",
      "client-fingerprint": "chrome",
      "reality-opts": { "public-key": "a".repeat(43), "short-id": "abcdef" },
    });
    expect(toSingBox(n)).toMatchObject({
      tls: {
        enabled: true,
        reality: { enabled: true, public_key: "a".repeat(43) },
      },
    });
    expect(toXray(n)).toMatchObject({
      streamSettings: {
        security: "reality",
        realitySettings: { publicKey: "a".repeat(43), fingerprint: "chrome" },
      },
    });
  });
  it("maps WebSocket host, path and early data", () => {
    const n = parseLink(
      vless + "&type=ws&host=cdn.example.com&path=%2Fproxy%3Fed%3D2048",
    );
    expect(toClash(n)).toMatchObject({
      network: "ws",
      "ws-opts": {
        path: "/proxy",
        "max-early-data": 2048,
        headers: { Host: "cdn.example.com" },
      },
    });
    expect(toSingBox(n)).toMatchObject({
      transport: { type: "ws", path: "/proxy", max_early_data: 2048 },
    });
  });
  it("maps gRPC, HTTP upgrade, and XHTTP; rejects unsupported transports", () => {
    const grpc = parseLink(vless + "&type=grpc&serviceName=my-service");
    expect(toClash(grpc)).toMatchObject({
      "grpc-opts": { "grpc-service-name": "my-service" },
    });
    expect(toSingBox(grpc)).toMatchObject({
      transport: { type: "grpc", service_name: "my-service" },
    });
    expect(toXray(grpc)).toMatchObject({
      streamSettings: { grpcSettings: { serviceName: "my-service" } },
    });
    const upgrade = parseLink(
      vless + "&type=httpupgrade&path=%2Fup&host=cdn.example.com",
    );
    expect(toClash(upgrade)).toMatchObject({
      network: "ws",
      "ws-opts": { "v2ray-http-upgrade": true },
    });
    expect(toSingBox(upgrade)).toMatchObject({
      transport: { type: "httpupgrade", host: "cdn.example.com" },
    });
    const xhttp = parseLink(vless + "&type=xhttp&mode=packet-up&path=%2Fx");
    expect(toClash(xhttp)).toMatchObject({
      "xhttp-opts": { path: "/x", mode: "packet-up" },
    });
    expect(toXray(xhttp)).toMatchObject({
      streamSettings: { xhttpSettings: { path: "/x", mode: "packet-up" } },
    });
    expect(() => toSingBox(xhttp)).toThrow("targetTransport");
  });
  it("preserves explicit insecure TLS and Hysteria2 obfuscation and bandwidth", () => {
    const n = parseLink(
      "hy2://user:password@example.com?insecure=1&obfs=salamander&obfs-password=secret&up=100&down=200",
    );
    expect(toClash(n)).toMatchObject({
      password: "user:password",
      "skip-cert-verify": true,
      up: "100 Mbps",
      down: "200 Mbps",
      obfs: "salamander",
      "obfs-password": "secret",
    });
    expect(toSingBox(n)).toMatchObject({
      tls: { insecure: true },
      up_mbps: 100,
      down_mbps: 200,
      obfs: { type: "salamander", password: "secret" },
    });
  });
  it("maps TUIC v5 options", () => {
    const n = parseLink(
      `tuic://${id}:pw@example.com?congestion_control=bbr&udp_relay_mode=quic&disable_sni=1&zero_rtt_handshake=1&alpn=h3`,
    );
    expect(toClash(n)).toMatchObject({
      uuid: id,
      password: "pw",
      "congestion-controller": "bbr",
      "udp-relay-mode": "quic",
      "disable-sni": true,
      "reduce-rtt": true,
      alpn: ["h3"],
    });
    expect(toSingBox(n)).toMatchObject({
      congestion_control: "bbr",
      udp_relay_mode: "quic",
      zero_rtt_handshake: true,
      tls: { disable_sni: true },
    });
  });
  it("reports incompatible nodes without discarding compatible ones", () => {
    const r = convert(EXAMPLE, "xray", "all");
    expect(r.nodes).toHaveLength(3);
    expect(r.errors).toEqual([
      { line: 3, message: "xrayProtocol|HYSTERIA2" },
      { line: 4, message: "xrayProtocol|TUIC" },
    ]);
    expect(
      JSON.parse(r.config).outbounds.map(
        (o: { protocol: string }) => o.protocol,
      ),
    ).toEqual(["vless", "trojan", "vmess", "freedom"]);
  });
  it("does not silently drop legacy VMess alterId", () => {
    const n = parseLink(vmess({ aid: "64" }));
    expect(toClash(n)).toMatchObject({ alterId: 64 });
    expect(() => toSingBox(n)).toThrow("unmapped");
    expect(() => toXray(n)).toThrow("unmapped");
  });
});

describe("complete configuration", () => {
  it.each(["clash", "sing-box", "xray"] as Format[])(
    "generates parseable %s with unique node names and valid references",
    (format) => {
      const r = convert(
        `${vless}#PROXY\n${vless}#PROXY\n${vless}#DIRECT`,
        format,
        "china",
      );
      expect(r.errors).toEqual([]);
      expect(r.nodes.map((n) => n.name)).toEqual([
        "PROXY (2)",
        "PROXY (3)",
        "DIRECT (2)",
      ]);
      const cfg = format === "clash" ? parse(r.config) : JSON.parse(r.config);
      if (format === "clash") {
        expect(cfg["proxy-groups"][0].proxies).toEqual(
          r.nodes.map((n) => n.name),
        );
        expect(cfg.rules).toContain("GEOIP,CN,DIRECT");
      }
      if (format === "sing-box") {
        expect(cfg.outbounds[0].outbounds).toEqual(r.nodes.map((n) => n.name));
        expect(cfg.route.rule_set).toHaveLength(2);
        expect(cfg.route.default_domain_resolver).toBe("dns-direct");
      }
      if (format === "xray")
        expect(cfg.routing.rules.at(-1).outboundTag).toBe(r.nodes[0].name);
    },
  );
  it("produces no configuration when every node is invalid", () => {
    const r = convert("ss://not-supported", "clash", "all");
    expect(r.config).toBe("");
    expect(r.nodes).toEqual([]);
    expect(r.errors).toHaveLength(1);
  });
  it("preserves strings that look like YAML syntax without injection", () => {
    const r = convert(
      `${vless}#${encodeURIComponent("a: [b]\nproxies: bad")}`,
      "clash",
      "all",
    );
    expect(parse(r.config).proxies[0].name).toBe("a: [b]\nproxies: bad");
    expect(parse(r.config).proxies).toHaveLength(1);
  });
});
