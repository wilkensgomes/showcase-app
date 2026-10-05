"use client";
import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Sparkles,
  Check,
  RotateCcw,
  Palette,
  AlertCircle,
  Copy,
  Trash2,
  FolderHeart,
  Eye,
  Edit3,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Colors, palettes as defaultPalettes } from "@/lib/brand-data";
import {
  getCustomPalettes,
  saveCustomPalette,
  deleteCustomPalette,
  getHiddenPaletteIds,
  hideDefaultPalette,
  restoreDefaultPalettes,
  generateHarmoniousColors,
  getContrastRatio,
  PALETTE_PRESETS,
  syncAssetsWithServer,
  CustomPalette,
} from "@/lib/custom-assets";

export function PaletteBuilderModal({
  isOpen,
  onClose,
  onSelectPalette,
  initialColors,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPalette?: (palette: CustomPalette) => void;
  initialColors?: Colors;
}) {
  const [activeTab, setActiveTab] = useState<"builder" | "saved">("builder");
  const [name, setName] = useState("Minha Nova Paleta");
  const [description, setDescription] = useState("Paleta personalizada para a marca.");
  const [colors, setColors] = useState<Colors>(
    initialColors || {
      primary: "#234E52",
      secondary: "#D9CDBA",
      accent: "#D9806C",
      background: "#F7F5EF",
      text: "#252A29",
    }
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [customPalettesList, setCustomPalettesList] = useState<CustomPalette[]>([]);
  const [hiddenPaletteIds, setHiddenPaletteIds] = useState<string[]>([]);

  const loadPalettes = () => {
    setCustomPalettesList(getCustomPalettes());
    setHiddenPaletteIds(getHiddenPaletteIds());
  };

  useEffect(() => {
    if (isOpen) {
      loadPalettes();
      setSaveFeedback(null);
      syncAssetsWithServer().then(() => loadPalettes());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateColor = (key: keyof Colors, value: string) => {
    let hex = value.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    setColors((prev) => ({ ...prev, [key]: hex }));
  };

  const handleSmartGenerate = () => {
    const generated = generateHarmoniousColors(colors.primary);
    setColors(generated);
    setActivePreset(null);
  };

  const handleApplyPreset = (preset: (typeof PALETTE_PRESETS)[0]) => {
    setColors({ ...preset.colors });
    setName(preset.name);
    setDescription(preset.description);
    setActivePreset(preset.name);
  };

  const contrastTextBg = getContrastRatio(colors.text, colors.background);
  const contrastPrimaryBg = getContrastRatio(colors.primary, colors.background);

  // 1. Save and keep in modal (allow saving unlimited custom palettes)
  const handleSaveOnly = () => {
    if (!name.trim()) return;
    const saved = saveCustomPalette({
      name: name.trim(),
      description: description.trim(),
      colors,
    });
    loadPalettes();
    setSaveFeedback(`Paleta "${saved.name}" salva com sucesso! Você pode salvar quantas quiser.`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // 2. Save and apply immediately
  const handleSaveAndApply = () => {
    if (!name.trim()) return;
    const saved = saveCustomPalette({
      name: name.trim(),
      description: description.trim(),
      colors,
    });
    if (onSelectPalette) {
      onSelectPalette(saved);
    }
    onClose();
  };

  // 3. Delete any custom palette
  const handleDeleteCustomPalette = (id: string, paletteName: string) => {
    if (confirm(`Deseja realmente excluir a paleta "${paletteName}"?`)) {
      deleteCustomPalette(id);
      loadPalettes();
    }
  };

  // 4. Hide/delete default palette
  const handleDeleteDefaultPalette = (id: string, paletteName: string) => {
    if (confirm(`Deseja ocultar a paleta padrão "${paletteName}"?`)) {
      hideDefaultPalette(id);
      loadPalettes();
    }
  };

  // 5. Restore default palettes
  const handleRestoreDefaults = () => {
    restoreDefaultPalettes();
    loadPalettes();
  };

  // 6. Load a saved palette into the editor
  const handleLoadIntoEditor = (p: CustomPalette) => {
    setColors({ ...p.colors });
    setName(p.name);
    setDescription(p.description || "");
    setActiveTab("builder");
  };

  const colorFields: Array<{
    key: keyof Colors;
    label: string;
    description: string;
    role: string;
  }> = [
    {
      key: "primary",
      label: "Cor Primária",
      description: "Identidade forte, botões principais, destaques estruturais.",
      role: "Base principal da marca",
    },
    {
      key: "secondary",
      label: "Cor Secundária",
      description: "Apoio visual, cartões, tags, fundos secundários e equilíbrio.",
      role: "Harmonia e contraste suave",
    },
    {
      key: "accent",
      label: "Cor de Acento",
      description: "Pontos de luz, chamadas para ação, vouchers e grafismos.",
      role: "Energia e dinamismo",
    },
    {
      key: "background",
      label: "Fundo (Background)",
      description: "Superfície dos layouts, cartões e páginas limpas.",
      role: "Luz e espaço de respiro",
    },
    {
      key: "text",
      label: "Texto & Tipografia",
      description: "Títulos, parágrafos e microtextos com máxima legibilidade.",
      role: "Legibilidade e contraste",
    },
  ];

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className="custom-modal-dialog palette-builder-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-builder-title"
      >
        <header className="custom-modal-header">
          <div>
            <div className="custom-modal-badge">
              <Palette size={13} />
              <span>ESTÚDIO DE CORES</span>
            </div>
            <h2 id="palette-builder-title">Gerenciar & Criar Paletas de Cores</h2>
            <p>Crie e salve quantas paletas personalizadas desejar, e exclua qualquer uma a qualquer momento.</p>
          </div>
          <button className="custom-modal-close" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </header>

        {/* Tab switch between Editor and Saved Palettes */}
        <div style={{ display: "flex", gap: "8px", padding: "14px 26px 0", borderBottom: "1px solid #e6ecde", background: "#fbfcf9" }}>
          <button
            type="button"
            className={`preset-chip ${activeTab === "builder" ? "active" : ""}`}
            onClick={() => setActiveTab("builder")}
            style={{ padding: "8px 16px", fontSize: "11px", borderRadius: "6px 6px 0 0", borderBottom: "none" }}
          >
            <Palette size={14} />
            <span>🎨 Criar Nova Paleta</span>
          </button>
          <button
            type="button"
            className={`preset-chip ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
            style={{ padding: "8px 16px", fontSize: "11px", borderRadius: "6px 6px 0 0", borderBottom: "none", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FolderHeart size={14} />
            <span>Minhas Paletas Salvas</span>
            <span
              style={{
                background: activeTab === "saved" ? "#445932" : "#dde3d3",
                color: activeTab === "saved" ? "#ffffff" : "#445932",
                padding: "1px 6px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {customPalettesList.length}
            </span>
          </button>
        </div>

        {saveFeedback && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 26px",
              background: "#dcfce7",
              borderBottom: "1px solid #86efac",
              color: "#15803d",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <Check size={16} />
            <span>{saveFeedback}</span>
          </div>
        )}

        {activeTab === "builder" ? (
          <div className="custom-modal-body palette-builder-body">
            {/* Left Column: Color Controls */}
            <div className="palette-builder-left">
              <div className="palette-meta-fields">
                <label>
                  <span>Nome da Paleta</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Nexo Confiança Azul"
                    maxLength={40}
                    className="custom-text-input"
                  />
                </label>
                <label>
                  <span>Descrição ou Sensação</span>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Moderna, acolhedora e tecnológica"
                    maxLength={80}
                    className="custom-text-input"
                  />
                </label>
              </div>

              {/* Smart generation & presets bar */}
              <div className="palette-quick-actions">
                <button
                  type="button"
                  className="smart-generate-btn"
                  onClick={handleSmartGenerate}
                  title="Gera automaticamente tons harmônicos a partir da sua cor primária"
                >
                  <Sparkles size={14} />
                  <span>Gerar Harmonia Inteligente</span>
                </button>
                <button
                  type="button"
                  className="reset-colors-btn"
                  onClick={() =>
                    setColors(
                      initialColors || {
                        primary: "#234E52",
                        secondary: "#D9CDBA",
                        accent: "#D9806C",
                        background: "#F7F5EF",
                        text: "#252A29",
                      }
                    )
                  }
                  title="Restaurar padrão"
                >
                  <RotateCcw size={13} />
                  <span>Restaurar</span>
                </button>
              </div>

              {/* Presets Gallery */}
              <div className="palette-presets-container">
                <span className="section-micro-label">PRESETS DE INSPIRAÇÃO:</span>
                <div className="palette-presets-chips">
                  {PALETTE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`preset-chip ${activePreset === preset.name ? "active" : ""}`}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <div className="preset-chip-colors">
                        {Object.values(preset.colors).slice(0, 3).map((hex, i) => (
                          <span key={i} style={{ backgroundColor: hex }} />
                        ))}
                      </div>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5 Color Inputs */}
              <div className="color-inputs-list">
                <span className="section-micro-label">OS 5 TONS DO SISTEMA NEXO:</span>
                {colorFields.map(({ key, label, description, role }) => (
                  <div className="color-field-row" key={key}>
                    <div className="color-swatch-wrapper">
                      <input
                        type="color"
                        value={colors[key].length === 7 ? colors[key] : "#234e52"}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="color-picker-input"
                        aria-label={`Escolher ${label}`}
                      />
                      <div
                        className="color-swatch-display"
                        style={{ backgroundColor: colors[key] }}
                      />
                    </div>
                    <div className="color-field-info">
                      <div className="color-field-title">
                        <b>{label}</b>
                        <span className="color-role-tag">{role}</span>
                      </div>
                      <small>{description}</small>
                    </div>
                    <div className="color-hex-input-wrap">
                      <span className="hex-prefix">#</span>
                      <input
                        type="text"
                        value={colors[key].replace("#", "")}
                        maxLength={6}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="color-hex-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Live Specimen & Contrast Stats */}
            <div className="palette-builder-right">
              <span className="section-micro-label">PREVIEW EM TEMPO REAL:</span>

              {/* Live Card Specimen */}
              <div
                className="palette-live-specimen"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.secondary,
                }}
              >
                <div className="specimen-header">
                  <div className="specimen-brand-badge" style={{ backgroundColor: colors.primary, color: colors.background }}>
                    <span>NEXO</span>
                  </div>
                  <span className="specimen-tag" style={{ backgroundColor: colors.secondary, color: colors.primary }}>
                    ACESSO ATIVO
                  </span>
                </div>

                <div className="specimen-content">
                  <small style={{ color: colors.text, opacity: 0.65 }}>SEU PASSAPORTE DIGITAL</small>
                  <h4 style={{ color: colors.primary }}>Conexões que abrem caminhos</h4>
                  <p style={{ color: colors.text, opacity: 0.8 }}>
                    Uma combinação equilibrada entre o tom institucional e o calor humano.
                  </p>
                </div>

                <div className="specimen-actions">
                  <button
                    type="button"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.background,
                    }}
                    className="specimen-primary-btn"
                  >
                    Explorar Benefícios
                  </button>
                  <span
                    style={{
                      backgroundColor: colors.accent,
                      color: "#FFFFFF",
                    }}
                    className="specimen-accent-badge"
                  >
                    Novo Acesso
                  </span>
                </div>
              </div>

              {/* Swatch Bar */}
              <div className="palette-swatch-bar">
                {Object.entries(colors).map(([key, hex]) => (
                  <div key={key} className="swatch-bar-item" style={{ backgroundColor: hex }}>
                    <span className="swatch-name">{key}</span>
                    <span className="swatch-hex">{hex}</span>
                  </div>
                ))}
              </div>

              {/* Contrast / Accessibility Checker */}
              <div className="contrast-checker-card">
                <span className="section-micro-label">INDICADORES DE ACESSIBILIDADE (WCAG):</span>
                <div className="contrast-grid">
                  <div className="contrast-item">
                    <div className="contrast-score">
                      <b>{contrastTextBg} : 1</b>
                      {contrastTextBg >= 4.5 ? (
                        <span className="badge-pass"><Check size={11} /> Passou AA</span>
                      ) : (
                        <span className="badge-warn"><AlertCircle size={11} /> Atenção</span>
                      )}
                    </div>
                    <small>Texto sobre Fundo</small>
                  </div>

                  <div className="contrast-item">
                    <div className="contrast-score">
                      <b>{contrastPrimaryBg} : 1</b>
                      {contrastPrimaryBg >= 3 ? (
                        <span className="badge-pass"><Check size={11} /> Passou AA</span>
                      ) : (
                        <span className="badge-warn"><AlertCircle size={11} /> Atenção</span>
                      )}
                    </div>
                    <small>Primária sobre Fundo</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SAVED PALETTES TAB */
          <div className="custom-modal-body" style={{ maxHeight: "65vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#222c1b" }}>
                  Minhas Paletas Personalizadas ({customPalettesList.length})
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6e7b64" }}>
                  Você pode salvar quantas paletas quiser. Clique em &quot;Excluir&quot; para apagar qualquer uma.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(`Nova Paleta ${customPalettesList.length + 1}`);
                  setActiveTab("builder");
                }}
                style={{ gap: "5px" }}
              >
                <Plus size={14} />
                <span>Criar Mais Uma</span>
              </Button>
            </div>

            {customPalettesList.length === 0 ? (
              <div className="empty-symbols-placeholder" style={{ padding: "40px 20px" }}>
                <Palette size={40} />
                <p>Nenhuma paleta personalizada salva ainda.</p>
                <small>Use a aba &quot;Criar Nova Paleta&quot; para montar suas cores e salvar quantas quiser.</small>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                {customPalettesList.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #dbe2d4",
                      borderRadius: "10px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Swatches preview */}
                    <div style={{ display: "flex", height: "30px", borderRadius: "6px", overflow: "hidden", border: "1px solid #d0d8c7" }}>
                      {Object.values(p.colors).map((hex, i) => (
                        <div
                          key={i}
                          title={hex}
                          style={{
                            flex: 1,
                            backgroundColor: hex,
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <b style={{ fontSize: "13px", display: "block", color: "#1f261a" }}>{p.name}</b>
                      {p.description && (
                        <small style={{ fontSize: "10px", color: "#6a7761", display: "block", marginTop: "2px" }}>
                          {p.description}
                        </small>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #edf1e8" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectPalette) onSelectPalette(p);
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          background: "#e8f2de",
                          color: "#31541c",
                          border: "1px solid #a8c495",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title="Aplicar paleta aos mockups"
                      >
                        <Check size={12} />
                        <span>Aplicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadIntoEditor(p)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px 8px",
                          background: "#f4f6f0",
                          color: "#48573d",
                          border: "1px solid #cbd4c3",
                          borderRadius: "6px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                        title="Carregar cores no editor"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPalette(p.id, p.name)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title="Excluir paleta permanentemente"
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Default Palettes Management */}
            <div style={{ marginTop: "28px", paddingTop: "18px", borderTop: "1px dashed #d5ded0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#333f2a" }}>
                    Paletas Padrão do Sistema ({defaultPalettes.filter((p) => !hiddenPaletteIds.includes(p.id)).length} visíveis)
                  </h4>
                  <small style={{ fontSize: "10px", color: "#74816c" }}>
                    Você também pode ocultar/excluir qualquer paleta padrão se quiser focar apenas nas suas.
                  </small>
                </div>
                {hiddenPaletteIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4b6f34",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Restaurar paletas padrão ocultas ({hiddenPaletteIds.length})
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                {defaultPalettes.map((p) => {
                  const isHidden = hiddenPaletteIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: isHidden ? "#f6f7f4" : "#ffffff",
                        border: "1px solid #dce2d6",
                        borderRadius: "8px",
                        padding: "10px",
                        opacity: isHidden ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <div style={{ display: "flex", width: "42px", height: "18px", borderRadius: "4px", overflow: "hidden" }}>
                          {Object.values(p.colors).slice(0, 3).map((hex, i) => (
                            <span key={i} style={{ flex: 1, backgroundColor: hex }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#283220", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name}
                        </span>
                      </div>

                      {isHidden ? (
                        <span style={{ fontSize: "9px", color: "#8a9783" }}>Oculta</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteDefaultPalette(p.id, p.name)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                          title="Ocultar esta paleta padrão"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <footer className="custom-modal-footer">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>

          {activeTab === "builder" && (
            <>
              <Button
                variant="outline"
                onClick={handleSaveOnly}
                style={{ gap: "6px", borderColor: "#7a9b60", color: "#2d4c1b" }}
                title="Salva na sua biblioteca sem fechar o modal (salve quantas quiser)"
              >
                <BookmarkCheck size={15} />
                <span>Salvar na Minha Coleção</span>
              </Button>

              <Button onClick={handleSaveAndApply} className="save-palette-submit-btn">
                <Plus size={15} />
                <span>Salvar e Aplicar</span>
              </Button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
