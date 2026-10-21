import { useEffect, useRef, useState } from "react";
import {
  convert,
  ConversionError,
  EXAMPLE,
  type Format,
  type Result,
  type Routing,
} from "./converter";
import { copy, issueText, type Language } from "./i18n";

const formats: { id: Format; title: string; ext: string }[] = [
  { id: "clash", title: "Clash / Mihomo (YAML)", ext: "yaml" },
  { id: "sing-box", title: "sing-box (JSON)", ext: "json" },
  { id: "xray", title: "Xray (JSON)", ext: "json" },
];

export default function App() {
  const [lang, setLang] = useState<Language>("zh");
  const [dark, setDark] = useState(false);
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<Format>("clash");
  const [routing, setRouting] = useState<Routing>("all");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = copy[lang];
  const en = lang === "en";
  const selected = formats.find((f) => f.id === format)!;
  const lineCount = input.split(/\r?\n/).filter((line) => line.trim()).length;

  useEffect(() => {
    document.documentElement.lang = en ? "en" : "zh-CN";
    document.title = en ? "Proxy Converter" : "代理配置转换";
  }, [en]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function invalidate() {
    setResult(null);
    setError("");
    setCopied(false);
    setClipboardError(false);
    clearTimeout(timer.current);
  }
  function run() {
    invalidate();
    try {
      setResult(convert(input, format, routing));
    } catch (e) {
      setError(
        e instanceof ConversionError
          ? `${e.code}${e.detail ? `|${e.detail}` : ""}`
          : "invalid",
      );
    }
  }
  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(result!.config);
      setCopied(true);
      setClipboardError(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setClipboardError(true);
    }
  }
  function download() {
    const blob = new Blob([result!.config], {
      type:
        format === "clash"
          ? "application/yaml;charset=utf-8"
          : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${format}-config.${selected.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main id="converter">
      <header className="page-header">
        <h1>{en ? "Proxy Converter" : "代理配置转换"}</h1>
        <div className="preferences">
          <button
            className="text-button"
            aria-label={t.language}
            onClick={() => setLang(en ? "zh" : "en")}
          >
            {en ? "中文" : "English"}
          </button>
          <button
            className="text-button"
            aria-label={t.theme}
            onClick={() => setDark(!dark)}
          >
            {dark ? (en ? "Light" : "浅色") : en ? "Dark" : "深色"}
          </button>
        </div>
      </header>
      <p className="description">
        {en
          ? "VLESS, VMess, Trojan, Hysteria2, TUIC. Conversion runs locally; node links are not uploaded."
          : "支持 VLESS、VMess、Trojan、Hysteria2、TUIC。在本机转换，不上传节点。"}
      </p>

      <div className="settings">
        <label htmlFor="format-select">
          {en ? "Output" : "输出格式"}
          <select
            id="format-select"
            value={format}
            onChange={(e) => {
              setFormat(e.target.value as Format);
              invalidate();
            }}
          >
            {formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="routing-select">
          {en ? "Routing" : "路由"}
          <select
            id="routing-select"
            value={routing}
            onChange={(e) => {
              setRouting(e.target.value as Routing);
              invalidate();
            }}
          >
            <option value="all">{t.all}</option>
            <option value="china">{t.china}</option>
          </select>
        </label>
        <button className="primary-button" onClick={run}>
          {en ? "Convert" : "转换"}
        </button>
        <span className="shortcut">Ctrl / ⌘ + Enter</span>
      </div>

      <div className="editors">
        <section className="editor" aria-labelledby="input-heading">
          <div className="editor-heading">
            <h2 id="input-heading">
              <label htmlFor="node-input">{en ? "Input" : "输入"}</label>
            </h2>
            <div className="editor-actions">
              <button
                className="text-button"
                onClick={() => {
                  invalidate();
                  setInput(EXAMPLE);
                }}
              >
                {en ? "Example" : "示例"}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setInput("");
                  invalidate();
                }}
              >
                {en ? "Clear" : "清空"}
              </button>
            </div>
          </div>
          <textarea
            id="node-input"
            aria-describedby="input-help"
            value={input}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={
              en
                ? "One node link per line, or paste a base64 subscription body."
                : "每行一个节点链接，或粘贴 Base64 订阅正文。"
            }
            onChange={(e) => {
              setInput(e.target.value);
              invalidate();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                run();
              }
            }}
          />
          <p className="editor-note" id="input-help">
            {lineCount
              ? `${lineCount} ${en ? "non-empty lines" : "个非空行"}`
              : en
                ? "Paste subscription contents, not the subscription URL."
                : "填写订阅内容，不是订阅网址。"}
          </p>
        </section>
        <section className="editor" aria-labelledby="output-heading">
          <div className="editor-heading">
            <h2 id="output-heading">
              <label htmlFor="config-output">{en ? "Result" : "结果"}</label>
            </h2>
            <div className="editor-actions">
              <button disabled={!result?.config} onClick={copyConfig}>
                {copied ? (en ? "Copied" : "已复制") : en ? "Copy" : "复制"}
              </button>
              <button disabled={!result?.config} onClick={download}>
                {en ? "Download" : "下载"}
              </button>
            </div>
          </div>
          <textarea
            id="config-output"
            value={result?.config || ""}
            readOnly
            wrap="off"
            spellCheck={false}
            placeholder={en ? "Converted configuration" : "转换结果"}
          />
          <p className="editor-note">
            {result?.config
              ? `${format}-config.${selected.ext} · ${result.config.split("\n").length} ${en ? "lines" : "行"}`
              : format === "clash"
                ? en
                  ? "For Mihomo / Clash.Meta clients."
                  : "适用于 Mihomo / Clash.Meta 客户端。"
                : format === "sing-box"
                  ? "sing-box 1.12+"
                  : en
                    ? "VLESS, VMess and Trojan only."
                    : "仅支持 VLESS、VMess、Trojan。"}
          </p>
        </section>
      </div>

      <div className="feedback" aria-live="polite">
        {error && (
          <p className="error-message" role="alert">
            {issueText(error, lang)}
          </p>
        )}
        {result && (
          <>
            <p
              className={
                result.nodes.length ? "result-summary" : "error-message"
              }
            >
              {result.nodes.length
                ? `${en ? "Converted" : "已转换"} ${result.nodes.length} ${en ? "nodes" : "个节点"}${result.errors.length ? `，${result.errors.length} ${en ? "lines skipped" : "行跳过"}` : ""}${result.decoded ? ` · ${en ? "Base64 decoded" : "Base64 已解码"}` : ""}`
                : t.noNodes}
            </p>
            {result.errors.length > 0 && (
              <ul className="error-list">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    {en ? `Line ${e.line}: ` : `第 ${e.line} 行：`}
                    {issueText(e.message, lang)}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {clipboardError && (
          <p className="error-message" role="alert">
            {t.copyError}
          </p>
        )}
      </div>

      <details id="guide" className="help">
        <summary>{en ? "Usage and compatibility" : "使用说明与兼容性"}</summary>
        <div className="help-content">
          <p>
            {en
              ? "This tool generates a local configuration file. It does not test connectivity or update subscriptions automatically."
              : "生成一次性本地配置文件，不测试节点连通性，也不自动更新订阅。"}
          </p>
          <p>{t.importText}</p>
          <p>
            {en
              ? "Xray does not support Hysteria2 or TUIC. sing-box does not support XHTTP. Unmappable parameters are reported as errors."
              : "Xray 不支持 Hysteria2、TUIC；sing-box 不支持 XHTTP。无法映射的参数会报错。"}
          </p>
          <p>{t.chinaInfo}</p>
        </div>
      </details>
    </main>
  );
}
