import { useState, useRef, useEffect, useCallback } from "react";

const SYSTEM_PROMPT = `You are an elite UI/UX designer and frontend architect. You produce visually stunning, production-ready interface code.

TECH SELECTION — choose strictly based on complexity:
• HTML/CSS → static layouts, landing pages, cards, forms, visual showcases, anything without runtime state
• React + Tailwind → dashboards, interactive components, multi-step flows, data-driven UIs, anything needing useState/useEffect

CODE QUALITY — non-negotiable rules:
• HTML/CSS: semantic markup, CSS custom properties for all tokens, modern CSS (clamp, grid, logical props, @layer), WCAG AA contrast, BEM-style naming
• React: functional components, Tailwind utilities, no class components, no inline event handlers on native DOM strings
• Both: mobile-first, smooth CSS transitions, distinctive Google Fonts (embed via <link> in HTML output), accessible (aria labels, focus-visible), zero dead code

DESIGN RULES — always apply:
• Distinctive, memorable aesthetics — no generic AI-looking output
• Google Fonts: always pick a characterful pairing (display + body), never Arial/Inter/system-ui as primary
• Cohesive palette with CSS custom properties (--color-accent, --color-bg, etc.)
• Micro-interactions on every interactive element (hover, focus, active states)
• Generous spacing, intentional typographic scale (use clamp() for fluid type)
• Layer depth: subtle box-shadow or border hierarchy to create visual layers

OUTPUT FORMAT — use this exact delimiter format, nothing else:
<<<META>>>
TYPE: html or react
TECH: one sentence explaining the tech choice
SUGGESTIONS: suggestion1 | suggestion2 | suggestion3
<<<CODE>>>
(paste the full code here — no JSON escaping)
<<<END>>>

For html: complete self-contained HTML file with all fonts/CSS/JS embedded — renders directly in an iframe.
For react: complete functional React component with Tailwind classes.`;

const EXAMPLES = [
  { icon: "◈", text: "Dashboard analytics avec graphiques" },
  { icon: "◉", text: "Carte de profil utilisateur élégante" },
  { icon: "◫", text: "Page pricing SaaS avec toggle annuel/mensuel" },
  { icon: "◎", text: "Formulaire de contact avec validation animée" },
];

function TypeBadge({ type }) {
  const isReact = type === "react";
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 7px",
      borderRadius: 5,
      background: isReact ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.12)",
      color: isReact ? "#a78bfa" : "#34d399",
      border: `1px solid ${isReact ? "rgba(139,92,246,0.3)" : "rgba(16,185,129,0.25)"}`,
    }}>
      {isReact ? "React + Tailwind" : "HTML / CSS"}
    </span>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#6366f1",
          animation: `da-bounce 1.1s ${i * 0.18}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

export default function DesignAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("preview");
  const [preview, setPreview] = useState("");
  const [code, setCode] = useState("");
  const [codeType, setCodeType] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("da-gfonts")) {
      const l = document.createElement("link");
      l.id = "da-gfonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
    const style = document.createElement("style");
    style.textContent = `
      @keyframes da-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
      @keyframes da-fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      .da-chip:hover { background: rgba(99,102,241,.15) !important; border-color: rgba(99,102,241,.35) !important; color: #c7d2fe !important; }
      .da-send:hover:not(:disabled) { opacity:.85 !important; }
      .da-send:active:not(:disabled) { transform: scale(.97); }
      .da-tab:hover { color: #c7d2fe !important; }
      .da-copy:hover { background: rgba(99,102,241,.2) !important; }
      .da-msg-user { animation: da-fade-in .2s ease; }
      .da-msg-ai { animation: da-fade-in .2s ease; }
      ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a2a40; border-radius: 3px; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (override) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setSuggestions([]);

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API error");
      const raw = (data.content || []).map(b => b.text || "").join("");

      const metaMatch = raw.match(/<<<META>>>([\s\S]*?)<<<CODE>>>/);
      const codeMatch = raw.match(/<<<CODE>>>([\s\S]*?)<<<END>>>/);
      if (!metaMatch || !codeMatch) throw new Error("Format invalide: " + raw.slice(0, 200));

      const meta = metaMatch[1].trim();
      const parsedCode = codeMatch[1].trim();

      const typeMatch = meta.match(/TYPE:\s*(\S+)/i);
      const techMatch = meta.match(/TECH:\s*(.+)/i);
      const suggMatch = meta.match(/SUGGESTIONS:\s*(.+)/i);

      const parsedType = typeMatch ? typeMatch[1].toLowerCase() : "html";
      const parsedTech = techMatch ? techMatch[1].trim() : "";
      const parsedSugg = suggMatch ? suggMatch[1].split("|").map(s => s.trim()).filter(Boolean) : [];

      setCode(parsedCode);
      setPreview(parsedType === "html" ? parsedCode : "");
      setCodeType(parsedType);
      setSuggestions(parsedSugg);
      setTab(parsedType === "react" ? "code" : "preview");
      setHasResult(true);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: parsedCode.slice(0, 300),
        type: parsedType,
        tech: parsedTech,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "__error__",
        error: true,
        errorMsg: err?.message || String(err),
      }]);
    }

    setLoading(false);
  }, [input, messages, loading]);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Layout & style tokens ────────────────────────────────
  const BG = "#07070f";
  const SURFACE = "#0e0e1a";
  const BORDER = "#18182e";
  const ACCENT = "#6366f1";
  const TEXT = "#dde1f0";
  const MUTED = "#4a4a6a";

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: BG, color: TEXT,
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
    }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 20px", borderBottom: `1px solid ${BORDER}`,
        background: SURFACE, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "white", fontWeight: 600,
          }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", lineHeight: 1.2 }}>Design Agent</div>
            <div style={{ fontSize: 10, color: MUTED, fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".1em" }}>UI · CODE · GEN</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 7px #22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>claude-sonnet-4</span>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: CHAT */}
        <div style={{
          width: 320, flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderRight: `1px solid ${BORDER}`,
          background: SURFACE,
        }}>

          {/* Messages */}
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto",
            padding: 14, display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: 18, padding: "0 8px",
                textAlign: "center",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "rgba(99,102,241,.12)",
                  border: "1px solid rgba(99,102,241,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26,
                }}>✦</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#c8d0e8" }}>Décris ton interface</div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
                    Je génère le code HTML/CSS ou React+Tailwind selon la complexité, avec aperçu instantané.
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  {EXAMPLES.map((ex, i) => (
                    <button key={i} className="da-chip"
                      onClick={() => send(ex.text)}
                      style={{
                        background: "rgba(99,102,241,.07)", border: `1px solid rgba(99,102,241,.18)`,
                        borderRadius: 9, padding: "9px 12px",
                        fontSize: 12, color: "#94a3b8", cursor: "pointer",
                        textAlign: "left", fontFamily: "'DM Sans', sans-serif",
                        transition: "all .15s", display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <span style={{ color: ACCENT, fontSize: 14, flexShrink: 0 }}>{ex.icon}</span>
                      {ex.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => {
                if (m.role === "user") return (
                  <div key={i} className="da-msg-user" style={{
                    background: "rgba(99,102,241,.14)", border: `1px solid rgba(99,102,241,.24)`,
                    borderRadius: "10px 10px 3px 10px",
                    padding: "9px 12px", fontSize: 13, color: "#c8d0e8",
                    alignSelf: "flex-end", maxWidth: "92%", lineHeight: 1.55,
                  }}>
                    {m.content}
                  </div>
                );
                if (m.error) return (
                  <div key={i} className="da-msg-ai" style={{
                    background: "rgba(239,68,68,.09)", border: `1px solid rgba(239,68,68,.2)`,
                    borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#f87171",
                  }}>⚠ {m.errorMsg || "Erreur inconnue"}</div>
                );
                return (
                  <div key={i} className="da-msg-ai" style={{
                    background: "#0b0b17", border: `1px solid ${BORDER}`,
                    borderRadius: "10px 10px 10px 3px",
                    padding: "9px 12px", alignSelf: "flex-start", maxWidth: "92%",
                    display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <TypeBadge type={m.type} />
                    {m.tech && (
                      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginTop: 2 }}>
                        {m.tech}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {loading && <LoadingDots />}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              padding: "8px 12px", borderTop: `1px solid ${BORDER}`,
              display: "flex", flexWrap: "wrap", gap: 5,
            }}>
              {suggestions.map((s, i) => (
                <button key={i} className="da-chip"
                  onClick={() => send(s)}
                  style={{
                    background: "rgba(99,102,241,.07)", border: `1px solid rgba(99,102,241,.2)`,
                    borderRadius: 20, padding: "4px 10px",
                    fontSize: 11, color: "#818cf8", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "11px 12px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              ref={textareaRef}
              rows={3}
              placeholder="Décris l'interface à créer…"
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = BORDER}
              style={{
                background: "#0b0b17", border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: "9px 12px",
                color: TEXT, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                resize: "none", outline: "none", lineHeight: 1.55,
                width: "100%", boxSizing: "border-box",
                transition: "border-color .15s",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#2a2a44", fontFamily: "'JetBrains Mono', monospace" }}>
                ⏎ générer · ⇧⏎ newline
              </span>
              <button className="da-send"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  border: "none", borderRadius: 8,
                  padding: "8px 18px", color: "white",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: loading || !input.trim() ? 0.45 : 1,
                  transition: "opacity .15s, transform .1s",
                }}
              >
                {loading ? "…" : "Générer →"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW + CODE */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 16px", borderBottom: `1px solid ${BORDER}`,
            background: SURFACE, flexShrink: 0,
          }}>
            <div style={{
              display: "flex", gap: 2,
              background: "#0b0b17", borderRadius: 9,
              padding: 3, border: `1px solid ${BORDER}`,
            }}>
              {["preview", "code"].map(t => (
                <button key={t} className="da-tab"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "5px 16px", borderRadius: 7,
                    fontSize: 12, fontWeight: 500,
                    border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all .15s", letterSpacing: ".02em",
                    background: tab === t ? "#1a1a2e" : "transparent",
                    color: tab === t ? "#e2e8f0" : MUTED,
                  }}
                >
                  {t === "preview" ? "Aperçu" : "Code"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {codeType && <TypeBadge type={codeType} />}
              {hasResult && (
                <button className="da-copy"
                  onClick={copyCode}
                  style={{
                    background: "rgba(99,102,241,.1)",
                    border: `1px solid rgba(99,102,241,.25)`,
                    borderRadius: 8, padding: "5px 14px",
                    fontSize: 12, color: "#818cf8", cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: "background .15s",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {copied ? "✓ Copié" : "⌘ Copier"}
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative", background: BG }}>
            {!hasResult ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: 10,
              }}>
                <div style={{ fontSize: 52, color: "#12122a" }}>⬡</div>
                <div style={{ fontSize: 12, color: "#14142a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".06em" }}>
                  // en attente
                </div>
              </div>
            ) : tab === "preview" ? (
              codeType === "react" ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: 12, padding: 32, textAlign: "center"
                }}>
                  <div style={{ fontSize: 36 }}>⚛</div>
                  <div style={{ fontSize: 13, color: "#818cf8", fontFamily: "'JetBrains Mono', monospace" }}>Composant React</div>
                  <div style={{ fontSize: 12, color: "#3a3a5a", maxWidth: 280, lineHeight: 1.6 }}>
                    Les composants React nécessitent un environnement compilé pour être prévisualisés.
                    Copie le code et ouvre-le dans un projet React ou sur codesandbox.io
                  </div>
                  <a href="https://codesandbox.io/s/new" target="_blank" rel="noreferrer" style={{
                    marginTop: 8, padding: "8px 18px",
                    background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.3)",
                    borderRadius: 8, color: "#818cf8", fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textDecoration: "none"
                  }}>
                    Ouvrir CodeSandbox →
                  </a>
                </div>
              ) : (
                <iframe
                  srcDoc={preview}
                  sandbox="allow-scripts"
                  title="UI Preview"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              )
            ) : (
              <pre style={{
                margin: 0, padding: "20px 24px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, lineHeight: 1.75,
                color: "#b8c0d8", background: BG,
                overflow: "auto", height: "100%",
                boxSizing: "border-box",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {code}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
