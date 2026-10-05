"use client";
import { useState, useRef, useEffect, DragEvent } from "react";
import {
  X,
  Upload,
  FileCode2,
  Trash2,
  Check,
  Shapes,
  AlertCircle,
  Plus,
  RefreshCw,
  Code2,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui/button";
import { symbols as defaultSymbols } from "@/lib/brand-data";
import { BrandSymbol } from "./brand-visuals";
import {
  getCustomSymbols,
  saveCustomSymbol,
  deleteCustomSymbol,
  getHiddenSymbolIds,
  hideDefaultSymbol,
  restoreDefaultSymbols,
  processSvgString,
  syncAssetsWithServer,
  CustomSymbol,
} from "@/lib/custom-assets";

export function SvgUploaderModal({
  isOpen,
  onClose,
  onSelectSymbol,
  activeSymbolSvg,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol?: (symbol: CustomSymbol) => void;
  activeSymbolSvg?: string;
}) {
  const [symbolsList, setSymbolsList] = useState<CustomSymbol[]>([]);
  const [hiddenSymbolIds, setHiddenSymbolIds] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"monochrome" | "original">("monochrome");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "code">("file");

  // Code paste fields
  const [pastedCode, setPastedCode] = useState("");
  const [pastedName, setPastedName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSymbols = () => {
    setSymbolsList(getCustomSymbols());
    setHiddenSymbolIds(getHiddenSymbolIds());
  };

  useEffect(() => {
    if (isOpen) {
      loadSymbols();
      setErrorMsg(null);
      setSuccessMsg(null);
      // Fetch latest from server
      syncAssetsWithServer().then(() => loadSymbols());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof file.text === "function") {
        file.text().then(resolve).catch(() => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
          reader.readAsText(file);
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
        reader.readAsText(file);
      }
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const fileList = Array.from(files);
      let successCount = 0;
      let lastSaved: CustomSymbol | null = null;

      for (const file of fileList) {
        let text = "";
        try {
          text = await readFileAsText(file);
        } catch {
          setErrorMsg(`Não foi possível ler o conteúdo do arquivo "${file.name}".`);
          continue;
        }

        const isSvgFile =
          file.name.toLowerCase().endsWith(".svg") ||
          file.type === "image/svg+xml" ||
          text.includes("<svg") ||
          text.includes("<path");

        if (!isSvgFile) {
          setErrorMsg(`O arquivo "${file.name}" não parece ser um SVG válido.`);
          continue;
        }

        const { processed, valid, error } = processSvgString(text, colorMode);

        if (!valid || !processed) {
          setErrorMsg(error || `Erro ao processar o arquivo "${file.name}".`);
          continue;
        }

        const cleanName =
          file.name
            .replace(/\.svg$/i, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()) || "Símbolo Personalizado";

        const saved = saveCustomSymbol({
          name: cleanName,
          svg: processed,
          originalSvg: text,
          colorMode,
          fileName: file.name,
        });

        lastSaved = saved;
        successCount++;
      }

      loadSymbols();

      if (successCount > 0) {
        setSuccessMsg(
          successCount === 1
            ? "1 símbolo carregado com sucesso!"
            : `${successCount} símbolos carregados com sucesso!`
        );
        if (lastSaved && onSelectSymbol) {
          onSelectSymbol(lastSaved);
        }
      }
    } catch (err) {
      setErrorMsg("Ocorreu um erro inesperado ao carregar os arquivos SVG.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSavePastedCode = () => {
    if (!pastedCode.trim()) {
      setErrorMsg("Cole o código SVG antes de salvar.");
      return;
    }

    const { processed, valid, error } = processSvgString(pastedCode, colorMode);
    if (!valid || !processed) {
      setErrorMsg(error || "O código colado não é um SVG válido.");
      return;
    }

    const saved = saveCustomSymbol({
      name: pastedName.trim() || `Símbolo ${symbolsList.length + 1}`,
      svg: processed,
      originalSvg: pastedCode,
      colorMode,
      fileName: "codigo-colado.svg",
    });

    setPastedCode("");
    setPastedName("");
    setSuccessMsg("Símbolo adicionado com sucesso!");
    loadSymbols();

    if (onSelectSymbol) {
      onSelectSymbol(saved);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteCustom = (id: string, name: string) => {
    if (confirm(`Deseja excluir o símbolo "${name}"?`)) {
      deleteCustomSymbol(id);
      loadSymbols();
      setSuccessMsg(`Símbolo "${name}" excluído com sucesso.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDeleteDefault = (id: number, name: string) => {
    if (confirm(`Deseja ocultar/excluir o símbolo padrão "${name}"?`)) {
      hideDefaultSymbol(id);
      loadSymbols();
      setSuccessMsg(`Símbolo padrão "${name}" ocultado da biblioteca.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleRestoreDefaults = () => {
    restoreDefaultSymbols();
    loadSymbols();
    setSuccessMsg("Símbolos padrão restaurados com sucesso.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSyncNow = async () => {
    setLoading(true);
    await syncAssetsWithServer();
    loadSymbols();
    setLoading(false);
    setSuccessMsg("Símbolos sincronizados com o servidor.");
  };

  const visibleDefaultSymbols = defaultSymbols.filter(
    (s) => !hiddenSymbolIds.includes(s.id)
  );

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className="custom-modal-dialog svg-uploader-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="svg-uploader-title"
      >
        <header className="custom-modal-header">
          <div>
            <div className="custom-modal-badge">
              <Shapes size={13} />
              <span>SÍMBOLOS & MARCAS</span>
            </div>
            <h2 id="svg-uploader-title">Enviar e Gerenciar Símbolos SVG</h2>
            <p>Envie novos arquivos SVG, use qualquer um nos mockups ou exclua qualquer SVG da biblioteca.</p>
          </div>
          <button className="custom-modal-close" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </header>

        <div className="custom-modal-body svg-uploader-body">
          {/* Method tabs: File upload vs Paste code */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              className={`preset-chip ${activeTab === "file" ? "active" : ""}`}
              onClick={() => setActiveTab("file")}
              style={{ padding: "6px 14px", fontSize: "11px" }}
            >
              <Upload size={14} />
              <span>Arquivo (.svg)</span>
            </button>
            <button
              type="button"
              className={`preset-chip ${activeTab === "code" ? "active" : ""}`}
              onClick={() => setActiveTab("code")}
              style={{ padding: "6px 14px", fontSize: "11px" }}
            >
              <Code2 size={14} />
              <span>Colar Código SVG Direto</span>
            </button>
          </div>

          {/* Color adaptation mode */}
          <div className="svg-mode-selector">
            <span className="section-micro-label">MODO DE ADAPTAÇÃO DAS CORES:</span>
            <div className="svg-mode-toggle">
              <button
                type="button"
                className={`svg-mode-btn ${colorMode === "monochrome" ? "active" : ""}`}
                onClick={() => setColorMode("monochrome")}
              >
                <b>Monocromático da Marca (Recomendado)</b>
                <small>Herda a cor primária, secundária ou acento em cada aplicação e mockup.</small>
              </button>
              <button
                type="button"
                className={`svg-mode-btn ${colorMode === "original" ? "active" : ""}`}
                onClick={() => setColorMode("original")}
              >
                <b>Cores Originais do SVG</b>
                <small>Preserva preenchimentos, degradês e cores nativas do arquivo original.</small>
              </button>
            </div>
          </div>

          {activeTab === "file" ? (
            /* Drag & Drop Upload Zone */
            <div
              className={`svg-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".svg,.SVG,image/svg+xml,text/xml,application/xml,image/*,*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="dropzone-icon">
                <Upload size={28} />
              </div>
              <div className="dropzone-content">
                <strong>Arraste seus arquivos SVG aqui ou clique para selecionar</strong>
                <p>Compatível com qualquer navegador (Chrome, Edge, Safari, Firefox). Suporta múltiplos arquivos.</p>
              </div>
              <span className="dropzone-badge">SVG VETORIAL</span>
            </div>
          ) : (
            /* Paste raw SVG code */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="section-micro-label">NOME DO SÍMBOLO:</span>
                <input
                  type="text"
                  placeholder="Ex: Meu Logo Nexo"
                  value={pastedName}
                  onChange={(e) => setPastedName(e.target.value)}
                  className="custom-text-input"
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="section-micro-label">CÓDIGO SVG (&lt;svg&gt;...&lt;/svg&gt;):</span>
                <textarea
                  rows={5}
                  placeholder="Cole aqui o código SVG copiado do Figma, Illustrator ou web..."
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d4dbc9",
                    resize: "vertical",
                  }}
                />
              </label>

              <Button onClick={handleSavePastedCode} style={{ alignSelf: "flex-start", gap: "6px" }}>
                <Plus size={14} />
                <span>Salvar Símbolo Colado</span>
              </Button>
            </div>
          )}

          {errorMsg && (
            <div className="svg-error-alert">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#15803d",
                borderRadius: "8px",
                fontSize: "11px",
                marginTop: "12px",
              }}
            >
              <Check size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Uploaded Custom Symbols Library */}
          <div className="custom-symbols-list-section">
            <div className="symbols-list-heading">
              <span className="section-micro-label">
                MEUS SÍMBOLOS PERSONALIZADOS ({symbolsList.length}):
              </span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    color: "#556248",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Sincronizar arquivos com outros navegadores"
                >
                  <RefreshCw size={11} className={loading ? "spin" : ""} />
                  <span>Sincronizar</span>
                </button>
                {symbolsList.length > 0 && (
                  <button
                    type="button"
                    className="quick-clear-btn"
                    onClick={() => {
                      if (confirm("Deseja excluir TODOS os seus símbolos enviados?")) {
                        symbolsList.forEach((s) => deleteCustomSymbol(s.id));
                        loadSymbols();
                      }
                    }}
                  >
                    Excluir todos
                  </button>
                )}
              </div>
            </div>

            {symbolsList.length === 0 ? (
              <div className="empty-symbols-placeholder">
                <FileCode2 size={36} />
                <p>Nenhum símbolo personalizado carregado ainda.</p>
                <small>Envie um arquivo .svg acima ou cole o código para usar nos mockups.</small>
              </div>
            ) : (
              <div className="custom-symbols-grid">
                {symbolsList.map((item) => {
                  const isSelected = activeSymbolSvg === item.svg;
                  return (
                    <div
                      key={item.id}
                      className={`custom-symbol-card ${isSelected ? "selected" : ""}`}
                    >
                      <div
                        className="symbol-thumbnail-wrap"
                        dangerouslySetInnerHTML={{ __html: item.svg }}
                      />
                      <div className="symbol-card-info">
                        <b title={item.name}>{item.name}</b>
                        <small>{item.colorMode === "monochrome" ? "Monocromático" : "Cores nativas"}</small>
                      </div>
                      <div className="symbol-card-actions">
                        <button
                          type="button"
                          className={`select-symbol-btn ${isSelected ? "active" : ""}`}
                          onClick={() => {
                            if (onSelectSymbol) onSelectSymbol(item);
                            onClose();
                          }}
                          title="Usar este símbolo nos mockups"
                        >
                          {isSelected ? <Check size={13} /> : <Plus size={13} />}
                          <span>{isSelected ? "Em uso" : "Usar"}</span>
                        </button>
                        <button
                          type="button"
                          className="delete-symbol-btn"
                          onClick={() => handleDeleteCustom(item.id, item.name)}
                          title="Excluir este SVG permanentemente"
                          aria-label="Excluir símbolo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Built-in Symbols Management */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px dashed #d5ded0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <span className="section-micro-label">
                  SÍMBOLOS PADRÃO DO SISTEMA ({visibleDefaultSymbols.length} VISÍVEIS):
                </span>
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#6f7d66" }}>
                  Você também pode excluir/ocultar qualquer símbolo padrão do sistema clicando no ícone de lixeira.
                </p>
              </div>
              {hiddenSymbolIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    color: "#4b6f34",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <RotateCcw size={11} />
                  <span>Restaurar padrões ({hiddenSymbolIds.length})</span>
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
              {defaultSymbols.map((item) => {
                const isHidden = hiddenSymbolIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: isHidden ? "#f5f6f3" : "#ffffff",
                      border: "1px solid #dce2d6",
                      borderRadius: "8px",
                      padding: "8px",
                      opacity: isHidden ? 0.45 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BrandSymbol id={item.id} size={20} />
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#2d3824", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </span>
                    </div>

                    {isHidden ? (
                      <span style={{ fontSize: "8px", color: "#8a9683" }}>Oculto</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteDefault(item.id, item.name)}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          color: "#b91c1c",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "3px 5px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={`Excluir/ocultar símbolo "${item.name}"`}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="custom-modal-footer">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </footer>
      </div>
    </div>
  );
}
