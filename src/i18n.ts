export const copy = {
  en: {
    brand: "Local tools",
    converter: "Converter",
    guide: "How it works",
    local: "Runs locally",
    eyebrow: "LOCAL CONFIGURATION TOOL",
    title: "Proxy config converter",
    intro:
      "Paste VLESS, VMess, Trojan, Hysteria2 or TUIC links — or the base64 body of a subscription — and convert them into a Clash, sing-box or Xray config.",
    privacy: "Your links stay on this device",
    privacyText:
      "Conversion happens entirely in your browser. Links are not uploaded, saved, or placed in the page URL.",
    input: "Node links or subscription",
    inputHelp:
      "One link per line. Protocols are detected automatically; base64 subscriptions are decoded for you.",
    example: "Try an example",
    format: "Output format",
    routing: "Routing preset",
    clashHint:
      "For Mihomo (Clash.Meta), Clash Verge Rev and ClashX Meta. Original Clash is not supported.",
    singHint:
      "Generates a complete sing-box 1.12+ JSON configuration with a node selector.",
    xrayHint:
      "VLESS, VMess and Trojan only. Uses the first valid node by default; SOCKS :7890 / HTTP :7891.",
    all: "Proxy all traffic",
    allHelp: "Use the selected node for every unmatched request.",
    china: "Direct for mainland China",
    chinaHelp: "Route Chinese domains and IPs directly using client geo data.",
    convert: "Convert config",
    clear: "Clear",
    result: "Conversion result",
    copy: "Copy config",
    copied: "Copied!",
    download: "Download",
    emptyTitle: "Your config will appear here",
    emptyHelp: "Add your links above, choose an output format, and convert.",
    generated: "Generated locally",
    nodes: "nodes converted",
    skipped: "lines skipped",
    decoded: "Base64 decoded",
    errors: "Some links need your attention",
    line: "Line",
    noNodes: "No compatible nodes found. Check the errors below.",
    copyError:
      "Clipboard unavailable. Select and copy the configuration manually.",
    why: "Why some links are rejected",
    whyText:
      "Parameters that cannot be mapped faithfully are reported, rather than silently dropped. This includes certificate pinning, TUIC v4 tokens and uTLS fingerprints on QUIC protocols. Xray does not support Hysteria2 or TUIC.",
    import: "How to use your config",
    importText:
      "For Clash Verge Rev, open Profiles → New → Local, then import the downloaded YAML. For sing-box or Xray, load the JSON in the corresponding client. The default local proxy port is 7890.",
    faq: "A few things to know",
    faqs: [
      [
        "Can I paste a subscription URL?",
        "Paste the contents returned by the subscription, not its URL. Open it yourself and copy the base64 body, or paste individual node links. This local tool does not fetch remote subscriptions.",
      ],
      [
        "Will my configuration update automatically?",
        "This creates a one-time configuration file. Convert the subscription contents again when your nodes change.",
      ],
      [
        "Does a successful conversion mean my server works?",
        "Conversion validates structure and supported parameters. It does not connect to a server or test availability. The example nodes use reserved example.com domains and are for demonstration only.",
      ],
      [
        "What does the China routing preset need?",
        "Mihomo and Xray need their geo data files. sing-box downloads geoip-cn and geosite-cn rule sets when the generated config runs. Conversion itself makes no network requests.",
      ],
    ],
    footer: "A small tool. Everything stays local.",
    reference: "Inspired by Shipengtao",
    theme: "Toggle color theme",
    language: "Switch to Chinese",
  },
  zh: {
    brand: "本地工具",
    converter: "配置转换",
    guide: "使用说明",
    local: "本地运行",
    eyebrow: "LOCAL CONFIGURATION TOOL",
    title: "代理配置转换器",
    intro:
      "粘贴 VLESS、VMess、Trojan、Hysteria2 或 TUIC 链接，也可以直接粘贴订阅的 Base64 内容，轻松转换为 Clash、sing-box 或 Xray 配置。",
    privacy: "你的节点，只留在你的设备上",
    privacyText:
      "所有转换均在浏览器内完成。节点链接不会被上传、保存，也不会出现在页面 URL 中。",
    input: "节点链接或订阅内容",
    inputHelp: "每行一个链接，自动识别协议，也支持自动解码 Base64 订阅。",
    example: "试用示例",
    format: "输出格式",
    routing: "路由预设",
    clashHint:
      "适用于 Mihomo (Clash.Meta)、Clash Verge Rev 和 ClashX Meta，不支持原版 Clash。",
    singHint: "生成完整的 sing-box 1.12+ JSON 配置，包含节点选择器。",
    xrayHint:
      "仅支持 VLESS、VMess、Trojan，默认使用首个有效节点；SOCKS :7890 / HTTP :7891。",
    all: "代理所有流量",
    allHelp: "未匹配到其他规则的请求均使用选中的节点。",
    china: "中国大陆直连",
    chinaHelp: "通过客户端的地理数据，将中国大陆域名与 IP 设为直连。",
    convert: "转换配置",
    clear: "清空",
    result: "转换结果",
    copy: "复制配置",
    copied: "已复制！",
    download: "下载配置",
    emptyTitle: "转换后的配置会显示在这里",
    emptyHelp: "粘贴节点链接，选择输出格式，然后开始转换。",
    generated: "在本地生成",
    nodes: "个节点已转换",
    skipped: "行已跳过",
    decoded: "已解码 Base64",
    errors: "以下链接需要检查",
    line: "第",
    noNodes: "未找到可转换的节点，请查看下方错误。",
    copyError: "无法访问剪贴板，请手动选中并复制下方配置。",
    why: "为什么有些链接无法转换？",
    whyText:
      "无法准确映射的参数会明确报错，不会被悄悄丢弃。例如证书固定、TUIC v4 token，以及 QUIC 协议上的 uTLS 指纹。Xray 不支持 Hysteria2 和 TUIC。",
    import: "如何使用生成的配置？",
    importText:
      "Clash Verge Rev：进入「配置 → 新建 → 本地」，导入下载的 YAML 文件。sing-box 或 Xray：在对应客户端加载 JSON 文件。默认本地代理端口为 7890。",
    faq: "你可能还想了解",
    faqs: [
      [
        "可以直接粘贴订阅地址吗？",
        "请粘贴订阅地址返回的内容，而不是 URL。自行打开订阅并复制 Base64 内容，或直接粘贴单个节点链接。本地工具不会请求远程订阅。",
      ],
      [
        "配置会自动更新吗？",
        "这里生成的是一次性本地配置文件。节点发生变化后，需要重新粘贴订阅内容并转换。",
      ],
      [
        "转换成功是否代表节点可用？",
        "转换只校验结构和支持的参数，不会连接服务器或测试可用性。示例使用保留的 example.com 域名，仅用于演示。",
      ],
      [
        "中国大陆直连预设需要什么？",
        "Mihomo 和 Xray 需要对应的地理数据文件；sing-box 会在运行生成的配置时下载 geoip-cn 和 geosite-cn 规则集。转换过程本身不发出网络请求。",
      ],
    ],
    footer: "一个小工具，所有转换都在本地。",
    reference: "参考 Shipengtao",
    theme: "切换明暗主题",
    language: "Switch to English",
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
