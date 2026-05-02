// ════════════════════════════════════════════════════════════════
// Cd_ — Card "estilo iOS" usado em todo o app pra agrupar conteúdo.
// Detecta quando entra na faixa superior da viewport (IntersectionObserver)
// e aplica glow azul + animação no ícone (cardIconPop).
// Refactor v296 Camada 3: extraído do App.jsx.
// ════════════════════════════════════════════════════════════════
import React from "react";
import { AppIcon, APP_ICONS } from "./AppIcons.jsx";

export const Cd_ = ({ title, icon, children, styles: st, variant, headerRight }) => {
  const isPink = st.accentMode === "pink";
  const vColors = isPink
    ? { danger: "#ff3b6e", warning: "#ff7a30", info: "#b54d8e", success: "#3fb56b", primary: "#d6336c", teal: "#c73086", slate: "#8a5a72" }
    : { danger: "#ff3b30", warning: "#ff9500", info: "#5856d6", success: "#34c759", primary: "#007aff", teal: "#30b0c7", slate: "#636e72" };
  const accent = variant && vColors[variant] ? vColors[variant] : null;
  const iconKey = (icon || "").trim();
  const hasSvg = iconKey && APP_ICONS && APP_ICONS[iconKey];

  // v269: detecta quando o card está perto do topo da viewport para aplicar glow azul iOS
  const cardRef = React.useRef(null);
  const [topGlow, setTopGlow] = React.useState(false);
  React.useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // v273: zona ativa entre 90px do topo e 55% da viewport — dispara
    // ANTES do card cruzar o header, quando ainda está descendo.
    const obs = new IntersectionObserver(
      (entries) => { setTopGlow(entries[0].isIntersecting); },
      { rootMargin: "-90px 0px -55% 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const bgGradient = st.dark
    ? "linear-gradient(180deg,#1f1f22 0%,#141416 100%)"
    : "linear-gradient(180deg,#ffffff 0%,#fafbfc 100%)";
  const baseShadow = st.dark
    ? "0 2px 8px rgba(0,0,0,0.5),0 0 0 0.5px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 1px 3px rgba(0,0,0,0.06),0 0 0 0.5px rgba(0,0,0,0.04),0 4px 14px rgba(0,0,0,0.04)";
  const glowShadow = accent ? `${baseShadow},0 0 16px ${accent}22,-2px 0 10px ${accent}18` : baseShadow;
  // Glow azul iOS sobreposto quando card cruza a faixa superior da viewport
  const topGlowShadow = topGlow
    ? `${glowShadow},0 0 0 2px rgba(10,132,255,0.45),0 0 30px rgba(10,132,255,0.55),0 6px 24px rgba(10,132,255,0.35)`
    : glowShadow;

  return (
    <div
      ref={cardRef}
      className={"ios-card" + (topGlow ? " ios-card-near-top" : "")}
      style={{
        background: bgGradient,
        borderRadius: 18,
        marginBottom: 14,
        overflow: "hidden",
        boxShadow: topGlowShadow,
        position: "relative",
        transition: "box-shadow 0.4s ease,transform 0.3s ease",
        transform: topGlow ? "scale(1.005)" : "scale(1)",
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 5,
            background: `linear-gradient(180deg,${accent} 0%,${accent}aa 50%,${accent}66 100%)`,
            borderTopLeftRadius: 18,
            borderBottomLeftRadius: 18,
            boxShadow: `0 0 8px ${accent}55`,
          }}
        />
      )}
      <div style={{ padding: "16px 20px 10px 22px", display: "flex", alignItems: "center", gap: 10 }}>
        {icon && (hasSvg ? (
          <span
            key={topGlow ? "glow" : "idle"}
            style={{
              display: "inline-flex",
              transition: "filter 0.3s ease",
              filter: topGlow ? "drop-shadow(0 0 10px rgba(10,132,255,0.7))" : "none",
              animation: topGlow ? "cardIconPop 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "none",
            }}
          >
            <AppIcon name={iconKey} size={30} mr={0} />
          </span>
        ) : (
          <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        ))}
        <span style={{ fontSize: 19, fontWeight: 800, color: st.tx, letterSpacing: -0.4, lineHeight: 1.15, flex: 1 }}>
          {title}
        </span>
        {headerRight && <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{headerRight}</div>}
      </div>
      <div style={{ padding: "0 20px 18px 22px" }}>{children}</div>
    </div>
  );
};
