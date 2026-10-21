export const copy = {
  zh: {
    all: "全部代理",
    china: "中国大陆直连",
    noNodes: "没有可转换的节点，请检查错误信息。",
    copyError: "无法访问剪贴板，请选中结果手动复制。",
    importText:
      "Clash Verge Rev 可新建本地配置并导入 YAML；sing-box 和 Xray 加载对应的 JSON 文件。默认代理端口为 7890，Xray 的 HTTP 端口为 7891。",
    chinaInfo:
      "中国大陆直连需要客户端地理数据：Mihomo、Xray 使用本地地理数据文件，sing-box 在运行配置时下载 geoip-cn、geosite-cn 规则集。",
    theme: "切换深浅色",
    language: "Switch to English",
  },
  en: {
    all: "Proxy all traffic",
    china: "Direct for mainland China",
    noNodes: "No compatible nodes. Check the errors below.",
    copyError: "Clipboard unavailable. Select and copy the result manually.",
    importText:
      "Import YAML as a local profile in Clash Verge Rev. Load the corresponding JSON with sing-box or Xray. The default proxy port is 7890; Xray also provides HTTP on port 7891.",
    chinaInfo:
      "The China routing preset needs geographic data. Mihomo and Xray use local data files; sing-box downloads geoip-cn and geosite-cn rule sets when running the configuration.",
    theme: "Toggle light or dark mode",
    language: "切换到中文",
  },
};
export type Language = keyof typeof copy;

const messages: Record<string, [string, string]> = {
  empty: [
    "Paste at least one node link or a base64 subscription.",
    "请先粘贴节点链接或 Base64 订阅内容。",
  ],
  tooLarge: ["Input exceeds the 2 MB limit.", "输入内容超出 2 MB 限制。"],
  base64: [
    "Invalid base64 or UTF-8 subscription content.",
    "Base64 编码或 UTF-8 订阅内容无效。",
  ],
  encoding: [
    "Invalid percent encoding in the link.",
    "链接中的百分号编码无效。",
  ],
  protocol: [
    "Unsupported protocol. Use VLESS, VMess, Trojan, Hysteria2 or TUIC.",
    "不支持的协议，请使用 VLESS、VMess、Trojan、Hysteria2 或 TUIC。",
  ],
  subscriptionUrl: [
    "Paste the subscription contents, not its HTTP URL.",
    "请粘贴订阅返回的内容，而不是 HTTP 订阅地址。",
  ],
  vmess: ["Invalid VMess base64 JSON.", "VMess 的 Base64 JSON 内容无效。"],
  url: ["Malformed node URL.", "节点 URL 格式无效。"],
  urlPath: [
    "Put the transport path in the path query parameter.",
    "请在查询参数 path 中设置传输路径。",
  ],
  port: [
    "Port must be an integer between 1 and 65535.",
    "端口必须为 1 至 65535 的整数。",
  ],
  server: ["Missing or invalid server address.", "服务器地址缺失或无效。"],
  uuid: ["A valid UUID is required.", "需要有效的 UUID。"],
  tuicVersion: [
    "Only TUIC v5 UUID/password links are supported.",
    "仅支持使用 UUID 和密码的 TUIC v5 链接。",
  ],
  password: ["The node password is missing.", "节点密码缺失。"],
  credentials: ["Invalid node credentials.", "节点凭据格式无效。"],
  parameter: ["Unsupported parameter", "不支持的参数"],
  parameterValue: ["Invalid or conflicting parameter", "参数值无效或存在冲突"],
  unmapped: [
    "Cannot preserve this parameter in the target",
    "无法在目标格式中准确保留此参数",
  ],
  security: ["Unsupported security mode", "不支持的安全模式"],
  transport: ["Unsupported transport", "不支持的传输方式"],
  targetTransport: [
    "Transport unavailable in this target",
    "此目标不支持该传输方式",
  ],
  quicFingerprint: [
    "QUIC protocols cannot use uTLS fingerprints.",
    "QUIC 协议无法使用 uTLS 指纹。",
  ],
  reality: [
    "REALITY requires a public key (pbk).",
    "REALITY 需要公钥参数 pbk。",
  ],
  xrayProtocol: ["Xray does not support this protocol", "Xray 不支持此协议"],
  invalid: ["Invalid node link.", "无效的节点链接。"],
};
export function issueText(message: string, lang: Language): string {
  const [code, ...detail] = message.split("|");
  return (
    (messages[code]?.[lang === "en" ? 0 : 1] ||
      messages.invalid[lang === "en" ? 0 : 1]) +
    (detail.length ? `: ${detail.join("|")}` : "")
  );
}
