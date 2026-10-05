import { Colors, palettes, symbols } from "./brand-data";
import { supabase } from "./supabase";

export type CustomPalette = {
  id: string;
  name: string;
  description?: string;
  colors: Colors;
  isCustom?: boolean;
  createdAt?: string;
};

export type CustomSymbol = {
  id: string;
  name: string;
  svg: string;
  originalSvg: string;
  colorMode: "monochrome" | "original";
  fileName?: string;
  createdAt: string;
};

export const CUSTOM_ASSETS_CHANGED = "nexo_custom_assets_changed";

const PALETTES_STORAGE_KEY = "nexo_custom_palettes_v1";
const SYMBOLS_STORAGE_KEY = "nexo_custom_symbols_v1";
const HIDDEN_SYMBOLS_STORAGE_KEY = "nexo_hidden_symbols_v1";
const HIDDEN_PALETTES_STORAGE_KEY = "nexo_hidden_palettes_v1";
const CHOICES_STORAGE_KEY = "nexo_brand_choices_v1";
const DELETED_PALETTES_STORAGE_KEY = "nexo_deleted_palettes_v1";
const DELETED_SYMBOLS_STORAGE_KEY = "nexo_deleted_symbols_v1";

export function getDeletedPaletteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_PALETTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedPaletteId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedPaletteIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_PALETTES_STORAGE_KEY, JSON.stringify([...current, id]));
    }
  } catch {}
}

export function removeDeletedPaletteId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedPaletteIds().filter((item) => item !== id);
    localStorage.setItem(DELETED_PALETTES_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export function getDeletedSymbolIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_SYMBOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedSymbolId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedSymbolIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_SYMBOLS_STORAGE_KEY, JSON.stringify([...current, id]));
    }
  } catch {}
}

export function removeDeletedSymbolId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedSymbolIds().filter((item) => item !== id);
    localStorage.setItem(DELETED_SYMBOLS_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

let syncTimer: any = null;
export function scheduleBackgroundSync(delay = 600) {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncAssetsWithServer();
  }, delay);
}

let isServerSyncing = false;
let activeRealtimeChannel: any = null;

export function getRealtimeChannel() {
  if (typeof window === "undefined") return null;
  if (!activeRealtimeChannel) {
    activeRealtimeChannel = supabase.channel("brand_realtime_passaporte_saude", {
      config: { broadcast: { ack: false, self: false } },
    });
    activeRealtimeChannel.subscribe();
  }
  return activeRealtimeChannel;
}

export function broadcastEvent(event: string, payload: any = {}) {
  try {
    const ch = getRealtimeChannel();
    if (ch) {
      ch.send({
        type: "broadcast",
        event,
        payload,
      });
    }
  } catch (err) {
    console.warn("Supabase Realtime broadcast warning:", err);
  }
}

/**
 * Subscribe to live real-time updates from Supabase (Broadcast + Postgres Changes)
 */
export function subscribeToSupabaseRealtime(callbacks: {
  onChoicesChanged?: (choices: any) => void;
  onPalettesChanged?: () => void;
  onSymbolsChanged?: () => void;
  onStatusChange?: (status: string) => void;
}) {
  if (typeof window === "undefined") return () => {};

  const channel = supabase.channel("brand_realtime_passaporte_saude", {
    config: { broadcast: { ack: false, self: false } },
  });

  // 1. Listen for broadcast events from other clients
  channel.on("broadcast", { event: "brand_choices_changed" }, (payload: any) => {
    if (payload.payload) {
      localStorage.setItem(CHOICES_STORAGE_KEY, JSON.stringify(payload.payload));
      callbacks.onChoicesChanged?.(payload.payload);
      notifyAssetsChanged();
    }
  });

  channel.on("broadcast", { event: "palettes_changed" }, async (payload: any) => {
    if (payload?.payload?.action === "delete" && payload?.payload?.id) {
      recordDeletedPaletteId(payload.payload.id);
      const local = getCustomPalettesInternal().filter((p) => p.id !== payload.payload.id);
      localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(local));
    }
    await syncAssetsWithServer();
    callbacks.onPalettesChanged?.();
    notifyAssetsChanged();
  });

  channel.on("broadcast", { event: "symbols_changed" }, async (payload: any) => {
    if (payload?.payload?.action === "delete" && payload?.payload?.id) {
      recordDeletedSymbolId(payload.payload.id);
      const local = getCustomSymbolsInternal().filter((s) => s.id !== payload.payload.id);
      localStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(local));
    }
    await syncAssetsWithServer();
    callbacks.onSymbolsChanged?.();
    notifyAssetsChanged();
  });

  // 2. Listen for direct PostgreSQL database changes
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "brand_choices" },
    (payload: any) => {
      if (payload.new && payload.new.id === "active_choice") {
        const c = payload.new;
        const choices = {
          symbol: c.symbol,
          customSvg: c.custom_svg,
          customSvgName: c.custom_svg_name,
          customSvgMode: c.custom_svg_mode,
          palette: c.palette,
          colors: c.colors,
          font: c.font,
          radius: c.radius,
          wordmark: c.wordmark,
          style: c.style,
        };
        if (c.hidden_symbol_ids && Array.isArray(c.hidden_symbol_ids)) {
          localStorage.setItem(HIDDEN_SYMBOLS_STORAGE_KEY, JSON.stringify(c.hidden_symbol_ids));
        }
        if (c.hidden_palette_ids && Array.isArray(c.hidden_palette_ids)) {
          localStorage.setItem(HIDDEN_PALETTES_STORAGE_KEY, JSON.stringify(c.hidden_palette_ids));
        }
        localStorage.setItem(CHOICES_STORAGE_KEY, JSON.stringify(choices));
        callbacks.onChoicesChanged?.(choices);
        notifyAssetsChanged();
      }
    }
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "brand_custom_palettes" },
    async (payload: any) => {
      if (payload.eventType === "DELETE" && payload.old?.id) {
        recordDeletedPaletteId(payload.old.id);
        const local = getCustomPalettesInternal().filter((p) => p.id !== payload.old.id);
        localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(local));
      }
      await syncAssetsWithServer();
      callbacks.onPalettesChanged?.();
      notifyAssetsChanged();
    }
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "brand_custom_symbols" },
    async (payload: any) => {
      if (payload.eventType === "DELETE" && payload.old?.id) {
        recordDeletedSymbolId(payload.old.id);
        const local = getCustomSymbolsInternal().filter((s) => s.id !== payload.old.id);
        localStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(local));
      }
      await syncAssetsWithServer();
      callbacks.onSymbolsChanged?.();
      notifyAssetsChanged();
    }
  );

  channel.subscribe((status: string) => {
    callbacks.onStatusChange?.(status);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function notifyAssetsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOM_ASSETS_CHANGED));
  }
}

/**
 * Sync assets from Supabase passaporte-saude to localStorage and vice-versa.
 */
export async function syncAssetsWithServer(): Promise<void> {
  if (typeof window === "undefined" || isServerSyncing) return;
  isServerSyncing = true;

  try {
    const [palettesRes, symbolsRes, choicesRes] = await Promise.all([
      supabase.from("brand_custom_palettes").select("*").order("created_at", { ascending: false }),
      supabase.from("brand_custom_symbols").select("*").order("created_at", { ascending: false }),
      supabase.from("brand_choices").select("*").eq("id", "active_choice").maybeSingle(),
    ]);

    let hasNewItems = false;

    // 1. Sync Palettes from Supabase
    if (!palettesRes.error && palettesRes.data) {
      const deletedIds = new Set(getDeletedPaletteIds());
      const serverPalettes: CustomPalette[] = [];
      const itemsToDeleteOnServer: string[] = [];

      for (const p of palettesRes.data) {
        if (deletedIds.has(p.id)) {
          itemsToDeleteOnServer.push(p.id);
        } else {
          serverPalettes.push({
            id: p.id,
            name: p.name,
            description: p.description,
            colors: p.colors,
            isCustom: p.is_custom,
            createdAt: p.created_at,
          });
        }
      }

      if (itemsToDeleteOnServer.length > 0) {
        supabase
          .from("brand_custom_palettes")
          .delete()
          .in("id", itemsToDeleteOnServer)
          .then(() => {});
      }

      const localPalettes = getCustomPalettesInternal().filter((p) => !deletedIds.has(p.id));
      const paletteMap = new Map<string, CustomPalette>();

      // Server is source of truth for synced palettes
      serverPalettes.forEach((p) => paletteMap.set(p.id, p));

      // Retain local palettes only if newly created and not yet synced/deleted
      localPalettes.forEach((p) => {
        if (!paletteMap.has(p.id) && !deletedIds.has(p.id)) {
          paletteMap.set(p.id, p);
        }
      });

      const mergedPalettes = Array.from(paletteMap.values());
      const currentStored = JSON.stringify(localPalettes);
      const newStored = JSON.stringify(mergedPalettes);

      if (currentStored !== newStored) {
        localStorage.setItem(PALETTES_STORAGE_KEY, newStored);
        hasNewItems = true;
      }
    }

    // 2. Sync Symbols from Supabase
    if (!symbolsRes.error && symbolsRes.data) {
      const deletedIds = new Set(getDeletedSymbolIds());
      const serverSymbols: CustomSymbol[] = [];
      const itemsToDeleteOnServer: string[] = [];

      for (const s of symbolsRes.data) {
        if (deletedIds.has(s.id)) {
          itemsToDeleteOnServer.push(s.id);
        } else {
          serverSymbols.push({
            id: s.id,
            name: s.name,
            svg: s.svg,
            originalSvg: s.original_svg,
            colorMode: s.color_mode,
            fileName: s.file_name,
            createdAt: s.created_at,
          });
        }
      }

      if (itemsToDeleteOnServer.length > 0) {
        supabase
          .from("brand_custom_symbols")
          .delete()
          .in("id", itemsToDeleteOnServer)
          .then(() => {});
      }

      const localSymbols = getCustomSymbolsInternal().filter((s) => !deletedIds.has(s.id));
      const symbolMap = new Map<string, CustomSymbol>();
      serverSymbols.forEach((s) => symbolMap.set(s.id, s));
      localSymbols.forEach((s) => {
        if (!symbolMap.has(s.id) && !deletedIds.has(s.id)) {
          symbolMap.set(s.id, s);
        }
      });

      const mergedSymbols = Array.from(symbolMap.values());
      const currentStored = JSON.stringify(localSymbols);
      const newStored = JSON.stringify(mergedSymbols);

      if (currentStored !== newStored) {
        localStorage.setItem(SYMBOLS_STORAGE_KEY, newStored);
        hasNewItems = true;
      }
    }

    // 3. Sync Choices & Hidden Items from Supabase
    if (!choicesRes.error && choicesRes.data) {
      const c = choicesRes.data;
      if (c.hidden_symbol_ids && Array.isArray(c.hidden_symbol_ids)) {
        localStorage.setItem(HIDDEN_SYMBOLS_STORAGE_KEY, JSON.stringify(c.hidden_symbol_ids));
        hasNewItems = true;
      }
      if (c.hidden_palette_ids && Array.isArray(c.hidden_palette_ids)) {
        localStorage.setItem(HIDDEN_PALETTES_STORAGE_KEY, JSON.stringify(c.hidden_palette_ids));
        hasNewItems = true;
      }
      localStorage.setItem(CHOICES_STORAGE_KEY, JSON.stringify(c));
    }

    if (hasNewItems) {
      notifyAssetsChanged();
    }
  } catch (err) {
    console.warn("Supabase passaporte-saude background sync fallback:", err);
  } finally {
    isServerSyncing = false;
  }
}

// -------------------------------------------------------------
// BRAND CHOICES MANAGEMENT (PERSISTED IN SUPABASE & REALTIME)
// -------------------------------------------------------------

export function getSavedBrandChoices(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHOICES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBrandChoices(choices: any): Promise<void> {
  if (typeof window === "undefined") return;

  localStorage.setItem(CHOICES_STORAGE_KEY, JSON.stringify(choices));
  notifyAssetsChanged();

  // Transmite atualização em tempo real
  broadcastEvent("brand_choices_changed", choices);

  // Persiste no Supabase passaporte-saude
  const { error } = await supabase.from("brand_choices").upsert({
    id: "active_choice",
    symbol: choices.symbol ?? 0,
    custom_svg: choices.customSvg || null,
    custom_svg_name: choices.customSvgName || null,
    custom_svg_mode: choices.customSvgMode || null,
    palette: choices.palette || "confidence",
    colors: choices.colors || null,
    font: choices.font || "manrope",
    radius: choices.radius ?? 12,
    wordmark: choices.wordmark || "Nexo",
    style: choices.style || "soft",
    hidden_symbol_ids: getHiddenSymbolIds(),
    hidden_palette_ids: getHiddenPaletteIds(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error auto-saving brand choices to Supabase passaporte-saude:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// PALETTE MANAGEMENT
// -------------------------------------------------------------

function getCustomPalettesInternal(): CustomPalette[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PALETTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCustomPalettes(): CustomPalette[] {
  if (typeof window === "undefined") return [];
  scheduleBackgroundSync();

  const deletedIds = new Set(getDeletedPaletteIds());
  return getCustomPalettesInternal().filter((p) => !deletedIds.has(p.id));
}

export function saveCustomPalette(
  palette: Omit<CustomPalette, "id" | "isCustom" | "createdAt"> & { id?: string }
): CustomPalette {
  const id =
    palette.id ||
    `custom-pal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  removeDeletedPaletteId(id);

  const existing = getCustomPalettesInternal();
  const item: CustomPalette = {
    ...palette,
    id,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  const filtered = existing.filter((p) => p.id !== id);
  const updated = [item, ...filtered];
  if (typeof window !== "undefined") {
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(updated));
    notifyAssetsChanged();

    // Persist to Supabase passaporte-saude
    supabase
      .from("brand_custom_palettes")
      .upsert({
        id: item.id,
        name: item.name,
        description: item.description || "",
        colors: item.colors,
        is_custom: true,
        created_at: item.createdAt,
      })
      .then(({ error }) => {
        if (error) console.error("Error saving palette to Supabase:", error);
        broadcastEvent("palettes_changed", { action: "save", palette: item });
      });

    fetch("/api/custom-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_palette", palette: item }),
    }).catch(() => {});
  }
  return item;
}

export function deleteCustomPalette(id: string): void {
  if (typeof window === "undefined") return;

  // 1. Mark in tombstones
  recordDeletedPaletteId(id);

  // 2. Remove immediately from local storage
  const existing = getCustomPalettesInternal();
  const updated = existing.filter((p) => p.id !== id);
  localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(updated));
  notifyAssetsChanged();

  // 3. Delete in Supabase passaporte-saude
  supabase
    .from("brand_custom_palettes")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("Error deleting palette in Supabase:", error);
      broadcastEvent("palettes_changed", { action: "delete", id });
    });

  // 4. Update route cache
  fetch("/api/custom-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete_palette", id }),
  }).catch(() => {});
}

export function getHiddenPaletteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_PALETTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hideDefaultPalette(id: string): void {
  const existing = getHiddenPaletteIds();
  if (!existing.includes(id)) {
    const updated = [...existing, id];
    if (typeof window !== "undefined") {
      localStorage.setItem(HIDDEN_PALETTES_STORAGE_KEY, JSON.stringify(updated));
      notifyAssetsChanged();

      supabase
        .from("brand_choices")
        .upsert({
          id: "active_choice",
          hidden_palette_ids: updated,
          updated_at: new Date().toISOString(),
        })
        .then(() => {
          broadcastEvent("palettes_changed", { action: "hide", id });
        });
    }
  }
}

export function restoreDefaultPalettes(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HIDDEN_PALETTES_STORAGE_KEY);
    notifyAssetsChanged();

    supabase
      .from("brand_choices")
      .upsert({
        id: "active_choice",
        hidden_palette_ids: [],
        updated_at: new Date().toISOString(),
      })
      .then(() => {
        broadcastEvent("palettes_changed", { action: "restore" });
      });
  }
}

export function deleteAnyPalette(id: string): void {
  const customList = getCustomPalettes();
  const isCustom = customList.some((p) => p.id === id);
  if (isCustom || id.startsWith("custom-pal-")) {
    deleteCustomPalette(id);
  } else {
    hideDefaultPalette(id);
  }
}

// -------------------------------------------------------------
// SYMBOL & SVG MANAGEMENT
// -------------------------------------------------------------

function getCustomSymbolsInternal(): CustomSymbol[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYMBOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCustomSymbols(): CustomSymbol[] {
  if (typeof window === "undefined") return [];
  scheduleBackgroundSync();

  const deletedIds = new Set(getDeletedSymbolIds());
  return getCustomSymbolsInternal().filter((s) => !deletedIds.has(s.id));
}

export function saveCustomSymbol(
  symbol: Omit<CustomSymbol, "id" | "createdAt"> & { id?: string }
): CustomSymbol {
  const id =
    symbol.id ||
    `custom-sym-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  removeDeletedSymbolId(id);

  const existing = getCustomSymbolsInternal();
  const item: CustomSymbol = {
    ...symbol,
    id,
    createdAt: new Date().toISOString(),
  };

  const filtered = existing.filter((s) => s.id !== id);
  const updated = [item, ...filtered];
  if (typeof window !== "undefined") {
    localStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(updated));
    notifyAssetsChanged();

    // Persist to Supabase passaporte-saude
    supabase
      .from("brand_custom_symbols")
      .upsert({
        id: item.id,
        name: item.name,
        svg: item.svg,
        original_svg: item.originalSvg || item.svg,
        color_mode: item.colorMode,
        file_name: item.fileName || "",
        created_at: item.createdAt,
      })
      .then(({ error }) => {
        if (error) console.error("Error saving symbol to Supabase:", error);
        broadcastEvent("symbols_changed", { action: "save", symbol: item });
      });

    fetch("/api/custom-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_symbol", symbol: item }),
    }).catch(() => {});
  }
  return item;
}

export function deleteCustomSymbol(id: string): void {
  if (typeof window === "undefined") return;

  recordDeletedSymbolId(id);
  const existing = getCustomSymbolsInternal();
  const updated = existing.filter((s) => s.id !== id);
  localStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(updated));
  notifyAssetsChanged();

  // Delete in Supabase passaporte-saude
  supabase
    .from("brand_custom_symbols")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("Error deleting symbol in Supabase:", error);
      broadcastEvent("symbols_changed", { action: "delete", id });
    });

  fetch("/api/custom-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete_symbol", id }),
  }).catch(() => {});
}

export function getHiddenSymbolIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_SYMBOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

export function hideDefaultSymbol(id: number): void {
  const existing = getHiddenSymbolIds();
  if (!existing.includes(id)) {
    const updated = [...existing, id];
    if (typeof window !== "undefined") {
      localStorage.setItem(HIDDEN_SYMBOLS_STORAGE_KEY, JSON.stringify(updated));
      notifyAssetsChanged();

      supabase
        .from("brand_choices")
        .upsert({
          id: "active_choice",
          hidden_symbol_ids: updated,
          updated_at: new Date().toISOString(),
        })
        .then(() => {
          broadcastEvent("symbols_changed", { action: "hide", id });
        });
    }
  }
}

export function restoreDefaultSymbols(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HIDDEN_SYMBOLS_STORAGE_KEY);
    notifyAssetsChanged();

    supabase
      .from("brand_choices")
      .upsert({
        id: "active_choice",
        hidden_symbol_ids: [],
        updated_at: new Date().toISOString(),
      })
      .then(() => {
        broadcastEvent("symbols_changed", { action: "restore" });
      });
  }
}

export function deleteAnySymbol(identifier: string | number): void {
  const customList = getCustomSymbols();
  const foundCustom = customList.find(
    (s) => s.id === identifier || s.svg === identifier
  );
  if (foundCustom) {
    deleteCustomSymbol(foundCustom.id);
  } else if (typeof identifier === "string" && identifier.startsWith("custom-sym-")) {
    deleteCustomSymbol(identifier);
  } else {
    hideDefaultSymbol(Number(identifier));
  }
}

/**
 * Universal, highly resilient SVG cleaner & normalizer for all browsers.
 */
export function processSvgString(
  rawSvg: string,
  colorMode: "monochrome" | "original" = "monochrome"
): { processed: string; valid: boolean; error?: string } {
  if (!rawSvg || typeof rawSvg !== "string") {
    return { processed: "", valid: false, error: "Arquivo ou conteúdo SVG vazio." };
  }

  let clean = rawSvg.replace(/^\uFEFF/, "").trim();
  clean = clean.replace(/<\?xml[\s\S]*?\?>/gi, "");
  clean = clean.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  clean = clean.trim();

  if (clean.startsWith("M") || clean.startsWith("m") || (!clean.includes("<") && clean.length > 5)) {
    const pathContent = `<svg viewBox="0 0 92 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="${clean}" /></svg>`;
    return { processed: pathContent, valid: true };
  }

  const startIdx = clean.search(/<svg/i);
  const endIdx = clean.toLowerCase().lastIndexOf("</svg>");
  let svgTag = "";

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    svgTag = clean.substring(startIdx, endIdx + 6);
  } else if (startIdx !== -1) {
    svgTag = clean.substring(startIdx);
    if (!svgTag.toLowerCase().includes("</svg>")) {
      svgTag += "</svg>";
    }
  } else if (clean.includes("<path") || clean.includes("<g") || clean.includes("<circle") || clean.includes("<polygon")) {
    svgTag = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${clean}</svg>`;
  } else {
    return { processed: "", valid: false, error: "Estrutura <svg> ou <path> não encontrada no conteúdo." };
  }

  svgTag = svgTag.replace(/<script[\s\S]*?<\/script>/gi, "");
  svgTag = svgTag.replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  if (!svgTag.includes("xmlns=")) {
    svgTag = svgTag.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const hasViewBox = /viewBox\s*=/i.test(svgTag);
  if (!hasViewBox) {
    const widthMatch = svgTag.match(/width\s*=\s*["']?([0-9.]+)/i);
    const heightMatch = svgTag.match(/height\s*=\s*["']?([0-9.]+)/i);
    if (widthMatch && heightMatch) {
      const w = Math.round(parseFloat(widthMatch[1]));
      const h = Math.round(parseFloat(heightMatch[1]));
      svgTag = svgTag.replace(/<svg/i, `<svg viewBox="0 0 ${w} ${h}"`);
    } else {
      svgTag = svgTag.replace(/<svg/i, '<svg viewBox="0 0 100 100"');
    }
  }

  svgTag = svgTag.replace(/\bwidth\s*=\s*["'][^"']+["']/gi, 'width="100%"');
  svgTag = svgTag.replace(/\bheight\s*=\s*["'][^"']+["']/gi, 'height="100%"');
  if (!svgTag.includes('width="100%"')) {
    svgTag = svgTag.replace(/<svg/i, '<svg width="100%" height="100%"');
  }

  if (colorMode === "monochrome") {
    svgTag = svgTag.replace(/\bfill\s*=\s*["'](?!none)[^"']*["']/gi, 'fill="currentColor"');
    if (!svgTag.includes('fill="') && !svgTag.includes("fill='")) {
      svgTag = svgTag.replace(/<svg/i, '<svg fill="currentColor"');
    }
  }

  return { processed: svgTag, valid: true };
}

// -------------------------------------------------------------
// COLOR HARMONY & CONTRAST
// -------------------------------------------------------------

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 35, g: 78, b: 82 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function generateHarmoniousColors(primaryHex: string): Colors {
  const rgb = hexToRgb(primaryHex);
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const secH = (h + 35) % 360;
  const secondary = hslToHex(secH, Math.max(20, Math.min(45, s * 0.5)), 80);

  const accH = (h + 160) % 360;
  const accent = hslToHex(accH, Math.min(85, Math.max(60, s + 15)), 60);

  const bgH = (h + 20) % 360;
  const background = hslToHex(bgH, 12, 97);
  const text = hslToHex(h, 18, 16);

  return {
    primary: rgbToHex(rgb.r, rgb.g, rgb.b),
    secondary,
    accent,
    background,
    text,
  };
}

function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export const PALETTE_PRESETS: Array<{
  name: string;
  description: string;
  colors: Colors;
}> = [
  {
    name: "Fintech & Confiança",
    description: "Azul institucional profundo com acento ouro cítrico.",
    colors: {
      primary: "#183B6B",
      secondary: "#CBDCEB",
      accent: "#E29933",
      background: "#F7F9FC",
      text: "#1A222D",
    },
  },
  {
    name: "Saúde & Vitalidade",
    description: "Verde floresta profundo com toques de menta fresca.",
    colors: {
      primary: "#1A4D43",
      secondary: "#B8E2D8",
      accent: "#E5825E",
      background: "#F5F9F7",
      text: "#1C2B27",
    },
  },
  {
    name: "Editorial Terracota",
    description: "Calor humano, argila e sofisticação orgânica.",
    colors: {
      primary: "#6B3324",
      secondary: "#EAD5C8",
      accent: "#386B5E",
      background: "#FAF6F2",
      text: "#2B1E1B",
    },
  },
  {
    name: "Ametista Contemporânea",
    description: "Roxo real com secundário lavanda e coral luminoso.",
    colors: {
      primary: "#442A68",
      secondary: "#D4C8E6",
      accent: "#F07167",
      background: "#F8F6FB",
      text: "#271E33",
    },
  },
  {
    name: "Minimalista Grafite",
    description: "Estrutural, atemporal e focado em precisão técnica.",
    colors: {
      primary: "#21272C",
      secondary: "#CCD2D8",
      accent: "#D6A338",
      background: "#F6F7F9",
      text: "#181B1E",
    },
  },
  {
    name: "Solar Energético",
    description: "Otimismo, conexão e dinamismo jovem.",
    colors: {
      primary: "#1F4259",
      secondary: "#F3D5A5",
      accent: "#E05A36",
      background: "#FAF7F2",
      text: "#21262B",
    },
  },
];
