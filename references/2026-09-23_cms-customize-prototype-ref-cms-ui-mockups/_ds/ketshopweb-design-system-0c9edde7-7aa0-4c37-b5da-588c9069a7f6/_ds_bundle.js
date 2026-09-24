/* @ds-bundle: {"format":4,"namespace":"KetshopwebDesignSystem_0c9edd","components":[],"sourceHashes":{"doc-pattern-tweaks.jsx":"04a660977020","tweaks-panel.jsx":"82e4c3ddd5ec"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KetshopwebDesignSystem_0c9edd = window.KetshopwebDesignSystem_0c9edd || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// doc-pattern-tweaks.jsx
try { (() => {
// Tweaks for Document Pattern.html
// Three expressive controls that reshape the FEEL of the document pattern,
// not single-property nudges.
//   1. Accent Character — recolors ceremonial elements (title, table head, watermark, price)
//   2. Type Voice       — rebinds the entire doc font stack across heads + body
//   3. Page Grammar     — rescales rhythm (line-height, heading margins, body size)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "ceremonial",
  "typeVoice": "thai-classic",
  "grammar": "standard"
} /*EDITMODE-END*/;

/* ────────────────────────────────────────────────────────────── */
/* Preset tables                                                   */
/* ────────────────────────────────────────────────────────────── */

const ACCENT_PRESETS = {
  ceremonial: {
    label: "Ceremonial",
    hint: "Ket Red — formal Thai proposal, the house default",
    swatch: "#B12629",
    vars: {
      "--ket-red": "#B12629",
      "--red-700": "#921E21",
      "--red-50": "#FDF3F3"
    }
  },
  judicial: {
    label: "Judicial",
    hint: "Deep indigo — legal, contract, government-grade",
    swatch: "#2C3258",
    vars: {
      "--ket-red": "#2C3258",
      "--red-700": "#1E2243",
      "--red-50": "#EEF0F7"
    }
  },
  editorial: {
    label: "Editorial",
    hint: "Forest green — long-read, confident, publication",
    swatch: "#2F6A42",
    vars: {
      "--ket-red": "#2F6A42",
      "--red-700": "#1F4A2D",
      "--red-50": "#EDF5EF"
    }
  },
  monochrome: {
    label: "Monochrome",
    hint: "Charcoal — severe, type-led, no ceremony",
    swatch: "#1E2129",
    vars: {
      "--ket-red": "#1E2129",
      "--red-700": "#13151B",
      "--red-50": "#F2F3F5"
    }
  }
};
const TYPE_PRESETS = {
  "thai-classic": {
    label: "Thai Classic",
    hint: "TH Sarabun body · Prompt heads — ceremonial Thai (default)",
    bodyTh: `"TH Sarabun New", "Sarabun", "Prompt", sans-serif`,
    bodyEn: `"Prompt", "Poppins", sans-serif`,
    heads: `"Prompt", sans-serif`,
    bodyThSize: "14pt",
    bodyEnSize: "11pt",
    titleTracking: "-0.01em",
    h1Tracking: "normal"
  },
  "global-modern": {
    label: "Global Modern",
    hint: "Inter body · Prompt heads — bilingual tech / SaaS",
    bodyTh: `"Prompt", "Sarabun", sans-serif`,
    bodyEn: `"Inter", "Prompt", sans-serif`,
    heads: `"Prompt", "Inter", sans-serif`,
    bodyThSize: "12pt",
    bodyEnSize: "10.5pt",
    titleTracking: "-0.02em",
    h1Tracking: "-0.01em"
  },
  "editorial": {
    label: "Editorial",
    hint: "Noto Serif Thai + Crimson Pro — op-ed, long-read, white paper",
    bodyTh: `"Noto Serif Thai", "TH Sarabun New", serif`,
    bodyEn: `"Crimson Pro", "Noto Serif Thai", Georgia, serif`,
    heads: `"Prompt", sans-serif`,
    bodyThSize: "13pt",
    bodyEnSize: "12pt",
    titleTracking: "-0.015em",
    h1Tracking: "-0.005em"
  }
};
const GRAMMAR_PRESETS = {
  generous: {
    label: "Generous",
    hint: "Exec summary — airy, 1.75 leading, loose headings",
    bodyLineHeight: "1.75",
    bodyTracking: "0.005em",
    h1Margin: "16mm 0 6mm",
    h2Margin: "11mm 0 4mm",
    h3Margin: "7mm 0 3mm",
    titleSize: "22pt",
    titleMargin: "0 0 9mm",
    paraSpacing: "4mm",
    bodyScale: "1.06"
  },
  standard: {
    label: "Standard",
    hint: "Per spec — proposal / SOW / quotation default",
    bodyLineHeight: "1.5",
    bodyTracking: "normal",
    h1Margin: "12mm 0 4mm",
    h2Margin: "8mm 0 3mm",
    h3Margin: "5mm 0 2mm",
    titleSize: "20pt",
    titleMargin: "0 0 6mm",
    paraSpacing: "2.5mm",
    bodyScale: "1"
  },
  compact: {
    label: "Compact",
    hint: "Dense legal / T&C — 1.35 leading, tight headings",
    bodyLineHeight: "1.35",
    bodyTracking: "-0.002em",
    h1Margin: "8mm 0 3mm",
    h2Margin: "5mm 0 2mm",
    h3Margin: "3mm 0 1.5mm",
    titleSize: "18pt",
    titleMargin: "0 0 4mm",
    paraSpacing: "1.5mm",
    bodyScale: "0.94"
  }
};

/* ────────────────────────────────────────────────────────────── */
/* Build CSS from the three selected presets                       */
/* ────────────────────────────────────────────────────────────── */

function buildOverrideCSS(accent, typeVoice, grammar) {
  const a = ACCENT_PRESETS[accent] || ACCENT_PRESETS.ceremonial;
  const t = TYPE_PRESETS[typeVoice] || TYPE_PRESETS["thai-classic"];
  const g = GRAMMAR_PRESETS[grammar] || GRAMMAR_PRESETS.standard;
  const accentVars = Object.entries(a.vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");

  // Scope accent vars to .doc so the rest of the reference-page chrome
  // (topbar, TOC etc.) keeps its native Ket Red identity — we only recolor
  // the actual document specimens.
  return `
/* === Accent Character → ${a.label} === */
.doc, .doc-page, .ref-mini-page {
${accentVars}
}

/* === Type Voice → ${t.label} === */
.doc, .doc-page, .ref-mini-page.doc {
  font-family: ${t.bodyTh};
  font-size: calc(${t.bodyThSize} * ${g.bodyScale});
}
.doc[lang="en"], .doc .en, .doc [lang="en"] {
  font-family: ${t.bodyEn};
  font-size: calc(${t.bodyEnSize} * ${g.bodyScale});
}
.doc h1, .doc h2, .doc h3,
.doc .doc-title, .doc .doc-subtitle {
  font-family: ${t.heads};
}
.doc .doc-title { letter-spacing: ${t.titleTracking}; }
.doc h1 { letter-spacing: ${t.h1Tracking}; }

/* === Page Grammar → ${g.label} === */
.doc, .doc-page, .ref-mini-page.doc { line-height: ${g.bodyLineHeight}; letter-spacing: ${g.bodyTracking}; }
.doc p { margin: 0 0 ${g.paraSpacing}; }
.doc h1 { margin: ${g.h1Margin}; }
.doc h2 { margin: ${g.h2Margin}; }
.doc h3 { margin: ${g.h3Margin}; }
.doc .doc-title { font-size: ${g.titleSize}; margin: ${g.titleMargin}; }
`;
}

/* ────────────────────────────────────────────────────────────── */
/* Component                                                       */
/* ────────────────────────────────────────────────────────────── */

function DocPatternTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => {
    const style = document.getElementById("tweak-overrides");
    if (style) style.textContent = buildOverrideCSS(t.accent, t.typeVoice, t.grammar);
  }, [t.accent, t.typeVoice, t.grammar]);

  // Rich visual option cards for each control
  const AccentOption = ({
    id
  }) => {
    const p = ACCENT_PRESETS[id];
    const active = t.accent === id;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setTweak("accent", id),
      style: {
        appearance: "none",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 8,
        border: active ? "1.5px solid rgba(41,38,27,.85)" : ".5px solid rgba(0,0,0,.12)",
        background: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.5)",
        cursor: "default",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        font: "inherit",
        color: "inherit"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: 4,
        background: p.swatch,
        flexShrink: 0,
        boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 600
      }
    }, p.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "rgba(41,38,27,.55)",
        lineHeight: 1.3
      }
    }, p.hint)));
  };
  const VoiceOption = ({
    id
  }) => {
    const p = TYPE_PRESETS[id];
    const active = t.typeVoice === id;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setTweak("typeVoice", id),
      style: {
        appearance: "none",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 8,
        border: active ? "1.5px solid rgba(41,38,27,.85)" : ".5px solid rgba(0,0,0,.12)",
        background: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.5)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 3,
        width: "100%",
        font: "inherit",
        color: "inherit"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: p.heads,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: p.titleTracking,
        color: "#29261b",
        lineHeight: 1
      }
    }, p.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: p.bodyEn,
        fontSize: 11,
        fontStyle: id === "editorial" ? "italic" : "normal",
        color: "rgba(41,38,27,.65)",
        lineHeight: 1.3
      }
    }, p.hint));
  };
  const GrammarOption = ({
    id
  }) => {
    const p = GRAMMAR_PRESETS[id];
    const active = t.grammar === id;
    // Mini-bar visual showing the rhythm
    const lineGap = id === "generous" ? 7 : id === "compact" ? 3 : 5;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setTweak("grammar", id),
      style: {
        appearance: "none",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 8,
        border: active ? "1.5px solid rgba(41,38,27,.85)" : ".5px solid rgba(0,0,0,.12)",
        background: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.5)",
        cursor: "default",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        font: "inherit",
        color: "inherit"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 26,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: lineGap - 2,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        height: 2,
        background: "rgba(41,38,27,.75)",
        width: "100%",
        borderRadius: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        height: 2,
        background: "rgba(41,38,27,.55)",
        width: "85%",
        borderRadius: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        height: 2,
        background: "rgba(41,38,27,.55)",
        width: "70%",
        borderRadius: 1
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 600
      }
    }, p.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "rgba(41,38,27,.55)",
        lineHeight: 1.3
      }
    }, p.hint)));
  };
  return /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Accent Character"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, Object.keys(ACCENT_PRESETS).map(id => /*#__PURE__*/React.createElement(AccentOption, {
    key: id,
    id: id
  }))), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Type Voice"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, Object.keys(TYPE_PRESETS).map(id => /*#__PURE__*/React.createElement(VoiceOption, {
    key: id,
    id: id
  }))), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Page Grammar"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, Object.keys(GRAMMAR_PRESETS).map(id => /*#__PURE__*/React.createElement(GrammarOption, {
    key: id,
    id: id
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "8px 10px",
      borderRadius: 7,
      background: "rgba(0,0,0,.04)",
      fontSize: 10,
      lineHeight: 1.45,
      color: "rgba(41,38,27,.6)"
    }
  }, "Affects ", /*#__PURE__*/React.createElement("b", null, ".doc"), " specimens only \u2014 reference-page chrome (topbar, TOC, spec tables) keeps its native Ket Red so the system itself stays recognizable."));
}
ReactDOM.createRoot(document.getElementById("tweaks-root")).render(/*#__PURE__*/React.createElement(DocPatternTweaks, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "doc-pattern-tweaks.jsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;height:22px;
    border-radius:6px;cursor:default;padding:0}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((key, val) => {
    setValues(prev => ({
      ...prev,
      [key]: val
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits: {
        [key]: val
      }
    }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}
function TweakColor({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
    type: "color",
    className: "twk-swatch",
    value: value,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

})();
