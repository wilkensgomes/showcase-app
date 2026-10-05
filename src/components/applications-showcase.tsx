"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Smartphone,
  CreditCard,
  LayoutTemplate,
  Ticket,
  Image,
  Layers,
  Shapes,
  Palette,
  Type,
  Plus,
  Check,
  RotateCcw,
  Copy,
  SlidersHorizontal,
  Maximize2,
  ScanLine,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Coffee,
  ShoppingBag,
  Share2,
  Trash2,
  X,
  BookmarkCheck,
  CloudUpload,
  Cloud,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { BrandSymbol, Wordmark } from "./brand-visuals";
import {
  symbols,
  palettes,
  typography,
  forms,
  defaultDirection,
  type Direction,
  type Colors,
} from "@/lib/brand-data";
import {
  getCustomPalettes,
  getCustomSymbols,
  saveCustomPalette,
  deleteCustomPalette,
  deleteCustomSymbol,
  deleteAnySymbol,
  deleteAnyPalette,
  getHiddenSymbolIds,
  hideDefaultSymbol,
  restoreDefaultSymbols,
  getHiddenPaletteIds,
  hideDefaultPalette,
  restoreDefaultPalettes,
  saveBrandChoices,
  getSavedBrandChoices,
  syncAssetsWithServer,
  subscribeToSupabaseRealtime,
  CUSTOM_ASSETS_CHANGED,
  CustomPalette,
  CustomSymbol,
} from "@/lib/custom-assets";
import { PaletteBuilderModal } from "./palette-builder-modal";
import { SvgUploaderModal } from "./svg-uploader-modal";

type MockupCategory =
  | "all"
  | "digital"
  | "cards"
  | "access"
  | "social"
  | "physical"
  | "guidelines";

type ViewMode = "gallery" | "focus" | "colors";

export function ApplicationsShowcase({
  initialDirection,
  onBack,
}: {
  initialDirection?: Direction;
  onBack?: () => void;
}) {
  const [direction, setDirection] = useState<Direction>({
    ...defaultDirection,
    ...(initialDirection || {}),
  });

  const [category, setCategory] = useState<MockupCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [focusedMockup, setFocusedMockup] = useState<string>("app");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [surfaceTheme, setSurfaceTheme] = useState<"neutral" | "light" | "dark" | "brand">("neutral");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Modals
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isSvgModalOpen, setIsSvgModalOpen] = useState(false);

  // Custom Assets
  const [customPalettesList, setCustomPalettesList] = useState<CustomPalette[]>([]);
  const [customSymbolsList, setCustomSymbolsList] = useState<CustomSymbol[]>([]);
  const [hiddenSymbolIds, setHiddenSymbolIds] = useState<number[]>([]);
  const [hiddenPaletteIds, setHiddenPaletteIds] = useState<string[]>([]);
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  // Catalog Modal/Popover States
  const [isSymbolsCatalogOpen, setIsSymbolsCatalogOpen] = useState(false);
  const [isPalettesCatalogOpen, setIsPalettesCatalogOpen] = useState(false);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [symbolFamilyFilter, setSymbolFamilyFilter] = useState<string>("all");
  const [paletteSearchQuery, setPaletteSearchQuery] = useState("");

  // Scroll Refs for horizontal button controls
  const symbolsScrollRef = useRef<HTMLDivElement>(null);
  const palettesScrollRef = useRef<HTMLDivElement>(null);

  const scrollSymbols = (offset: number) => {
    if (symbolsScrollRef.current) {
      symbolsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const scrollPalettes = (offset: number) => {
    if (palettesScrollRef.current) {
      palettesScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Close catalogs on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSymbolsCatalogOpen(false);
        setIsPalettesCatalogOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isRemoteUpdatingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "error">("synced");
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);

  // Sync custom assets and hidden items from storage
  const syncCustomAssets = () => {
    setCustomPalettesList(getCustomPalettes());
    setCustomSymbolsList(getCustomSymbols());
    setHiddenSymbolIds(getHiddenSymbolIds());
    setHiddenPaletteIds(getHiddenPaletteIds());
  };

  useEffect(() => {
    syncCustomAssets();
    const savedChoices = getSavedBrandChoices();
    if (savedChoices) {
      setDirection((prev) => ({
        ...prev,
        ...savedChoices,
      }));
    }

    // Sync initial state from Supabase passaporte-saude
    syncAssetsWithServer().then(() => {
      syncCustomAssets();
      const updatedChoices = getSavedBrandChoices();
      if (updatedChoices) {
        setDirection((prev) => ({
          ...prev,
          ...updatedChoices,
        }));
      }
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
    });

    // Subscribe to real-time events from Supabase passaporte-saude
    const unsubscribeRealtime = subscribeToSupabaseRealtime({
      onChoicesChanged: (remoteChoices) => {
        isRemoteUpdatingRef.current = true;
        setDirection((prev) => ({
          ...prev,
          ...remoteChoices,
        }));
        setQuickNotice("Alterações sincronizadas em tempo real via Supabase!");
        setTimeout(() => setQuickNotice(null), 3500);
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 200);
      },
      onPalettesChanged: () => {
        syncCustomAssets();
      },
      onSymbolsChanged: () => {
        syncCustomAssets();
      },
      onStatusChange: (status) => {
        setIsRealtimeActive(status === "SUBSCRIBED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR" ? status === "SUBSCRIBED" : true);
      },
    });

    const handleAssetsChange = () => syncCustomAssets();
    window.addEventListener(CUSTOM_ASSETS_CHANGED, handleAssetsChange);

    return () => {
      unsubscribeRealtime?.();
      window.removeEventListener(CUSTOM_ASSETS_CHANGED, handleAssetsChange);
    };
  }, []);

  // Auto-save: Salva automaticamente no Supabase passaporte-saude a cada alteração com debounce
  useEffect(() => {
    if (isInitialLoadRef.current || isRemoteUpdatingRef.current) {
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await saveBrandChoices(direction);
        setSaveStatus("synced");
      } catch (err) {
        console.error("Auto-save falhou no Supabase:", err);
        setSaveStatus("error");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [direction]);

  const handleQuickSaveCurrentPalette = () => {
    const newPal = saveCustomPalette({
      name: `Paleta Criada ${customPalettesList.length + 1}`,
      description: `Salva instantaneamente a partir das cores ativas`,
      colors: activeColors,
    });
    setDirection((prev) => ({
      ...prev,
      palette: newPal.id,
      colors: newPal.colors,
    }));
    syncCustomAssets();
    setQuickNotice(`Paleta "${newPal.name}" salva! Você pode salvar quantas quiser.`);
    setTimeout(() => setQuickNotice(null), 3500);
  };

  const handleDeletePalette = (id: string, name: string, isCustom: boolean) => {
    if (isCustom) {
      if (confirm(`Deseja realmente apagar a paleta personalizada "${name}"?`)) {
        deleteCustomPalette(id);
        if (direction.palette === id) {
          const remaining = customPalettesList.filter((item) => item.id !== id);
          if (remaining.length > 0) {
            setDirection((prev) => ({
              ...prev,
              palette: remaining[0].id,
              colors: remaining[0].colors,
            }));
          } else {
            setDirection((prev) => ({
              ...prev,
              palette: palettes[0].id,
              colors: undefined,
            }));
          }
        }
        syncCustomAssets();
        setQuickNotice(`Paleta "${name}" apagada com sucesso.`);
        setTimeout(() => setQuickNotice(null), 3000);
      }
    } else {
      if (confirm(`Deseja ocultar/apagar a paleta padrão "${name}"?`)) {
        hideDefaultPalette(id);
        if (direction.palette === id && !direction.colors) {
          const remaining = palettes.filter(
            (item) => item.id !== id && !hiddenPaletteIds.includes(item.id)
          );
          if (remaining.length > 0) {
            setDirection((prev) => ({ ...prev, palette: remaining[0].id, colors: undefined }));
          }
        }
        syncCustomAssets();
        setQuickNotice(`Paleta padrão "${name}" ocultada.`);
        setTimeout(() => setQuickNotice(null), 3000);
      }
    }
  };

  const setField = <K extends keyof Direction>(k: K, v: Direction[K]) =>
    setDirection((p) => ({ ...p, [k]: v }));

  // Resolved palette
  const activeCustomPalette = customPalettesList.find((p) => p.id === direction.palette);
  const activeSystemPalette = palettes.find((p) => p.id === direction.palette) || palettes[0];
  const activeColors: Colors = direction.colors || activeCustomPalette?.colors || activeSystemPalette.colors;
  const activeFont = typography.find((f) => f.id === direction.font) || typography[0];

  // Active Symbol & Palette metadata for clear visualization
  const activeSymbolObj = symbols.find((s) => s.id === direction.symbol);
  const activeSymbolName = direction.customSvg
    ? direction.customSvgName || "SVG Personalizado"
    : activeSymbolObj?.name || "Entre partes";
  const activeSymbolFamily = direction.customSvg
    ? "Personalizado"
    : activeSymbolObj?.family || "Encontro";

  const activePaletteName = activeCustomPalette
    ? activeCustomPalette.name
    : activeSystemPalette?.name || "Padrão";

  // Catalog computations
  const availableDefaultSymbols = symbols.filter((s) => !hiddenSymbolIds.includes(s.id));
  const symbolFamilies = Array.from(
    new Set(availableDefaultSymbols.map((s) => s.family).filter(Boolean))
  );

  const filteredSymbolsCatalog = availableDefaultSymbols.filter((s) => {
    const matchesFamily = symbolFamilyFilter === "all" || s.family === symbolFamilyFilter;
    const matchesQuery =
      symbolSearchQuery.trim() === "" ||
      s.name.toLowerCase().includes(symbolSearchQuery.toLowerCase()) ||
      s.family.toLowerCase().includes(symbolSearchQuery.toLowerCase());
    return matchesFamily && matchesQuery;
  });

  const filteredCustomSymbols = customSymbolsList.filter((s) => {
    const matchesFamily = symbolFamilyFilter === "all" || symbolFamilyFilter === "custom";
    const matchesQuery =
      symbolSearchQuery.trim() === "" ||
      s.name.toLowerCase().includes(symbolSearchQuery.toLowerCase());
    return matchesFamily && matchesQuery;
  });

  const availableDefaultPalettes = palettes.filter((p) => !hiddenPaletteIds.includes(p.id));
  const filteredPalettesCatalog = availableDefaultPalettes.filter((p) => {
    if (!paletteSearchQuery.trim()) return true;
    const q = paletteSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const filteredCustomPalettes = customPalettesList.filter((p) => {
    if (!paletteSearchQuery.trim()) return true;
    const q = paletteSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  });

  // CSS variables applied to all mockups
  const brandCssVars = {
    "--brand-primary": activeColors.primary,
    "--brand-secondary": activeColors.secondary,
    "--brand-accent": activeColors.accent,
    "--brand-bg": activeColors.background,
    "--brand-text": activeColors.text,
    "--brand-radius": `${direction.radius}px`,
    fontFamily: activeFont.font,
  } as React.CSSProperties;

  const copyCssTokens = () => {
    const css = `:root {
  --brand-primary: ${activeColors.primary};
  --brand-secondary: ${activeColors.secondary};
  --brand-accent: ${activeColors.accent};
  --brand-bg: ${activeColors.background};
  --brand-text: ${activeColors.text};
  --brand-radius: ${direction.radius}px;
  --brand-font: ${activeFont.font};
}`;
    navigator.clipboard.writeText(css);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 3000);
  };

  interface MockupItem {
    id: string;
    title: string;
    categories: MockupCategory[];
    badge: string;
  }

  const mockupsList: MockupItem[] = [
    { id: "app", title: "Aplicativo Nexo (iOS & Android)", categories: ["digital"], badge: "MOBILE APP EXPERIENCE" },
    { id: "card", title: "Cartão Nexo Pass (Frente & Verso)", categories: ["cards"], badge: "PHYSICAL & DIGITAL CARD" },
    { id: "stationery", title: "Papelaria & Identidade Corporativa", categories: ["cards"], badge: "CORPORATE STATIONERY" },
    { id: "voucher", title: "Voucher de Benefício Serrilhado", categories: ["access"], badge: "ACCESS TICKET & VOUCHER" },
    { id: "social", title: "Campanha no Instagram (Feed & Story)", categories: ["social"], badge: "EDITORIAL & SOCIAL MEDIA" },
    { id: "desktop", title: "Portal Web & Landing Page Desktop", categories: ["digital"], badge: "WEB PLATFORM & LANDING PAGE" },
    { id: "signage", title: "Sinalização na Rede Credenciada", categories: ["physical", "access"], badge: "PHYSICAL SIGNAGE & RETAIL" },
    { id: "merch", title: "Produtos & Merchandising da Marca", categories: ["physical"], badge: "BRANDED MERCHANDISE" },
    { id: "guidelines", title: "Guia Rápido de Diretrizes da Marca", categories: ["guidelines"], badge: "DESIGN SYSTEM & SPECIFICATIONS" },
  ];

  const visibleMockups = mockupsList.filter(
    (m) => category === "all" || m.categories.includes(category)
  );

  const currentMockupIndex = Math.max(
    0,
    visibleMockups.findIndex((m) => m.id === focusedMockup)
  );
  const activeMockupInfo =
    mockupsList.find((m) => m.id === focusedMockup) || mockupsList[0];

  const goToNextMockup = () => {
    if (visibleMockups.length === 0) return;
    const currentIdx = visibleMockups.findIndex((m) => m.id === focusedMockup);
    const nextIdx = (currentIdx + 1) % visibleMockups.length;
    setFocusedMockup(visibleMockups[nextIdx].id);
  };

  const goToPrevMockup = () => {
    if (visibleMockups.length === 0) return;
    const currentIdx = visibleMockups.findIndex((m) => m.id === focusedMockup);
    const prevIdx = (currentIdx - 1 + visibleMockups.length) % visibleMockups.length;
    setFocusedMockup(visibleMockups[prevIdx].id);
  };

  // Keyboard navigation for Focus Mode (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (viewMode !== "focus") return;
    const handleKeyNav = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextMockup();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevMockup();
      } else if (e.key === "Escape") {
        setViewMode("gallery");
      }
    };
    window.addEventListener("keydown", handleKeyNav);
    return () => window.removeEventListener("keydown", handleKeyNav);
  }, [viewMode, focusedMockup, visibleMockups]);

  // Adjust focused mockup if active category changes and mockup is not part of it
  useEffect(() => {
    if (viewMode === "focus") {
      const isVisible = visibleMockups.some((m) => m.id === focusedMockup);
      if (!isVisible && visibleMockups.length > 0) {
        setFocusedMockup(visibleMockups[0].id);
      }
    }
  }, [category, viewMode, visibleMockups, focusedMockup]);

  const isCardVisible = (id: string, allowedCategories: MockupCategory[]) => {
    if (viewMode === "focus") {
      return focusedMockup === id;
    }
    return category === "all" || allowedCategories.includes(category);
  };

  const categories = [
    { id: "all", label: "Todas as Aplicações", count: 9 },
    { id: "digital", label: "App & Digital", count: 2 },
    { id: "cards", label: "Cartão & Papelaria", count: 2 },
    { id: "access", label: "Voucher & Validação", count: 2 },
    { id: "social", label: "Social Media", count: 1 },
    { id: "physical", label: "Sinalização & Merch", count: 2 },
    { id: "guidelines", label: "Design System & Tokens", count: 1 },
  ];

  return (
    <div className={`showcase-studio surface-${surfaceTheme}`} style={brandCssVars}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS */}
      {/* ========================================================================= */}
      <header className="showcase-topbar">
        <div className="showcase-topbar-left">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "#dcfce7",
              color: "#166534",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isRealtimeActive ? "#22c55e" : "#eab308",
                boxShadow: isRealtimeActive ? "0 0 0 2px #bbf7d0" : "0 0 0 2px #fef08a",
              }}
            />
            <span>REAL-TIME {isRealtimeActive ? "ATIVO" : "CONECTANDO"}</span>
          </div>

          <div className="showcase-title-area">
            <span className="showcase-eyebrow">
              <Sparkles size={13} /> BRAND MOCKUP STUDIO
            </span>
            <h1>Showcase de Aplicações da Marca</h1>
          </div>
        </div>

        <div className="showcase-topbar-actions">
          {/* Indicador de Salvamento Automático & Supabase Real-Time */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 14px",
              borderRadius: "20px",
              background:
                saveStatus === "saving"
                  ? "rgba(234, 179, 8, 0.12)"
                  : saveStatus === "error"
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(34, 197, 94, 0.12)",
              border:
                saveStatus === "saving"
                  ? "1px solid rgba(234, 179, 8, 0.3)"
                  : saveStatus === "error"
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid rgba(34, 197, 94, 0.3)",
              color:
                saveStatus === "saving"
                  ? "#b45309"
                  : saveStatus === "error"
                    ? "#b91c1c"
                    : "#15803d",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.25s ease",
            }}
            title="Salvo automaticamente no Supabase passaporte-saude com sincronização em tempo real"
          >
            {saveStatus === "saving" ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertCircle size={13} />
                <span>Erro ao salvar</span>
              </>
            ) : (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 0 2px #bbf7d0",
                  }}
                />
                <Cloud size={13} />
                <span>Salvo em Tempo Real</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSvgModalOpen(true)}
            className="action-pill-btn"
          >
            <Shapes size={14} />
            <span>Gerenciar SVGs</span>
            {customSymbolsList.length > 0 && (
              <span className="pill-badge">{customSymbolsList.length}</span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPalettesCatalogOpen(true);
              setIsSymbolsCatalogOpen(false);
            }}
            className="action-pill-btn catalog-nav-btn"
            title="Abrir o Catálogo Completo de Paletas de Cores"
          >
            <LayoutGrid size={14} />
            <span>Catálogo</span>
            <span className="catalog-pill-counter">
              {customPalettesList.length + availableDefaultPalettes.length}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaletteModalOpen(true)}
            className="action-pill-btn"
          >
            <Palette size={14} />
            <span>Paletas de Cores</span>
            {customPalettesList.length > 0 && (
              <span className="pill-badge">{customPalettesList.length}</span>
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={copyCssTokens}
            className="copy-tokens-btn"
          >
            {copiedTokens ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedTokens ? "Tokens Copiados!" : "Copiar Tokens CSS"}</span>
          </Button>
        </div>
      </header>

      {quickNotice && (
        <div className="showcase-toast-notice">
          <BookmarkCheck size={16} />
          <span>{quickNotice}</span>
          <button type="button" onClick={() => setQuickNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "2px" }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CONTROLS BAR (STICKY) */}
      {/* ========================================================================= */}
      <nav className="showcase-controls-bar">
        {/* LINHA SUPERIOR: 3 COLUNAS (1ª SÍMBOLOS, 2ª PALETA, 3ª AÇÕES/TOKENS) */}
        <div className="controls-row-top">
          {/* COLUNA 1: Símbolo Ativo Selector */}
          <div className="control-capsule control-capsule-prominent column-symbols">
            <div className="control-capsule-header">
              <span className="control-label">
                <Shapes size={13} /> SÍMBOLO:
              </span>
              <span className="control-active-badge" title={`Símbolo Ativo: ${activeSymbolName} (${activeSymbolFamily})`}>
                {activeSymbolName}
              </span>
              <button
                type="button"
                className={`catalog-trigger-btn ${isSymbolsCatalogOpen ? "active" : ""}`}
                onClick={() => {
                  setIsSymbolsCatalogOpen((prev) => !prev);
                  setIsPalettesCatalogOpen(false);
                }}
                title="Abrir catálogo completo de símbolos em grade"
              >
                <LayoutGrid size={12} />
                <span>Catálogo</span>
              </button>
            </div>

            <div className="control-scroll-container">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => scrollSymbols(-130)}
                title="Rolar símbolos para a esquerda"
                aria-label="Rolar símbolos para esquerda"
              >
                <ChevronLeft size={13} />
              </button>

              <div className="control-symbols-scroll" ref={symbolsScrollRef}>
                {/* Custom Uploaded Symbols first */}
                {customSymbolsList.map((s) => {
                  const isSelected = direction.customSvg === s.svg;
                  return (
                    <div
                      key={s.id}
                      className="symbol-chip-wrapper"
                      style={{ position: "relative", display: "inline-flex" }}
                    >
                      <button
                        className={`symbol-mini-btn custom-symbol-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setDirection((prev) => ({
                            ...prev,
                            customSvg: s.svg,
                            customSvgName: s.name,
                            customSvgMode: s.colorMode,
                          }));
                        }}
                        title={`Símbolo Personalizado: ${s.name}`}
                      >
                        <div
                          className="symbol-thumb-inner"
                          dangerouslySetInnerHTML={{ __html: s.svg }}
                        />
                        <span className="custom-indicator-dot" />
                      </button>
                      <button
                        type="button"
                        className="quick-item-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja excluir o símbolo personalizado "${s.name}"?`)) {
                            deleteCustomSymbol(s.id);
                            if (direction.customSvg === s.svg) {
                              const remaining = customSymbolsList.filter((item) => item.id !== s.id);
                              if (remaining.length > 0) {
                                setDirection((prev) => ({
                                  ...prev,
                                  customSvg: remaining[0].svg,
                                  customSvgName: remaining[0].name,
                                  customSvgMode: remaining[0].colorMode,
                                }));
                              } else {
                                const firstVisible = symbols.find((item) => !hiddenSymbolIds.includes(item.id));
                                setDirection((prev) => ({
                                  ...prev,
                                  customSvg: undefined,
                                  customSvgName: undefined,
                                  symbol: firstVisible?.id || 0,
                                }));
                              }
                            }
                            syncCustomAssets();
                          }
                        }}
                        title="Excluir este símbolo"
                        aria-label="Excluir símbolo"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}

                {/* Default Symbols (filtered) */}
                {symbols
                  .filter((s) => !hiddenSymbolIds.includes(s.id))
                  .map((s) => {
                    const isSelected = !direction.customSvg && direction.symbol === s.id;
                    return (
                      <div
                        key={s.id}
                        className="symbol-chip-wrapper"
                        style={{ position: "relative", display: "inline-flex" }}
                      >
                        <button
                          className={`symbol-mini-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              symbol: s.id,
                              customSvg: undefined,
                              customSvgName: undefined,
                            }));
                          }}
                          title={`${s.name} (${s.family})`}
                        >
                          <BrandSymbol id={s.id} size={24} />
                        </button>
                        <button
                          type="button"
                          className="quick-item-delete-btn default-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja ocultar/excluir o símbolo padrão "${s.name}"?`)) {
                              hideDefaultSymbol(s.id);
                              if (!direction.customSvg && direction.symbol === s.id) {
                                const remaining = symbols.filter(
                                  (item) => item.id !== s.id && !hiddenSymbolIds.includes(item.id)
                                );
                                if (remaining.length > 0) {
                                  setDirection((prev) => ({ ...prev, symbol: remaining[0].id }));
                                }
                              }
                              syncCustomAssets();
                            }
                          }}
                          title="Ocultar/excluir símbolo padrão"
                          aria-label="Ocultar símbolo padrão"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => scrollSymbols(130)}
                title="Rolar símbolos para a direita"
                aria-label="Rolar símbolos para direita"
              >
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                className="add-symbol-shortcut"
                onClick={() => setIsSvgModalOpen(true)}
                title="Enviar novo SVG da marca"
              >
                <Plus size={13} />
                <span>SVG</span>
              </button>
            </div>
          </div>

          {/* COLUNA 2: Paleta Ativa Selector */}
          <div className="control-capsule control-capsule-prominent column-palettes">
            <div className="control-capsule-header">
              <span className="control-label">
                <Palette size={13} /> PALETA:
              </span>
              <span className="control-active-badge" title={`Paleta Ativa: ${activePaletteName}`}>
                {activePaletteName}
              </span>
              <button
                type="button"
                className={`catalog-trigger-btn catalog-trigger-prominent ${isPalettesCatalogOpen ? "active" : ""}`}
                onClick={() => {
                  setIsPalettesCatalogOpen((prev) => !prev);
                  setIsSymbolsCatalogOpen(false);
                }}
                title="Abrir catálogo completo com prévias de todas as paletas"
              >
                <LayoutGrid size={13} />
                <span>Ver Catálogo</span>
              </button>
            </div>

            <div className="control-scroll-container">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => scrollPalettes(-160)}
                title="Rolar paletas para a esquerda"
                aria-label="Rolar paletas para esquerda"
              >
                <ChevronLeft size={13} />
              </button>

              <div className="control-palettes-scroll" ref={palettesScrollRef}>
                {/* Custom Created Palettes */}
                {customPalettesList.map((p) => {
                  const isSelected = direction.palette === p.id;
                  return (
                    <div
                      key={p.id}
                      className="palette-chip-wrapper"
                      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                    >
                      <button
                        className={`palette-mini-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setDirection((prev) => ({
                            ...prev,
                            palette: p.id,
                            colors: p.colors,
                          }));
                        }}
                        title={`Paleta Criada: ${p.name}`}
                      >
                        <div className="palette-swatch-bar">
                          <span style={{ backgroundColor: p.colors.primary }} />
                          <span style={{ backgroundColor: p.colors.secondary }} />
                          <span style={{ backgroundColor: p.colors.accent }} />
                          <span style={{ backgroundColor: p.colors.background }} />
                          <span style={{ backgroundColor: p.colors.text }} />
                        </div>
                        <span className="palette-label">{p.name}</span>
                        {isSelected && <Check size={12} className="check-icon" />}
                      </button>
                      <button
                        type="button"
                        className="quick-item-delete-btn palette-del-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePalette(p.id, p.name, true);
                        }}
                        title="Apagar esta paleta personalizada"
                        aria-label="Apagar paleta"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  );
                })}

                {/* Standard Palettes (filtered) */}
                {palettes
                  .filter((p) => !hiddenPaletteIds.includes(p.id))
                  .map((p) => {
                    const isSelected = direction.palette === p.id && !direction.colors;
                    return (
                      <div
                        key={p.id}
                        className="palette-chip-wrapper"
                        style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                      >
                        <button
                          className={`palette-mini-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              palette: p.id,
                              colors: undefined,
                            }));
                          }}
                          title={p.name}
                        >
                          <div className="palette-swatch-bar">
                            <span style={{ backgroundColor: p.colors.primary }} />
                            <span style={{ backgroundColor: p.colors.secondary }} />
                            <span style={{ backgroundColor: p.colors.accent }} />
                            <span style={{ backgroundColor: p.colors.background }} />
                            <span style={{ backgroundColor: p.colors.text }} />
                          </div>
                          <span className="palette-label">{p.name}</span>
                          {isSelected && <Check size={12} className="check-icon" />}
                        </button>
                        <button
                          type="button"
                          className="quick-item-delete-btn default-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePalette(p.id, p.name, false);
                          }}
                          title="Ocultar/apagar esta paleta padrão"
                          aria-label="Ocultar paleta"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => scrollPalettes(160)}
                title="Rolar paletas para a direita"
                aria-label="Rolar paletas para direita"
              >
                <ChevronRight size={13} />
              </button>

              {/* Quick Save and Add Buttons */}
              <div className="palette-control-actions">
                <button
                  type="button"
                  className="quick-save-palette-btn"
                  onClick={handleQuickSaveCurrentPalette}
                  title="Salvar paleta de cores atual na sua coleção (salve quantas quiser!)"
                >
                  <BookmarkCheck size={12} />
                  <span>Salvar Atual</span>
                </button>
                <button
                  type="button"
                  className="add-palette-shortcut"
                  onClick={() => setIsPaletteModalOpen(true)}
                  title="Criar nova paleta de cores personalizada"
                >
                  <Plus size={13} />
                  <span>Criar</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA 3: Ações Rápidas & Tokens da Marca */}
          <div className="control-capsule control-capsule-prominent column-actions">
            <div className="control-capsule-header">
              <span className="control-label">
                <Sparkles size={13} /> AÇÕES DA MARCA
              </span>
              <span className="control-active-badge">TOKENS ATIVOS</span>
            </div>
            <div className="column-actions-content">
              <div className="active-colors-mini-preview" title="Cores ativas da marca">
                <span style={{ backgroundColor: activeColors.primary }} title={`Primária: ${activeColors.primary}`} />
                <span style={{ backgroundColor: activeColors.secondary }} title={`Secundária: ${activeColors.secondary}`} />
                <span style={{ backgroundColor: activeColors.accent }} title={`Destaque: ${activeColors.accent}`} />
                <span style={{ backgroundColor: activeColors.background }} title={`Fundo: ${activeColors.background}`} />
                <span style={{ backgroundColor: activeColors.text }} title={`Texto: ${activeColors.text}`} />
              </div>
              <button
                type="button"
                className="column-action-btn copy-btn"
                onClick={copyCssTokens}
                title="Copiar variáveis CSS da marca"
              >
                {copiedTokens ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedTokens ? "Copiados!" : "Copiar Tokens"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* LINHA INFERIOR: O RESTO EM BAIXO (3 COLUNAS: 1ª WORDMARK, 2ª FONTE, 3ª RAIO & FUNDO) */}
        <div className="controls-row-bottom">
          {/* Coluna 1 de baixo: Wordmark */}
          <div className="control-capsule control-sub-capsule">
            <label className="inline-text-control">
              <span className="sub-control-label">
                <Type size={12} /> Wordmark:
              </span>
              <input
                type="text"
                value={direction.wordmark}
                onChange={(e) => setField("wordmark", e.target.value)}
                maxLength={24}
                className="wordmark-input"
                placeholder="Nome da marca"
              />
            </label>
          </div>

          {/* Coluna 2 de baixo: Fonte */}
          <div className="control-capsule control-sub-capsule">
            <label className="inline-text-control">
              <span className="sub-control-label">
                <SlidersHorizontal size={12} /> Fonte:
              </span>
              <select
                value={direction.font}
                onChange={(e) => setField("font", e.target.value)}
                className="font-select"
              >
                {typography.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Coluna 3 de baixo: Raio & Fundo */}
          <div className="control-capsule control-sub-capsule style-env-capsule">
            <div className="sub-control-group">
              <span className="sub-control-label">RAIO:</span>
              <div className="radius-selector-mini">
                {[0, 6, 12, 16, 24, 99].map((r) => (
                  <button
                    key={r}
                    className={`radius-btn ${direction.radius === r ? "selected" : ""}`}
                    onClick={() => setField("radius", r)}
                  >
                    {r === 99 ? "Pill" : `${r}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="sub-control-divider" />

            <div className="sub-control-group">
              <span className="sub-control-label">FUNDO:</span>
              <div className="surface-theme-toggle">
                <button
                  className={`surface-btn ${surfaceTheme === "neutral" ? "active" : ""}`}
                  onClick={() => setSurfaceTheme("neutral")}
                  title="Estúdio Neutro"
                >
                  Neutro
                </button>
                <button
                  className={`surface-btn ${surfaceTheme === "light" ? "active" : ""}`}
                  onClick={() => setSurfaceTheme("light")}
                  title="Claro"
                >
                  Claro
                </button>
                <button
                  className={`surface-btn ${surfaceTheme === "dark" ? "active" : ""}`}
                  onClick={() => setSurfaceTheme("dark")}
                  title="Escuro"
                >
                  Escuro
                </button>
                <button
                  className={`surface-btn ${surfaceTheme === "brand" ? "active" : ""}`}
                  onClick={() => setSurfaceTheme("brand")}
                  title="Fundo da Marca"
                >
                  Marca
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2.1 POPUPS / MODAIS DE CATÁLOGO COMPLETO DE SÍMBOLOS E PALETAS           */}
      {/* ========================================================================= */}
      {/* Catálogo Completo de Símbolos */}
      {isSymbolsCatalogOpen && (
        <div
          className="catalog-popover-overlay"
          onClick={() => setIsSymbolsCatalogOpen(false)}
        >
          <div
            className="catalog-popover-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="catalog-popover-header">
              <div className="catalog-popover-title-group">
                <div className="catalog-icon-badge">
                  <Shapes size={18} />
                </div>
                <div>
                  <h3>Catálogo de Símbolos & Ícones</h3>
                  <p>
                    Escolha o símbolo da marca. Clique em qualquer opção para atualizar todos os mockups instantaneamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="catalog-popover-close-btn"
                onClick={() => setIsSymbolsCatalogOpen(false)}
                title="Fechar catálogo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Barra de Pesquisa e Filtros */}
            <div className="catalog-toolbar">
              <div className="catalog-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar símbolo por nome ou família..."
                  value={symbolSearchQuery}
                  onChange={(e) => setSymbolSearchQuery(e.target.value)}
                />
                {symbolSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSymbolSearchQuery("")}
                    className="clear-search-btn"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="catalog-filter-chips">
                <button
                  type="button"
                  className={`filter-chip ${symbolFamilyFilter === "all" ? "active" : ""}`}
                  onClick={() => setSymbolFamilyFilter("all")}
                >
                  Todos ({availableDefaultSymbols.length + customSymbolsList.length})
                </button>
                {symbolFamilies.map((fam) => (
                  <button
                    key={fam}
                    type="button"
                    className={`filter-chip ${symbolFamilyFilter === fam ? "active" : ""}`}
                    onClick={() => setSymbolFamilyFilter(fam)}
                  >
                    {fam}
                  </button>
                ))}
                {customSymbolsList.length > 0 && (
                  <button
                    type="button"
                    className={`filter-chip ${symbolFamilyFilter === "custom" ? "active" : ""}`}
                    onClick={() => setSymbolFamilyFilter("custom")}
                  >
                    Personalizados ({customSymbolsList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Grid de Ícones */}
            <div className="catalog-grid-area">
              {/* Símbolos Customizados */}
              {filteredCustomSymbols.length > 0 && (
                <div className="catalog-section">
                  <div className="catalog-section-title">
                    <span>Símbolos Personalizados (SVG)</span>
                    <span className="section-count">{filteredCustomSymbols.length}</span>
                  </div>
                  <div className="symbols-catalog-grid">
                    {filteredCustomSymbols.map((s) => {
                      const isSelected = direction.customSvg === s.svg;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`symbol-card-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              customSvg: s.svg,
                              customSvgName: s.name,
                              customSvgMode: s.colorMode,
                            }));
                          }}
                        >
                          <div
                            className="symbol-card-icon custom-svg-card"
                            dangerouslySetInnerHTML={{ __html: s.svg }}
                          />
                          <span className="symbol-card-name">{s.name}</span>
                          <span className="symbol-card-meta">Personalizado</span>
                          {isSelected && (
                            <div className="card-active-pill">
                              <Check size={11} /> Ativo
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Símbolos Padrão */}
              {filteredSymbolsCatalog.length > 0 && (
                <div className="catalog-section">
                  <div className="catalog-section-title">
                    <span>Símbolos Oficiais Nexo</span>
                    <span className="section-count">{filteredSymbolsCatalog.length}</span>
                  </div>
                  <div className="symbols-catalog-grid">
                    {filteredSymbolsCatalog.map((s) => {
                      const isSelected = !direction.customSvg && direction.symbol === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`symbol-card-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              symbol: s.id,
                              customSvg: undefined,
                              customSvgName: undefined,
                            }));
                          }}
                        >
                          <div className="symbol-card-icon">
                            <BrandSymbol id={s.id} size={38} />
                          </div>
                          <span className="symbol-card-name">{s.name}</span>
                          <span className="symbol-card-meta">{s.family}</span>
                          {isSelected && (
                            <div className="card-active-pill">
                              <Check size={11} /> Ativo
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredSymbolsCatalog.length === 0 && filteredCustomSymbols.length === 0 && (
                <div className="catalog-empty-state">
                  <Shapes size={32} />
                  <p>Nenhum símbolo encontrado para &ldquo;{symbolSearchQuery}&rdquo;.</p>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="catalog-popover-footer">
              <span className="footer-hint">
                Dica: Você também pode enviar seus próprios vetores SVG.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSymbolsCatalogOpen(false);
                  setIsSvgModalOpen(true);
                }}
                style={{ gap: "6px" }}
              >
                <Plus size={14} />
                <span>Enviar Novo SVG</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo Completo de Paletas de Cores */}
      {isPalettesCatalogOpen && (
        <div
          className="catalog-popover-overlay"
          onClick={() => setIsPalettesCatalogOpen(false)}
        >
          <div
            className="catalog-popover-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="catalog-popover-header">
              <div className="catalog-popover-title-group">
                <div className="catalog-icon-badge">
                  <Palette size={18} />
                </div>
                <div>
                  <h3>Catálogo de Paletas de Cores</h3>
                  <p>
                    Harmonias cromáticas desenhadas para a marca. Clique em qualquer paleta para visualizá-la imediatamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="catalog-popover-close-btn"
                onClick={() => setIsPalettesCatalogOpen(false)}
                title="Fechar catálogo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="catalog-toolbar">
              <div className="catalog-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar paleta por nome ou descrição..."
                  value={paletteSearchQuery}
                  onChange={(e) => setPaletteSearchQuery(e.target.value)}
                />
                {paletteSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPaletteSearchQuery("")}
                    className="clear-search-btn"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid de Paletas */}
            <div className="catalog-grid-area">
              {/* Paletas Personalizadas */}
              {filteredCustomPalettes.length > 0 && (
                <div className="catalog-section">
                  <div className="catalog-section-title">
                    <span>Paletas Criadas & Salvas</span>
                    <span className="section-count">{filteredCustomPalettes.length}</span>
                  </div>
                  <div className="palettes-catalog-grid">
                    {filteredCustomPalettes.map((p) => {
                      const isSelected = direction.palette === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`palette-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              palette: p.id,
                              colors: p.colors,
                            }));
                          }}
                        >
                          <div className="palette-card-swatches">
                            <span style={{ backgroundColor: p.colors.primary }} title={`Primária: ${p.colors.primary}`} />
                            <span style={{ backgroundColor: p.colors.secondary }} title={`Secundária: ${p.colors.secondary}`} />
                            <span style={{ backgroundColor: p.colors.accent }} title={`Destaque: ${p.colors.accent}`} />
                            <span style={{ backgroundColor: p.colors.background }} title={`Fundo: ${p.colors.background}`} />
                            <span style={{ backgroundColor: p.colors.text }} title={`Texto: ${p.colors.text}`} />
                          </div>

                          <div className="palette-card-body">
                            <div className="palette-card-header">
                              <h4 className="palette-card-name">{p.name}</h4>
                              <div className="palette-card-header-actions">
                                {isSelected ? (
                                  <span className="card-active-pill">
                                    <Check size={11} /> Ativa
                                  </span>
                                ) : (
                                  <span className="card-select-hint">Selecionar</span>
                                )}
                                <button
                                  type="button"
                                  className="palette-card-delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePalette(p.id, p.name, true);
                                  }}
                                  title={`Apagar paleta personalizada "${p.name}" permanentemente`}
                                  aria-label={`Apagar paleta ${p.name}`}
                                >
                                  <Trash2 size={12} />
                                  <span>Apagar</span>
                                </button>
                              </div>
                            </div>
                            <p className="palette-card-desc">{p.description || "Paleta personalizada criada pelo usuário."}</p>

                            <div className="palette-hex-tags">
                              <span className="hex-pill" style={{ borderColor: p.colors.primary }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.primary }} />
                                {p.colors.primary}
                              </span>
                              <span className="hex-pill" style={{ borderColor: p.colors.secondary }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.secondary }} />
                                {p.colors.secondary}
                              </span>
                              <span className="hex-pill" style={{ borderColor: p.colors.accent }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.accent }} />
                                {p.colors.accent}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Paletas Oficiais Padrão */}
              {filteredPalettesCatalog.length > 0 && (
                <div className="catalog-section">
                  <div className="catalog-section-title">
                    <span>Paletas Oficiais do Sistema</span>
                    <span className="section-count">{filteredPalettesCatalog.length}</span>
                  </div>
                  <div className="palettes-catalog-grid">
                    {filteredPalettesCatalog.map((p) => {
                      const isSelected = direction.palette === p.id && !direction.colors;
                      return (
                        <div
                          key={p.id}
                          className={`palette-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setDirection((prev) => ({
                              ...prev,
                              palette: p.id,
                              colors: undefined,
                            }));
                          }}
                        >
                          <div className="palette-card-swatches">
                            <span style={{ backgroundColor: p.colors.primary }} title={`Primária: ${p.colors.primary}`} />
                            <span style={{ backgroundColor: p.colors.secondary }} title={`Secundária: ${p.colors.secondary}`} />
                            <span style={{ backgroundColor: p.colors.accent }} title={`Destaque: ${p.colors.accent}`} />
                            <span style={{ backgroundColor: p.colors.background }} title={`Fundo: ${p.colors.background}`} />
                            <span style={{ backgroundColor: p.colors.text }} title={`Texto: ${p.colors.text}`} />
                          </div>

                          <div className="palette-card-body">
                            <div className="palette-card-header">
                              <h4 className="palette-card-name">{p.name}</h4>
                              <div className="palette-card-header-actions">
                                {isSelected ? (
                                  <span className="card-active-pill">
                                    <Check size={11} /> Ativa
                                  </span>
                                ) : (
                                  <span className="card-select-hint">Selecionar</span>
                                )}
                                <button
                                  type="button"
                                  className="palette-card-delete-btn default-palette-del"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePalette(p.id, p.name, false);
                                  }}
                                  title={`Ocultar/apagar paleta padrão "${p.name}"`}
                                  aria-label={`Ocultar paleta ${p.name}`}
                                >
                                  <Trash2 size={12} />
                                  <span>Apagar</span>
                                </button>
                              </div>
                            </div>
                            <p className="palette-card-desc">{p.description}</p>

                            <div className="palette-hex-tags">
                              <span className="hex-pill" style={{ borderColor: p.colors.primary }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.primary }} />
                                {p.colors.primary}
                              </span>
                              <span className="hex-pill" style={{ borderColor: p.colors.secondary }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.secondary }} />
                                {p.colors.secondary}
                              </span>
                              <span className="hex-pill" style={{ borderColor: p.colors.accent }}>
                                <span className="hex-dot" style={{ backgroundColor: p.colors.accent }} />
                                {p.colors.accent}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredPalettesCatalog.length === 0 && filteredCustomPalettes.length === 0 && (
                <div className="catalog-empty-state">
                  <Palette size={32} />
                  <p>Nenhuma paleta encontrada para &ldquo;{paletteSearchQuery}&rdquo;.</p>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="catalog-popover-footer">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickSaveCurrentPalette}
                  style={{ gap: "6px" }}
                >
                  <BookmarkCheck size={14} />
                  <span>Salvar Paleta Atual</span>
                </Button>
                {hiddenPaletteIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      restoreDefaultPalettes();
                      syncCustomAssets();
                      setQuickNotice("Paletas oficiais restauradas!");
                      setTimeout(() => setQuickNotice(null), 3000);
                    }}
                    style={{ gap: "6px", color: "#64748b" }}
                    title="Restaurar todas as paletas oficiais ocultadas"
                  >
                    <RotateCcw size={13} />
                    <span>Restaurar Padrões ({hiddenPaletteIds.length})</span>
                  </Button>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsPalettesCatalogOpen(false);
                  setIsPaletteModalOpen(true);
                }}
                style={{ gap: "6px" }}
              >
                <Plus size={14} />
                <span>Abrir Construtor de Paletas</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CATEGORY FILTER TABS & VIEW MODES */}
      {/* ========================================================================= */}
      <div className="showcase-filter-bar">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`category-tab ${category === c.id ? "active" : ""}`}
              onClick={() => setCategory(c.id as MockupCategory)}
            >
              <span>{c.label}</span>
              <span className="category-count">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="view-mode-tabs">
          <button
            className={`view-mode-btn ${viewMode === "gallery" ? "active" : ""}`}
            onClick={() => setViewMode("gallery")}
          >
            <Layers size={14} />
            <span>Grade Completa</span>
          </button>
          <button
            className={`view-mode-btn ${viewMode === "focus" ? "active" : ""}`}
            onClick={() => setViewMode("focus")}
          >
            <Maximize2 size={14} />
            <span>Modo Foco</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN MOCKUPS CONTAINER */}
      {/* ========================================================================= */}
      <main className={`showcase-main-area ${viewMode === "focus" ? "view-mode-focus" : ""}`}>
        {/* ========================================================================= */}
        {/* FOCUS MODE CONTROLLER / SPOTLIGHT BAR */}
        {/* ========================================================================= */}
        {viewMode === "focus" && (
          <div className="focus-mode-bar">
            <div className="focus-mode-bar-top">
              <div className="focus-info">
                <span className="focus-pill-tag">
                  <Maximize2 size={12} /> MODO FOCO ATIVO
                </span>
                <h2 className="focus-title">
                  {activeMockupInfo.title}
                </h2>
                <span className="focus-counter">
                  Aplicação {Math.max(1, currentMockupIndex + 1)} de {visibleMockups.length}
                </span>
              </div>

              <div className="focus-actions">
                <div className="focus-nav-arrows">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevMockup}
                    title="Aplicação anterior (Seta esquerda ←)"
                    className="focus-arrow-btn"
                  >
                    <ChevronLeft size={15} />
                    <span className="focus-arrow-label">Anterior</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMockup}
                    title="Próxima aplicação (Seta direita →)"
                    className="focus-arrow-btn"
                  >
                    <span className="focus-arrow-label">Próxima</span>
                    <ChevronRight size={15} />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("gallery")}
                  className="exit-focus-btn"
                  title="Sair do modo foco e ver todas as aplicações em grade (Esc)"
                >
                  <Layers size={14} />
                  <span>Voltar para Grade</span>
                </Button>
              </div>
            </div>

            {/* Quick Mockup Selector Pills */}
            <div className="focus-mockup-pills">
              {visibleMockups.map((m, idx) => {
                const isCurrent = m.id === focusedMockup;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`focus-mockup-pill ${isCurrent ? "active" : ""}`}
                    onClick={() => setFocusedMockup(m.id)}
                    title={`Focar em ${m.title}`}
                  >
                    <span className="pill-index">{idx + 1}</span>
                    <span className="pill-name">{m.title.split("(")[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 1: REALISTIC IPHONE 16 / SMARTPHONE APP */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("app", ["digital"]) && (
          <section className="showcase-card mockup-iphone-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">MOBILE APP EXPERIENCE</span>
                <h3>Aplicativo Nexo (iOS & Android)</h3>
                <p>Navegação principal, cartão de acesso interativo e benefícios em destaque.</p>
              </div>
              <div className="mockup-header-actions">
                <div className="mockup-meta">
                  <span>Display Super Retina · 460 ppi</span>
                </div>
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("app");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage iphone-stage">
              {/* iPhone Realistic Frame */}
              <div className="iphone-chassis">
                <div className="iphone-screen">
                  {/* Dynamic Island & Status Bar */}
                  <div className="iphone-notch-bar">
                    <span className="notch-time">9:41</span>
                    <div className="dynamic-island">
                      <span className="dynamic-sensor" />
                      <span className="dynamic-camera" />
                    </div>
                    <div className="notch-icons">
                      <span className="notch-signal">••••</span>
                      <span className="notch-wifi">5G</span>
                      <span className="notch-battery">▰</span>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="iphone-app-body">
                    {/* App Bar */}
                    <div className="app-top-nav">
                      <Wordmark direction={direction} size={24} />
                      <div className="app-user-avatar">
                        <span>MS</span>
                      </div>
                    </div>

                    {/* Greeting & Headline */}
                    <div className="app-hero-greeting">
                      <small>SEU DIA, COM MAIS ACESSO</small>
                      <h4>
                        Olá, Marina <span>↗</span>
                      </h4>
                      <p>O próximo benefício começa aqui.</p>
                    </div>

                    {/* Premium Nexo Pass Digital Card inside App */}
                    <div className="app-pass-card">
                      <div className="app-pass-top">
                        <span className="app-pass-badge">NEXO PASS</span>
                        <div className="app-pass-chip" />
                      </div>
                      <div className="app-pass-content">
                        <strong>
                          O mundo mais
                          <br />
                          perto de você.
                        </strong>
                        <span>Membro Titular · Acesso Completo</span>
                      </div>
                      <div className="app-pass-footer">
                        <span>•••• 4289</span>
                        <ArrowUpRight size={18} />
                      </div>
                      <div className="app-pass-watermark">
                        <BrandSymbol
                          id={direction.symbol}
                          customSvg={direction.customSvg}
                          customSvgMode={direction.customSvgMode}
                          size={110}
                        />
                      </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="app-quick-actions">
                      <div className="quick-action-item">
                        <div className="quick-icon-wrap">
                          <Sparkles size={16} />
                        </div>
                        <span>Consultas</span>
                      </div>
                      <div className="quick-action-item">
                        <div className="quick-icon-wrap">
                          <Ticket size={16} />
                        </div>
                        <span>Vouchers</span>
                      </div>
                      <div className="quick-action-item">
                        <div className="quick-icon-wrap">
                          <CreditCard size={16} />
                        </div>
                        <span>Cartão</span>
                      </div>
                      <div className="quick-action-item">
                        <div className="quick-icon-wrap">
                          <Plus size={16} />
                        </div>
                        <span>Mais</span>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="app-section-title">
                      <b>Benefícios Próximos</b>
                      <span>Ver todos</span>
                    </div>

                    <div className="app-benefit-item">
                      <div className="benefit-circle-icon">
                        <Sparkles size={16} />
                      </div>
                      <div className="benefit-item-text">
                        <b>Clínica & Bem-Estar</b>
                        <small>Desconto de até 40% na rede</small>
                      </div>
                      <ChevronRight size={14} className="benefit-arrow" />
                    </div>

                    <div className="app-benefit-item">
                      <div className="benefit-circle-icon">
                        <Check size={16} />
                      </div>
                      <div className="benefit-item-text">
                        <b>Exames Credenciados</b>
                        <small>Agendamento digital sem fila</small>
                      </div>
                      <ChevronRight size={14} className="benefit-arrow" />
                    </div>

                    {/* Primary Button */}
                    <button type="button" className="app-cta-button">
                      <span>Explorar Todos os Acessos</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  {/* iOS Bottom Navigation Bar */}
                  <div className="iphone-bottom-nav">
                    <div className="nav-tab active">
                      <Smartphone size={16} />
                      <span>Início</span>
                    </div>
                    <div className="nav-tab">
                      <Ticket size={16} />
                      <span>Vouchers</span>
                    </div>
                    <div className="nav-tab">
                      <CreditCard size={16} />
                      <span>Pass</span>
                    </div>
                    <div className="nav-tab">
                      <Layers size={16} />
                      <span>Perfil</span>
                    </div>
                  </div>

                  {/* Home Bar */}
                  <div className="iphone-home-indicator" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 2: CARTÃO NEXO PASS (FRENTE E VERSO 3D FLIP) */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("card", ["cards"]) && (
          <section className="showcase-card mockup-physical-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">PHYSICAL & DIGITAL CARD</span>
                <h3>Cartão Nexo Pass (Frente & Verso)</h3>
                <p>Acabamento fosco acetinado, chip EMV metálico, tarja magnética e validação instantânea.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("card");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
                <button
                  type="button"
                  className="flip-card-btn"
                  onClick={() => setCardFlipped(!cardFlipped)}
                >
                  <RotateCcw size={14} />
                  <span>Virar Cartão ({cardFlipped ? "Verso" : "Frente"})</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage cards-stage">
              <div className={`flip-card-container ${cardFlipped ? "is-flipped" : ""}`}>
                {/* CARD FRONT */}
                <div className="nexo-credit-card card-front">
                  <div className="card-glare" />
                  <div className="card-front-top">
                    <Wordmark direction={direction} size={28} />
                    <span className="card-tier-label">PLATINUM ACCESS</span>
                  </div>

                  <div className="card-chip-row">
                    <div className="emv-chip">
                      <span className="chip-line line-1" />
                      <span className="chip-line line-2" />
                    </div>
                    <div className="contactless-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                        <path d="M12 19a8.5 8.5 0 0 0 0-12" />
                        <path d="M15.5 21.5a12 12 0 0 0 0-17" />
                      </svg>
                    </div>
                  </div>

                  <div className="card-numbers">
                    <span>••••</span>
                    <span>••••</span>
                    <span>••••</span>
                    <b>4289</b>
                  </div>

                  <div className="card-front-bottom">
                    <div className="card-holder">
                      <small>TITULAR DO ACESSO</small>
                      <b>MARINA SILVA</b>
                    </div>
                    <div className="card-expiry">
                      <small>VALIDADE</small>
                      <b>08/29</b>
                    </div>
                  </div>

                  {/* Watermark brand symbol */}
                  <div className="card-watermark-symbol">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={240}
                    />
                  </div>
                </div>

                {/* CARD BACK */}
                <div className="nexo-credit-card card-back">
                  <div className="card-magstripe" />
                  <div className="card-back-body">
                    <div className="signature-panel">
                      <span className="signature-stripes" />
                      <span className="signature-cvv">842</span>
                    </div>

                    <div className="card-back-meta">
                      <div className="card-qr-section">
                        <QRCodeSVG
                          value="https://nexo.pass/validar/4289"
                          size={54}
                          bgColor="transparent"
                          fgColor={activeColors.background}
                        />
                        <div className="qr-caption">
                          <small>ACESSO DIGITAL</small>
                          <span>Validar em rede</span>
                        </div>
                      </div>

                      <div className="card-legal-text">
                        <p>
                          Este cartão é de uso pessoal e intransferível. Válido em toda a rede credenciada Nexo.
                          Central de atendimento: 0800 700 NEXO.
                        </p>
                      </div>
                    </div>

                    <div className="card-back-footer">
                      <Wordmark direction={direction} size={18} />
                      <span className="card-chip-brand">NEXO PASS NETWORK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 3: PAPELARIA & IDENTIDADE CORPORATIVA */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("stationery", ["cards"]) && (
          <section className="showcase-card mockup-stationery-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">CORPORATE STATIONERY</span>
                <h3>Papelaria Institucional & Crachá</h3>
                <p>Cartões de visita táteis, crachá de identificação e envelope corporativo.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("stationery");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage stationery-stage">
              {/* Business Cards Duo */}
              <div className="business-cards-pair">
                {/* Card Front */}
                <div className="bcard bcard-front">
                  <Wordmark direction={direction} size={30} />
                  <p className="bcard-tagline">Conexões que abrem possibilidades.</p>
                  <div className="bcard-watermark">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={100}
                    />
                  </div>
                </div>

                {/* Card Back */}
                <div className="bcard bcard-back">
                  <div className="bcard-person">
                    <b>Marina Silva</b>
                    <small>Diretoria de Expansão & Parcerias</small>
                  </div>
                  <div className="bcard-contacts">
                    <span>marina.silva@nexo.com.br</span>
                    <span>+55 11 98765-4321</span>
                    <span>São Paulo · SP</span>
                  </div>
                  <div className="bcard-footer">
                    <QRCodeSVG
                      value="https://nexo.com.br"
                      size={36}
                      fgColor={activeColors.primary}
                    />
                    <small>nexo.com.br</small>
                  </div>
                </div>
              </div>

              {/* Lanyard & ID Badge */}
              <div className="lanyard-badge-wrap">
                <div className="lanyard-strap" />
                <div className="lanyard-clip" />
                <div className="lanyard-badge">
                  <div className="badge-header">
                    <Wordmark direction={direction} size={20} />
                    <span className="badge-badge">ACESSO VIP</span>
                  </div>
                  <div className="badge-avatar-wrap">
                    <div className="badge-photo-placeholder">
                      <BrandSymbol
                        id={direction.symbol}
                        customSvg={direction.customSvg}
                        customSvgMode={direction.customSvgMode}
                        size={48}
                      />
                    </div>
                  </div>
                  <div className="badge-info">
                    <b>Marina Silva</b>
                    <span>Membro Nexo Pass</span>
                  </div>
                  <div className="badge-barcode">
                    <div className="barcode-lines" />
                    <small>ID: 8942-NEXO-2026</small>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 4: VOUCHER SERRILHADO COM QR CODE */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("voucher", ["access"]) && (
          <section className="showcase-card mockup-voucher-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">ACCESS TICKET & VOUCHER</span>
                <h3>Voucher de Benefício Serrilhado</h3>
                <p>Cupom de acesso digital ou impresso com QR code de resgate e picote lateral.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("voucher");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage voucher-stage">
              <div className="scalloped-voucher">
                <div className="voucher-left-stub">
                  <Wordmark direction={direction} size={26} />
                  <span className="voucher-highlight-tag">SEU ACESSO ESTÁ GARANTIDO</span>
                  <h3>
                    Uma nova
                    <br />
                    possibilidade.
                  </h3>
                  <p>Apresente este voucher na rede parceira para usufruir do seu benefício.</p>

                  <div className="voucher-details-grid">
                    <div>
                      <small>BENEFICIÁRIA</small>
                      <b>Marina Silva</b>
                    </div>
                    <div>
                      <small>VALIDADE</small>
                      <b>31 DEZ 2026</b>
                    </div>
                    <div>
                      <small>REDE</small>
                      <b>Saúde & Cuidados</b>
                    </div>
                  </div>
                </div>

                <div className="voucher-divider-line">
                  <span className="scallop top" />
                  <span className="scallop bottom" />
                </div>

                <div className="voucher-right-stub">
                  <div className="voucher-amount-box">
                    <small>VALOR DO ACESSO</small>
                    <b>R$ 150</b>
                    <span>Desconto direto</span>
                  </div>

                  <div className="voucher-qr-box">
                    <QRCodeSVG
                      value="https://nexo.com.br/validar/voucher/8942"
                      size={90}
                      fgColor={activeColors.primary}
                    />
                    <small>CÓDIGO: NEXO-8942</small>
                  </div>

                  <footer className="voucher-stub-footer">
                    <ScanLine size={14} />
                    <span>LEITURA ÓPTICA</span>
                  </footer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 5: SOCIAL MEDIA & INSTAGRAM SUITE */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("social", ["social"]) && (
          <section className="showcase-card mockup-social-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">EDITORIAL & SOCIAL MEDIA</span>
                <h3>Campanha no Instagram (Feed 1:1 & Story 9:16)</h3>
                <p>Presença digital vibrante, tipografia expressiva e grafismos geométricos.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("social");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage social-stage">
              {/* Instagram Feed Post (1:1) */}
              <div className="insta-post-frame">
                <div className="insta-post-topbar">
                  <div className="insta-profile-thumb">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={20}
                    />
                  </div>
                  <div className="insta-profile-name">
                    <b>nexo.oficial</b>
                    <small>Publicação patrocinada</small>
                  </div>
                  <div className="insta-dots">•••</div>
                </div>

                <div className="insta-artboard">
                  <Wordmark direction={direction} size={28} />
                  <small className="insta-eyebrow">MENOS DISTÂNCIA. MAIS POSSIBILIDADES.</small>
                  <h3>
                    O que importa
                    <br />
                    está mais
                    <br />
                    <em>perto.</em>
                  </h3>

                  <div className="insta-giant-symbol">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={200}
                    />
                  </div>

                  <footer className="insta-artboard-footer">
                    <span>Acesso que conecta.</span>
                    <ArrowUpRight size={22} />
                  </footer>
                </div>

                <div className="insta-post-actions">
                  <div className="action-icons">
                    <span>♥ 3.420</span>
                    <span>💬 128</span>
                    <span>↗ Compartilhar</span>
                  </div>
                </div>
              </div>

              {/* Instagram Story (9:16) */}
              <div className="insta-story-frame">
                <div className="story-progress-bar">
                  <span className="bar active" />
                  <span className="bar" />
                  <span className="bar" />
                </div>
                <div className="story-top-profile">
                  <div className="insta-profile-thumb">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={18}
                    />
                  </div>
                  <b>nexo.oficial</b>
                  <small>2h</small>
                </div>

                <div className="story-content">
                  <small>O FUTURO DO SEU ACESSO</small>
                  <h3>
                    Conecte-se
                    <br />
                    ao que faz
                    <br />
                    sentido.
                  </h3>
                  <div className="story-center-symbol">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={140}
                    />
                  </div>

                  <div className="story-interactive-sticker">
                    <span>Toque para resgatar benefício</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                <div className="story-bottom-bar">
                  <div className="story-reply-pill">Enviar mensagem...</div>
                  <span>♥</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 6: LANDING PAGE DESKTOP (BROWSER MOCKUP) */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("desktop", ["digital"]) && (
          <section className="showcase-card mockup-landing-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">WEB PLATFORM & LANDING PAGE</span>
                <h3>Experiência Desktop / Web App</h3>
                <p>Navegador moderno com Hero section institucional e hierarquia visual refinada.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("desktop");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage landing-stage">
              <div className="browser-window">
                <div className="browser-header">
                  <div className="window-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="browser-url-bar">
                    <ShieldCheck size={12} className="url-lock" />
                    <span>https://nexo.com.br/acesso-inteligente</span>
                  </div>
                  <div className="browser-actions">
                    <ExternalLink size={13} />
                  </div>
                </div>

                <div className="browser-body">
                  <nav className="desktop-nav">
                    <Wordmark direction={direction} size={28} />
                    <div className="nav-links">
                      <span>Como Funciona</span>
                      <span>Rede Credenciada</span>
                      <span>Benefícios</span>
                      <span>Para Empresas</span>
                    </div>
                    <button type="button" className="desktop-cta-btn">
                      <span>Acessar Plataforma</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </nav>

                  <div className="desktop-hero">
                    <div className="desktop-hero-left">
                      <span className="hero-pill">
                        <Sparkles size={13} /> CONEXÕES QUE ABREM POSSIBILIDADES
                      </span>
                      <h2>
                        Acesso ao que
                        <br />
                        faz sentido
                        <br />
                        <em>para você.</em>
                      </h2>
                      <p>
                        Pessoas, serviços essenciais e oportunidades reunidos em um único
                        ecossistema inteligente e humano.
                      </p>
                      <div className="desktop-hero-buttons">
                        <button type="button" className="btn-primary-hero">
                          <span>Conhecer o Nexo Pass</span>
                          <ArrowRight size={15} />
                        </button>
                        <button type="button" className="btn-outline-hero">
                          <span>Ver Rede Credenciada</span>
                        </button>
                      </div>
                    </div>

                    <div className="desktop-hero-right">
                      <div className="hero-symbol-composition">
                        <BrandSymbol
                          id={direction.symbol}
                          customSvg={direction.customSvg}
                          customSvgMode={direction.customSvgMode}
                          size={240}
                        />
                        <div className="floating-stat-card card-1">
                          <Check size={16} />
                          <div>
                            <b>Acesso Confirmado</b>
                            <small>Marina Silva · Nexo Pass</small>
                          </div>
                        </div>
                        <div className="floating-stat-card card-2">
                          <Sparkles size={16} />
                          <div>
                            <b>+180 Benefícios</b>
                            <small>Saúde, cuidado e bem-estar</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 7: SINALIZAÇÃO & AMBIENTE FÍSICO / CLÍNICA */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("signage", ["physical", "access"]) && (
          <section className="showcase-card mockup-signage-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">PHYSICAL SIGNAGE & RETAIL</span>
                <h3>Sinalização na Rede Credenciada</h3>
                <p>Placa de fachada em acrílico com espaçadores de aço e validação de atendimento.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("signage");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage signage-stage">
              <div className="acrylic-plaque-wall">
                <div className="acrylic-plaque">
                  <span className="standoff top-left" />
                  <span className="standoff top-right" />
                  <span className="standoff bottom-left" />
                  <span className="standoff bottom-right" />

                  <div className="plaque-content">
                    <div className="plaque-icon-box">
                      <BrandSymbol
                        id={direction.symbol}
                        customSvg={direction.customSvg}
                        customSvgMode={direction.customSvgMode}
                        size={64}
                      />
                    </div>
                    <Wordmark direction={direction} size={32} />
                    <span className="plaque-badge">REDE CREDENCIADA OFICIAL</span>
                    <h4>Atendimento & Acesso Integrado</h4>
                    <p>Beneficiários do Nexo Pass possuem atendimento prioritário neste local.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 8: MERCHANDISING (SACOLA, CANECA, ADESIVOS) */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("merch", ["physical"]) && (
          <section className="showcase-card mockup-merch-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">BRANDED MERCHANDISE</span>
                <h3>Produtos & Merchandising da Marca</h3>
                <p>Sacola ecológica (tote bag), garrafa térmica e cartela de adesivos em vinil.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("merch");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
              </div>
            </div>

            <div className="mockup-stage merch-stage">
              {/* Canvas Tote Bag */}
              <div className="merch-item tote-bag">
                <div className="tote-handles" />
                <div className="tote-body">
                  <div className="tote-print">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={110}
                    />
                    <Wordmark direction={direction} size={24} />
                    <small>ECOSSISTEMA NEXO</small>
                  </div>
                </div>
                <span>Tote Bag em Algodão Cru</span>
              </div>

              {/* Thermal Tumbler / Bottle */}
              <div className="merch-item thermal-bottle">
                <div className="bottle-cap" />
                <div className="bottle-body">
                  <div className="bottle-engraving">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={44}
                    />
                    <Wordmark direction={direction} size={18} />
                  </div>
                </div>
                <span>Garrafa Térmica em Aço Fosco</span>
              </div>

              {/* Vinyl Stickers */}
              <div className="merch-item stickers-pack">
                <div className="stickers-sheet">
                  <div className="sticker-item round">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={54}
                    />
                  </div>
                  <div className="sticker-item badge">
                    <Wordmark direction={direction} size={18} />
                  </div>
                  <div className="sticker-item square">
                    <small>NEXO PASS</small>
                  </div>
                </div>
                <span>Cartela de Adesivos Vinil</span>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOCKUP 9: DESIGN SYSTEM & GUIDELINES SPECIMEN */}
        {/* ------------------------------------------------------------- */}
        {isCardVisible("guidelines", ["guidelines"]) && (
          <section className="showcase-card mockup-guidelines-card">
            <div className="mockup-card-header">
              <div>
                <span className="card-badge">DESIGN SYSTEM & SPECIFICATIONS</span>
                <h3>Guia Rápido de Diretrizes da Marca</h3>
                <p>Construção do símbolo, reduções de legibilidade, paleta com valores HEX e tokens CSS.</p>
              </div>
              <div className="mockup-header-actions">
                <button
                  type="button"
                  className="card-focus-toggle-btn"
                  onClick={() => {
                    if (viewMode === "focus") {
                      setViewMode("gallery");
                    } else {
                      setFocusedMockup("guidelines");
                      setViewMode("focus");
                    }
                  }}
                  title={viewMode === "focus" ? "Voltar para grade completa (Esc)" : "Focar nesta aplicação"}
                >
                  {viewMode === "focus" ? <Layers size={13} /> : <Maximize2 size={13} />}
                  <span>{viewMode === "focus" ? "Ver Grade" : "Modo Foco"}</span>
                </button>
                <Button variant="outline" size="sm" onClick={copyCssTokens}>
                  {copiedTokens ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copiar Tokens CSS</span>
                </Button>
              </div>
            </div>

            <div className="mockup-stage guidelines-stage">
              {/* Logo Versions Grid */}
              <div className="guideline-block">
                <span className="block-title">01. COMPOSIÇÕES DE MARCA</span>
                <div className="logo-variations-grid">
                  <div className="logo-box light">
                    <Wordmark direction={direction} size={32} />
                    <small>Positivo (Fundo Claro)</small>
                  </div>

                  <div className="logo-box dark">
                    <Wordmark direction={direction} size={32} />
                    <small>Negativo (Fundo Escuro)</small>
                  </div>

                  <div className="logo-box primary-bg">
                    <Wordmark direction={direction} size={32} />
                    <small>Monocromático sobre Primária</small>
                  </div>

                  <div className="logo-box isolated-symbol">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={56}
                    />
                    <small>Símbolo Isolado</small>
                  </div>
                </div>
              </div>

              {/* Reduction Scale */}
              <div className="guideline-block">
                <span className="block-title">02. ESCALA DE REDUÇÃO E LEGIBILIDADE</span>
                <div className="reduction-scale-row">
                  <div className="reduction-step">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={16}
                    />
                    <small>16 px · Favicon</small>
                  </div>
                  <div className="reduction-step">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={24}
                    />
                    <small>24 px · Tab bar</small>
                  </div>
                  <div className="reduction-step">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={32}
                    />
                    <small>32 px · Notificação</small>
                  </div>
                  <div className="reduction-step">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={48}
                    />
                    <small>48 px · Avatar</small>
                  </div>
                  <div className="reduction-step">
                    <BrandSymbol
                      id={direction.symbol}
                      customSvg={direction.customSvg}
                      customSvgMode={direction.customSvgMode}
                      size={64}
                    />
                    <small>64 px · App Icon</small>
                  </div>
                </div>
              </div>

              {/* Color Swatches Grid with Copy */}
              <div className="guideline-block">
                <span className="block-title">03. CÓDIGOS DE COR & VALORES HEX</span>
                <div className="color-swatches-grid">
                  {Object.entries(activeColors).map(([role, hex]) => (
                    <div
                      key={role}
                      className="swatch-detail-card"
                      onClick={() => {
                        navigator.clipboard.writeText(hex);
                      }}
                      title="Clique para copiar HEX"
                    >
                      <div className="swatch-color-box" style={{ backgroundColor: hex }} />
                      <div className="swatch-meta">
                        <b>{role.toUpperCase()}</b>
                        <span>{hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. MODALS */}
      {/* ========================================================================= */}
      <PaletteBuilderModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        initialColors={activeColors}
        onSelectPalette={(palette) => {
          setDirection((prev) => ({
            ...prev,
            palette: palette.id,
            colors: palette.colors,
          }));
        }}
      />

      <SvgUploaderModal
        isOpen={isSvgModalOpen}
        onClose={() => setIsSvgModalOpen(false)}
        activeSymbolSvg={direction.customSvg}
        onSelectSymbol={(sym) => {
          setDirection((prev) => ({
            ...prev,
            customSvg: sym.svg,
            customSvgName: sym.name,
            customSvgMode: sym.colorMode,
          }));
        }}
      />
    </div>
  );
}
