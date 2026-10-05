"use client";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ScanLine,
  Plus,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  symbols,
  palettes,
  typography,
  defaultDirection,
  type Direction,
} from "@/lib/brand-data";
export function BrandSymbol({
  id = 0,
  customSvg,
  customSvgMode = "monochrome",
  className = "",
  size = 72,
  title,
}: {
  id?: number;
  customSvg?: string;
  customSvgMode?: "monochrome" | "original";
  className?: string;
  size?: number;
  title?: string;
}) {
  if (customSvg) {
    const trimmed = customSvg.trim();
    if (trimmed.startsWith("<svg") || trimmed.includes("<svg")) {
      return (
        <span
          className={`brand-custom-symbol-wrapper ${className}`}
          style={{
            width: size,
            height: size,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "inherit",
          }}
          role="img"
          aria-label={title || "Símbolo personalizado"}
          dangerouslySetInnerHTML={{ __html: trimmed }}
        />
      );
    }
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 92 80"
        fill="currentColor"
        aria-label={title || "Símbolo personalizado"}
        role="img"
      >
        <path d={trimmed} />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 92 80"
      fill="currentColor"
      aria-label={title || symbols[id]?.name || "Símbolo abstrato"}
      role="img"
    >
      <path d={symbols[id]?.path || symbols[0].path} />
    </svg>
  );
}
export function Wordmark({
  direction = defaultDirection,
  size = 30,
}: {
  direction?: Direction;
  size?: number;
}) {
  return (
    <div className="wordmark">
      <BrandSymbol
        id={direction.symbol}
        customSvg={direction.customSvg}
        customSvgMode={direction.customSvgMode}
        size={size}
        title={direction.customSvgName}
      />
      <span>{direction.wordmark || "Nexo"}</span>
    </div>
  );
}
export function ApplicationPreview({
  direction = defaultDirection,
  application = "App",
  mini = false,
}: {
  direction?: Direction;
  application?: string;
  mini?: boolean;
}) {
  const p = palettes.find((x) => x.id === direction.palette) || palettes[0],
    c = direction.colors || p.colors;
  const f = typography.find((x) => x.id === direction.font) || typography[0];
  const style = {
    "--brand-primary": c.primary,
    "--brand-secondary": c.secondary,
    "--brand-accent": c.accent,
    "--brand-bg": c.background,
    "--brand-text": c.text,
    "--brand-radius": direction.radius + "px",
    fontFamily: f.font,
  } as React.CSSProperties;
  return (
    <div
      style={style}
      className={
        "application-preview " +
        (mini ? "mini " : "") +
        "application-" +
        application.replace(/ /g, "-").toLowerCase() +
        " brand-style-" +
        direction.style
      }
    >
      {(application === "Logo" || application === "Wordmark") && (
        <div className="logo-specimen">
          <Wordmark direction={direction} />
          <p>Conexões que abrem possibilidades.</p>
        </div>
      )}
      {(application === "Favicon" || application === "App icon") && (
        <div className="icon-specimen">
          <div>
            <BrandSymbol
              id={direction.symbol}
              customSvg={direction.customSvg}
              customSvgMode={direction.customSvgMode}
              title={direction.customSvgName}
              size={application === "Favicon" ? 32 : 80}
            />
          </div>
          <span>
            {application === "Favicon"
              ? "16 px · 32 px · 64 px"
              : "Um universo de possibilidades"}
          </span>
        </div>
      )}
      {application === "App" && (
        <div className="phone">
          <div className="phone-status">
            <b>9:41</b>
            <span>••• ▰</span>
          </div>
          <div className="phone-content">
            <Wordmark direction={direction} />
            <div className="phone-greeting">
              <small>SEU DIA, COM MAIS POSSIBILIDADES</small>
              <h3>
                Olá, Marina <span>↗</span>
              </h3>
              <p>O próximo acesso começa aqui.</p>
            </div>
            <div className="pass-card">
              <div>
                <small>NEXO PASS</small>
                <ArrowUpRight size={18} />
              </div>
              <strong>
                O mundo mais
                <br />
                perto de você.
              </strong>
              <span>Seu passaporte de possibilidades</span>
              <BrandSymbol
                id={direction.symbol}
                customSvg={direction.customSvg}
                customSvgMode={direction.customSvgMode}
                title={direction.customSvgName}
                size={75}
              />
            </div>
            <div className="benefits-heading">
              <b>Para explorar</b>
              <span>
                Ver todos <ArrowRight size={12} />
              </span>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <b>Bem-estar & cuidado</b>
                <small>18 benefícios disponíveis</small>
              </div>
              <ChevronRight size={14} />
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <Plus size={18} />
              </div>
              <div>
                <b>Mais para o seu dia</b>
                <small>Novas possibilidades</small>
              </div>
              <ChevronRight size={14} />
            </div>
            <div className="brand-button">
              Explorar benefícios <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="phone-bar" />
        </div>
      )}
      {application === "Voucher" && (
        <div className="voucher">
          <Wordmark direction={direction} />
          <span className="preview-tag">SEU ACESSO ESTÁ GARANTIDO</span>
          <h3>
            Uma nova
            <br />
            possibilidade.
          </h3>
          <p>Benefício exclusivo na rede Nexo</p>
          <div className="voucher-ticket">
            <QRCodeSVG
              value="https://nexo.example/beneficio/demonstracao"
              size={mini ? 64 : 100}
              fgColor={c.primary}
            />
            <div>
              <small>SEU BENEFÍCIO</small>
              <b>R$ 150</b>
              <span>Apresente na rede parceira</span>
            </div>
          </div>
          <footer>
            VOUCHER DEMONSTRATIVO <ScanLine size={16} />
          </footer>
        </div>
      )}
      {application === "Clínica" && (
        <div className="validation">
          <Wordmark direction={direction} />
          <div className="validation-check">
            <Check size={42} />
          </div>
          <span className="preview-tag">REDE PARCEIRA</span>
          <h3>Acesso confirmado.</h3>
          <p>Marina Silva · Nexo Pass</p>
          <div className="benefit-card">
            <b>Consulta na rede credenciada</b>
            <Check size={20} />
          </div>
          <button type="button" className="brand-button" disabled>
            Validado com sucesso
          </button>
        </div>
      )}
      {(application === "Instagram" || application === "Post") && (
        <div className="social-post">
          <Wordmark direction={direction} />
          <small>MENOS DISTÂNCIA. MAIS POSSIBILIDADES.</small>
          <h3>
            O que importa
            <br />
            está mais
            <br />
            <em>perto.</em>
          </h3>
          <div className="post-symbol">
            <BrandSymbol
              id={direction.symbol}
              customSvg={direction.customSvg}
              customSvgMode={direction.customSvgMode}
              title={direction.customSvgName}
              size={160}
            />
          </div>
          <footer>
            Acesso que conecta. <ArrowUpRight size={22} />
          </footer>
        </div>
      )}
      {(application === "Cartão" || application === "Cartão digital") && (
        <div className="digital-pass">
          <Wordmark direction={direction} />
          <span className="digital-pass-label">
            SEU PASSAPORTE DE POSSIBILIDADES
          </span>
          <BrandSymbol
            id={direction.symbol}
            customSvg={direction.customSvg}
            customSvgMode={direction.customSvgMode}
            title={direction.customSvgName}
            size={170}
          />
          <div>
            <h3>Nexo Pass</h3>
            <p>
              Marina Silva <span>MEMBRO DESDE 2026</span>
            </p>
          </div>
          <footer>
            •••• 0842 <ArrowUpRight size={22} />
          </footer>
        </div>
      )}
      {application === "Landing page" && (
        <div className="landing-preview">
          <nav>
            <Wordmark direction={direction} />
            <span>Como funciona</span>
            <span className="brand-button">
              Conheça o Nexo <ArrowUpRight size={12} />
            </span>
          </nav>
          <div className="landing-hero">
            <div>
              <small>CONEXÕES QUE ABREM POSSIBILIDADES</small>
              <h3>
                Acesso ao que
                <br />
                faz sentido
                <br />
                <em>para você.</em>
              </h3>
              <p>
                Pessoas, serviços e oportunidades.
                <br />
                Mais simples. Mais perto.
              </p>
              <span className="brand-button">
                Explore as possibilidades <ArrowUpRight size={14} />
              </span>
            </div>
            <div className="landing-symbol">
              <BrandSymbol
                id={direction.symbol}
                customSvg={direction.customSvg}
                customSvgMode={direction.customSvgMode}
                title={direction.customSvgName}
                size={190}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export function HeroArt() {
  return (
    <div className="hero-art" aria-label="Estudo visual de conexão e acesso">
      <div className="art-meta">
        <span>ESTUDO 001 / CONEXÃO</span>
        <span>↗</span>
      </div>
      <svg viewBox="0 0 460 265" fill="none">
        <defs>
          <pattern
            id="dots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.6" fill="#B8B7AD" />
          </pattern>
        </defs>
        <rect width="460" height="265" fill="url(#dots)" />
        <path
          d="M80 132H380M230 18V246"
          stroke="#CBCAC2"
          strokeDasharray="3 5"
        />
        <circle cx="170" cy="132" r="88" stroke="#A9AAA0" strokeWidth="1" />
        <circle cx="290" cy="132" r="88" stroke="#A9AAA0" strokeWidth="1" />
        <path
          d="M170 44A88 88 0 0 1 230 68V196A88 88 0 0 1 170 220Z"
          fill="#343E37"
        />
        <path
          d="M290 44A88 88 0 0 0 230 68V196A88 88 0 0 0 290 220Z"
          fill="#D9DBCE"
        />
        <path d="M230 68V196" stroke="#FAFAF5" strokeWidth="10" />
        <circle cx="170" cy="132" r="3" fill="#343E37" />
        <circle cx="290" cy="132" r="3" fill="#343E37" />
        <path d="M68 218H93M80 205V230M367 37H392M380 25V50" stroke="#A2A59A" />
        <text
          x="150"
          y="251"
          fill="#7E8176"
          fontSize="9"
          fontFamily="monospace"
        >
          PERSPECTIVA A
        </text>
        <text
          x="270"
          y="251"
          fill="#7E8176"
          fontSize="9"
          fontFamily="monospace"
        >
          PERSPECTIVA B
        </text>
      </svg>
      <div className="art-caption">
        <span>
          Duas perspectivas.
          <br />
          <b>Um espaço em comum.</b>
        </span>
        <span className="art-nexo">
          nexo<span>®</span>
        </span>
      </div>
    </div>
  );
}
