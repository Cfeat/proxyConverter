import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowRightLeft,
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  FileCode2,
  Globe2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  convert,
  ConversionError,
  EXAMPLE,
  type Format,
  type Result,
  type Routing,
} from "./converter";
import { copy, issueText, type Language } from "./i18n";

const formats: { id: Format; title: string; sub: string; ext: string }[] = [
  { id: "clash", title: "Clash / Mihomo", sub: "YAML", ext: "yaml" },
  { id: "sing-box", title: "sing-box", sub: "JSON", ext: "json" },
  { id: "xray", title: "Xray", sub: "JSON", ext: "json" },
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
  const selected = formats.find((f) => f.id === format)!;
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title =
      lang === "zh"
        ? "代理配置转换器 · Proxy Converter"
        : "Proxy config converter · Local tools";
  }, [lang]);
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
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#">
            <span className="brand-symbol">
              <ArrowRightLeft size={20} strokeWidth={2.4} />
            </span>
            proxy<span className="brand-light">converter</span>
            <span className="local-tag">LOCAL</span>
          </a>
          <nav aria-label={lang === "en" ? "Navigation" : "导航"}>
            <a className="nav-active" href="#converter">
              {t.converter}
            </a>
            <a href="#guide">{t.guide}</a>
          </nav>
          <div className="header-actions">
            <span className="local-status">
              <i />
              {t.local}
            </span>
            <span className="header-divider" />
            <button
              className="icon-button language"
              aria-label={t.language}
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
            >
              <Globe2 size={15} />
              {lang === "en" ? "中" : "EN"}
            </button>
            <button
              className="icon-button"
              aria-label={t.theme}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="hero" id="converter">
          <div className="eyebrow">
            <span />
            {t.eyebrow}
          </div>
          <h1>
            {t.title}
            <span className="title-dot">.</span>
          </h1>
          <p className="intro">{t.intro}</p>
          <div className="protocols">
            {["VLESS", "VMess", "Trojan", "Hysteria2", "TUIC"].map((p) => (
              <span key={p}>{p}</span>
            ))}
            <span className="protocol-arrow">→</span>
            <span className="protocol-output">YAML / JSON</span>
          </div>
        </section>
        <aside className="privacy">
          <span className="privacy-icon">
            <ShieldCheck size={21} />
          </span>
          <div>
            <strong>{t.privacy}</strong>
            <p>{t.privacyText}</p>
          </div>
          <LockKeyhole className="privacy-lock" size={31} strokeWidth={1.3} />
        </aside>
        <section className="converter-card" aria-label={t.converter}>
          <div className="input-heading">
            <label htmlFor="node-input">
              <span className="step-number">01</span>
              {t.input}
            </label>
            <button
              className="text-button"
              onClick={() => {
                invalidate();
                setInput(EXAMPLE);
              }}
            >
              <Sparkles size={14} />
              {t.example}
            </button>
          </div>
          <p className="field-help" id="input-help">
            {t.inputHelp}
          </p>
          <div className="textarea-wrap">
            <textarea
              id="node-input"
              aria-describedby="input-help"
              value={input}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={
                "vless://uuid@server:443?security=tls&type=ws#Tokyo\ntrojan://password@server:443?sni=example.com#Singapore\nhysteria2://password@server:443#Frankfurt\n\n" +
                (lang === "en"
                  ? "Or paste a base64-encoded subscription…"
                  : "或粘贴 Base64 编码的订阅内容…")
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
            <div className="input-meta">
              <span>
                <Code2 size={13} />
                {lang === "en" ? "Plain text · Base64" : "纯文本 · Base64"}
              </span>
              <span>
                {input.trim()
                  ? input
                      .trim()
                      .split(/\r?\n/)
                      .filter((l) => l.trim()).length
                  : 0}{" "}
                {lang === "en" ? "lines" : "行"}
              </span>
            </div>
          </div>
          <fieldset className="format-field">
            <legend>
              <span className="step-number">02</span>
              {t.format}
            </legend>
            <div className="format-options">
              {formats.map((f) => (
                <label
                  className={`format-option ${format === f.id ? "selected" : ""}`}
                  key={f.id}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.id}
                    checked={format === f.id}
                    onChange={() => {
                      setFormat(f.id);
                      invalidate();
                    }}
                  />
                  <FileCode2 size={21} strokeWidth={1.6} />
                  <span>
                    {f.title}
                    <small>{f.sub}</small>
                  </span>
                  <span className="radio-indicator">
                    {format === f.id && <span />}
                  </span>
                </label>
              ))}
            </div>
            <p className="format-help">
              {format === "clash"
                ? t.clashHint
                : format === "sing-box"
                  ? t.singHint
                  : t.xrayHint}
            </p>
          </fieldset>
          <fieldset className="routing-field">
            <legend>
              <span className="step-number">03</span>
              {t.routing}
            </legend>
            <div className="routing-options">
              {(["all", "china"] as Routing[]).map((r) => (
                <label
                  className={`routing-option ${routing === r ? "selected" : ""}`}
                  key={r}
                >
                  <input
                    type="radio"
                    name="routing"
                    value={r}
                    checked={routing === r}
                    onChange={() => {
                      setRouting(r);
                      invalidate();
                    }}
                  />
                  <span className="radio-indicator">
                    {routing === r && <span />}
                  </span>
                  <span>
                    <strong>{r === "all" ? t.all : t.china}</strong>
                    <small>{r === "all" ? t.allHelp : t.chinaHelp}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-actions">
            <button className="primary-button" onClick={run}>
              {t.convert}
              <ArrowRight size={17} />
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setInput("");
                invalidate();
              }}
            >
              <Trash2 size={15} />
              {t.clear}
            </button>
            <span className="keyboard-hint">Ctrl / ⌘ + Enter</span>
          </div>
        </section>
        <div aria-live="polite" className="feedback">
          {error && (
            <div className="error-box" role="alert">
              <TriangleAlert size={18} />
              {issueText(error, lang)}
            </div>
          )}
          {result && (
            <>
              <div
                className={`result-status ${result.nodes.length ? "" : "status-error"}`}
              >
                {result.nodes.length ? (
                  <>
                    <Check size={17} />
                    <strong>
                      {result.nodes.length} {t.nodes}
                    </strong>
                    {result.decoded && (
                      <span className="status-tag">{t.decoded}</span>
                    )}
                    {result.errors.length > 0 && (
                      <span className="skipped">
                        {result.errors.length} {t.skipped}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <TriangleAlert size={17} />
                    {t.noNodes}
                  </>
                )}
              </div>
              {result.errors.length > 0 && (
                <details className="issues" open>
                  <summary>
                    <TriangleAlert size={15} />
                    {t.errors}
                    <ChevronDown size={15} />
                  </summary>
                  <ul>
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        <span>
                          {t.line} {e.line}
                          {lang === "zh" ? " 行" : ""}
                        </span>
                        {issueText(e.message, lang)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
        <section className="result-section" aria-label={t.result}>
          <div className="result-heading">
            <h2>
              {t.result}
              <span className="file-type">{selected.sub}</span>
            </h2>
            <div>
              <button
                className="secondary-button small"
                disabled={!result?.config}
                onClick={copyConfig}
              >
                {copied ? <Check size={14} /> : <Clipboard size={14} />}
                {copied ? t.copied : t.copy}
              </button>
              <button
                className="secondary-button small"
                disabled={!result?.config}
                onClick={download}
              >
                <ArrowDownToLine size={14} />
                {t.download}
              </button>
            </div>
          </div>
          {clipboardError && (
            <p className="copy-error" role="alert">
              {t.copyError}
            </p>
          )}
          {result?.config ? (
            <div className="code-panel">
              <div className="code-toolbar">
                <span>
                  <span className="file-dot" />
                  {format}-config.{selected.ext}
                </span>
                <span>
                  {t.generated} · {result.config.split("\n").length}{" "}
                  {lang === "en" ? "lines" : "行"}
                </span>
              </div>
              <pre tabIndex={0} aria-label={t.result}>
                <code>{result.config}</code>
              </pre>
            </div>
          ) : (
            <div className="empty-result">
              <div className="empty-icon">
                <FileCode2 size={26} strokeWidth={1.3} />
              </div>
              <strong>{t.emptyTitle}</strong>
              <p>{t.emptyHelp}</p>
              <span className="empty-formats">
                .yaml <span>·</span> .json
              </span>
            </div>
          )}
        </section>
        <section className="guide" id="guide">
          <div className="guide-columns">
            <article>
              <div className="guide-icon">
                <ShieldCheck size={19} />
              </div>
              <h3>{t.why}</h3>
              <p>{t.whyText}</p>
            </article>
            <article>
              <div className="guide-icon">
                <ArrowDownToLine size={19} />
              </div>
              <h3>{t.import}</h3>
              <p>{t.importText}</p>
            </article>
          </div>
          <h2 className="faq-heading">{t.faq}</h2>
          <div className="faq-list">
            {t.faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={16} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <footer>
          <span>
            <ArrowRightLeft size={14} />
            {t.footer}
          </span>
          <a
            href="https://shipengtao.com/en/tools/proxy-converter/"
            target="_blank"
            rel="noreferrer"
          >
            {t.reference}
            <ArrowRight size={13} />
          </a>
        </footer>
      </main>
    </>
  );
}
