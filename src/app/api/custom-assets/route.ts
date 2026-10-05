import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const folder = path.join(process.cwd(), ".local-data");
const assetsFile = path.join(folder, "custom-assets.json");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vuikpnwtofcpohudmxmf.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aWtwbnd0b2ZjcG9odWRteG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDA4NTMsImV4cCI6MjEwNTQxNjg1M30.NQvqG51BtAu486SkEL7RIoeJJiwVu-NnraiNpVSztPE";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type CustomAssetsData = {
  palettes: any[];
  symbols: any[];
  hiddenSymbolIds?: Array<string | number>;
  hiddenPaletteIds?: string[];
  choices?: any;
  updatedAt: string;
};

async function readLocalAssets(): Promise<CustomAssetsData> {
  try {
    const raw = await readFile(assetsFile, "utf8");
    const data = JSON.parse(raw);
    return {
      palettes: Array.isArray(data.palettes) ? data.palettes : [],
      symbols: Array.isArray(data.symbols) ? data.symbols : [],
      hiddenSymbolIds: Array.isArray(data.hiddenSymbolIds) ? data.hiddenSymbolIds : [],
      hiddenPaletteIds: Array.isArray(data.hiddenPaletteIds) ? data.hiddenPaletteIds : [],
      choices: data.choices || null,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { palettes: [], symbols: [], hiddenSymbolIds: [], hiddenPaletteIds: [], choices: null, updatedAt: new Date().toISOString() };
  }
}

async function writeLocalAssets(data: CustomAssetsData) {
  try {
    await mkdir(folder, { recursive: true });
    await writeFile(assetsFile, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving local assets cache:", err);
  }
}

export async function GET() {
  try {
    // 1. Fetch from Supabase passaporte-saude
    const [palettesRes, symbolsRes, choicesRes] = await Promise.all([
      supabase.from("brand_custom_palettes").select("*").order("created_at", { ascending: false }),
      supabase.from("brand_custom_symbols").select("*").order("created_at", { ascending: false }),
      supabase.from("brand_choices").select("*").eq("id", "active_choice").maybeSingle(),
    ]);

    let palettes: any[] = [];
    let symbols: any[] = [];
    let hiddenSymbolIds: any[] = [];
    let hiddenPaletteIds: any[] = [];
    let choices: any = null;

    if (!palettesRes.error && palettesRes.data) {
      palettes = palettesRes.data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        colors: p.colors,
        isCustom: p.is_custom,
        createdAt: p.created_at,
      }));
    }

    if (!symbolsRes.error && symbolsRes.data) {
      symbols = symbolsRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        svg: s.svg,
        originalSvg: s.original_svg,
        colorMode: s.color_mode,
        fileName: s.file_name,
        createdAt: s.created_at,
      }));
    }

    if (!choicesRes.error && choicesRes.data) {
      choices = choicesRes.data;
      hiddenSymbolIds = choicesRes.data.hidden_symbol_ids || [];
      hiddenPaletteIds = choicesRes.data.hidden_palette_ids || [];
    }

    // Fallback to local if Supabase had empty or error
    if (palettes.length === 0 && symbols.length === 0) {
      const local = await readLocalAssets();
      palettes = local.palettes;
      symbols = local.symbols;
      hiddenSymbolIds = local.hiddenSymbolIds || [];
      hiddenPaletteIds = local.hiddenPaletteIds || [];
      choices = local.choices || choices;
    } else {
      // Sync local cache
      writeLocalAssets({
        palettes,
        symbols,
        hiddenSymbolIds,
        hiddenPaletteIds,
        choices,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      palettes,
      symbols,
      hiddenSymbolIds,
      hiddenPaletteIds,
      choices,
      updatedAt: new Date().toISOString(),
      source: "supabase-passaporte-saude",
    });
  } catch (error) {
    const local = await readLocalAssets();
    return NextResponse.json(local);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readLocalAssets();

    if (body.action === "sync_all") {
      if (Array.isArray(body.symbols) && body.symbols.length > 0) {
        current.symbols = body.symbols;
        // Upsert all symbols to Supabase
        for (const s of body.symbols) {
          if (s?.id && s?.svg) {
            await supabase.from("brand_custom_symbols").upsert({
              id: s.id,
              name: s.name || "Símbolo",
              svg: s.svg,
              original_svg: s.originalSvg || s.svg,
              color_mode: s.colorMode || "monochrome",
              file_name: s.fileName || "",
              created_at: s.createdAt || new Date().toISOString(),
            });
          }
        }
      }
      if (Array.isArray(body.palettes) && body.palettes.length > 0) {
        current.palettes = body.palettes;
        // Upsert all palettes to Supabase
        for (const p of body.palettes) {
          if (p?.id && p?.colors) {
            await supabase.from("brand_custom_palettes").upsert({
              id: p.id,
              name: p.name || "Paleta",
              description: p.description || "",
              colors: p.colors,
              is_custom: p.isCustom ?? true,
              created_at: p.createdAt || new Date().toISOString(),
            });
          }
        }
      }
      if (Array.isArray(body.hiddenSymbolIds)) {
        current.hiddenSymbolIds = body.hiddenSymbolIds;
      }
      if (Array.isArray(body.hiddenPaletteIds)) {
        current.hiddenPaletteIds = body.hiddenPaletteIds;
      }
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_symbol_ids: current.hiddenSymbolIds || [],
        hidden_palette_ids: current.hiddenPaletteIds || [],
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "save_symbol" && body.symbol) {
      const s = body.symbol;
      const existing = current.symbols.filter((item) => item.id !== s.id);
      current.symbols = [s, ...existing];

      // Upsert to Supabase passaporte-saude
      await supabase.from("brand_custom_symbols").upsert({
        id: s.id,
        name: s.name,
        svg: s.svg,
        original_svg: s.originalSvg || s.svg,
        color_mode: s.colorMode || "monochrome",
        file_name: s.fileName || "",
        created_at: s.createdAt || new Date().toISOString(),
      });
    } else if (body.action === "delete_symbol" && body.id) {
      current.symbols = current.symbols.filter((s) => s.id !== body.id);
      await supabase.from("brand_custom_symbols").delete().eq("id", body.id);
    } else if (body.action === "save_palette" && body.palette) {
      const p = body.palette;
      const existing = current.palettes.filter((item) => item.id !== p.id);
      current.palettes = [p, ...existing];

      // Upsert to Supabase passaporte-saude
      await supabase.from("brand_custom_palettes").upsert({
        id: p.id,
        name: p.name,
        description: p.description || "",
        colors: p.colors,
        is_custom: p.isCustom ?? true,
        created_at: p.createdAt || new Date().toISOString(),
      });
    } else if (body.action === "delete_palette" && body.id) {
      current.palettes = current.palettes.filter((p) => p.id !== body.id);
      await supabase.from("brand_custom_palettes").delete().eq("id", body.id);
    } else if (body.action === "save_choices" && body.choices) {
      const c = body.choices;
      current.choices = c;
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        symbol: c.symbol ?? 0,
        custom_svg: c.customSvg || null,
        custom_svg_name: c.customSvgName || null,
        custom_svg_mode: c.customSvgMode || null,
        palette: c.palette || "confidence",
        colors: c.colors || null,
        font: c.font || "manrope",
        radius: c.radius ?? 12,
        wordmark: c.wordmark || "Nexo",
        style: c.style || "soft",
        hidden_symbol_ids: current.hiddenSymbolIds || [],
        hidden_palette_ids: current.hiddenPaletteIds || [],
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "hide_symbol" && body.id !== undefined) {
      const set = new Set(current.hiddenSymbolIds || []);
      set.add(body.id);
      current.hiddenSymbolIds = Array.from(set);
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_symbol_ids: current.hiddenSymbolIds,
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "unhide_symbol" && body.id !== undefined) {
      current.hiddenSymbolIds = (current.hiddenSymbolIds || []).filter((id) => id !== body.id);
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_symbol_ids: current.hiddenSymbolIds,
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "reset_hidden_symbols") {
      current.hiddenSymbolIds = [];
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_symbol_ids: [],
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "hide_palette" && body.id) {
      const set = new Set(current.hiddenPaletteIds || []);
      set.add(body.id);
      current.hiddenPaletteIds = Array.from(set);
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_palette_ids: current.hiddenPaletteIds,
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "unhide_palette" && body.id) {
      current.hiddenPaletteIds = (current.hiddenPaletteIds || []).filter((id) => id !== body.id);
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_palette_ids: current.hiddenPaletteIds,
        updated_at: new Date().toISOString(),
      });
    } else if (body.action === "reset_hidden_palettes") {
      current.hiddenPaletteIds = [];
      await supabase.from("brand_choices").upsert({
        id: "active_choice",
        hidden_palette_ids: [],
        updated_at: new Date().toISOString(),
      });
    }

    current.updatedAt = new Date().toISOString();
    await writeLocalAssets(current);
    return NextResponse.json(current);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar ativos no Supabase." },
      { status: 500 }
    );
  }
}
