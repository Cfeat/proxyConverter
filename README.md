# 代理配置转换

一个在本地运行的代理配置转换工具。界面只包含格式与路由选择、输入和结果，以及复制、下载操作；窄屏下输入与结果上下排列。功能需求参考 [Shipengtao Proxy Converter](https://shipengtao.com/en/tools/proxy-converter/)，界面独立实现。

使用 React、TypeScript、Vite 构建。全部解析和转换在浏览器完成，无后端、账户、分析统计、外部字体或转换服务，也不会把节点写入 localStorage、Cookie 或 URL。用户主动下载时才将配置保存成文件。

## 本地启动

需要 Node.js 22.12 或更新版本。

```powershell
cd D:\Code\Project\proxyConverter
npm install
npm run dev
```

打开 **http://127.0.0.1:5173/**。服务仅监听本机地址，端口被占用时会明确报错。

```powershell
npm test          # 转换器自动测试
npm run build    # TypeScript 检查并构建到 dist/
npm run preview  # 在本地预览构建产物
```

构建结果是静态网页，需通过 HTTP 服务访问，不要双击 dist/index.html。运行和转换不需要网络；首次安装依赖需要网络。

## 使用

1. 每行粘贴一个 VLESS、VMess、Trojan、Hysteria2（支持 hy2 别名）或 TUIC v5 分享链接，或粘贴 Base64 订阅正文。
2. 选择 Clash / Mihomo YAML、sing-box JSON 或 Xray JSON。
3. 选择「代理所有流量」或「中国大陆直连」。
4. 点击「转换」（Ctrl / ⌘ + Enter），在结果区复制或下载。

「示例」包含五种协议的虚构节点，仅演示格式，不能用于连接。页面支持中英文、明暗主题与窄屏布局。更改输入、格式或路由会清除旧结果，避免误复制过期配置。

支持 UTF-8、URL-safe 和省略填充的 Base64；节点重名会自动编号。空行和以 `#` 开头的注释会跳过，错误指向原输入行号（Base64 输入指向解码后的行号）。无效行不会阻止有效节点输出，页面会明确显示被跳过的行。超过 2 MB 的输入会被拒绝。

## 兼容范围

- **Clash / Mihomo**：五种协议均支持，面向 Mihomo (Clash.Meta)、Clash Verge Rev、ClashX Meta，不面向原版 Clash。包含 `PROXY` 节点选择组，本地 mixed 端口 7890。XHTTP 需客户端内核支持。
- **sing-box**：五种协议均支持，生成 1.12+ 格式，包含 DNS、mixed 入站和 selector 出站。默认节点为首个有效节点，本地 mixed 端口 7890。不支持 XHTTP。
- **Xray**：支持 VLESS、VMess 和 Trojan；Hysteria2、TUIC 和旧 HTTP/2 传输会明确报错。包含所有有效出站，通过路由使用首个节点；要切换节点可编辑最终规则的 outboundTag。SOCKS 端口 7890，HTTP 端口 7891。

映射常见 TCP、WebSocket、gRPC、HTTP/2、HTTP Upgrade、XHTTP 传输以及 TLS、REALITY、SNI、ALPN、客户端指纹等字段，具体取决于目标支持情况。支持 Hysteria2 salamander 混淆与带宽参数、TUIC v5 拥塞控制和 UDP 模式。

为了避免生成表面成功、实际行为变化的配置，未知参数或不能准确映射的参数会报错。例如证书固定、TUIC v4 token、QUIC 协议上的 uTLS 指纹、目标不支持的 gRPC authority / REALITY spx，以及不兼容的旧 VMess alterId。该版本不承诺覆盖所有第三方客户端私有参数。

不接受 HTTP 订阅地址，请自行获取其返回正文。生成的是一次性配置，不自动刷新订阅；转换成功仅表示配置可生成，不代表节点可连接。本项目不会测试服务器连通性，也不会设置系统代理。

「中国大陆直连」预设在配置**运行时**依赖客户端地理数据：Mihomo 使用 GEOSITE/GEOIP，Xray 使用 geosite/geoip 数据文件，sing-box 下载 SagerNet 的 geoip-cn/geosite-cn 远程规则集。离线使用此路由时请自行准备这些数据。转换网页自身不会发出这些请求。

## 验证

34 项 Vitest 测试覆盖协议、中文标签、订阅解码、特殊字符、重复名称、错误定位、传输/TLS 映射、路由和不可映射参数。

还提供可选的真实内核检查脚本。先从各项目的官方发布页下载客户端内核，再传入本地可执行文件路径：

```powershell
npm run test:cores -- --mihomo "C:\path\mihomo.exe" --sing-box "C:\path\sing-box.exe" --xray "C:\path\xray.exe"
```

可以只传其中一个内核。脚本只创建虚构示例的临时配置，调用内核的配置检查命令，不启动代理、不处理真实节点。配置保留在输出提示的系统临时目录，便于排查。

本次在 Mihomo **1.19.32**、sing-box **1.14.3**、Xray **26.3.27** 上完成 21 份示例配置检查，涵盖五种协议以及 REALITY、WS early data、gRPC、HTTP Upgrade、H2、XHTTP 和 TUIC 选项；不支持的组合被跳过。自动测试验证路由结构，内核检查使用全代理预设，未验证服务器连接。

## 文件

- `src/converter.ts`：协议解析、参数校验、三种目标映射和完整配置生成。
- `src/converter.test.ts`：转换器测试。
- `src/App.tsx`、`src/style.css`：界面与交互。
- `src/i18n.ts`：中英文文案和错误解释。
- `scripts/validate-cores.mjs`：可选内核集成检查。

参考文档：[Mihomo](https://wiki.metacubex.one/en/config/proxies/vless/)、[sing-box](https://sing-box.sagernet.org/configuration/)、[Xray](https://xtls.github.io/en/config/)。本项目为独立本地实现，与原网站无隶属关系。
