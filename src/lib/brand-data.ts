export type Colors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};
export const palettes = [
  {
    id: "confidence",
    name: "Confiança contemporânea",
    description: "Madura, confiável e humana.",
    colors: {
      primary: "#234E52",
      secondary: "#D9CDBA",
      accent: "#D9806C",
      background: "#F7F5EF",
      text: "#252A29",
    },
  },
  {
    id: "energy",
    name: "Energia conectiva",
    description: "Conexão, movimento e energia.",
    colors: {
      primary: "#243F70",
      secondary: "#ADC8D9",
      accent: "#C97540",
      background: "#F8F2E5",
      text: "#292C31",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Sofisticada, distinta e editorial.",
    colors: {
      primary: "#602D40",
      secondary: "#DCC0C2",
      accent: "#8598AA",
      background: "#F7F0E4",
      text: "#30292B",
    },
  },
  {
    id: "human",
    name: "Digital humana",
    description: "Humana, tecnológica e calma.",
    colors: {
      primary: "#285A50",
      secondary: "#C9C1E0",
      accent: "#D7C4A4",
      background: "#F8F6EB",
      text: "#292E2C",
    },
  },
  {
    id: "structural",
    name: "Estrutural",
    description: "Precisão, estrutura e confiança.",
    colors: {
      primary: "#1D2A3C",
      secondary: "#B9C0C5",
      accent: "#D8BC58",
      background: "#F6F5F0",
      text: "#24282D",
    },
  },
  {
    id: "expressive",
    name: "Expressiva",
    description: "Forte, jovem e contemporânea.",
    colors: {
      primary: "#4D327A",
      secondary: "#96B3CC",
      accent: "#ED8B7C",
      background: "#F8F1E5",
      text: "#2B2931",
    },
  },
];
export const typography = [
  {
    id: "manrope",
    name: "Manrope",
    category: "Geométrica",
    font: "Manrope, sans-serif",
    description: "Geometria clara com um toque de humanidade.",
  },
  {
    id: "dm",
    name: "DM Sans",
    category: "Humanista",
    font: '"DM Sans", sans-serif',
    description: "Aberta, acessível e naturalmente próxima.",
  },
  {
    id: "inter",
    name: "Inter",
    category: "Neo-grotesca",
    font: "Inter, sans-serif",
    description: "Clareza e equilíbrio para interfaces.",
  },
  {
    id: "instrument",
    name: "Instrument Serif",
    category: "Editorial",
    font: '"Instrument Serif", Georgia, serif',
    description: "Contraste e personalidade editorial.",
  },
  {
    id: "space",
    name: "Space Grotesk",
    category: "Técnica",
    font: '"Space Grotesk", monospace',
    description: "Precisão digital com detalhes singulares.",
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    category: "Contemporânea",
    font: '"Plus Jakarta Sans", sans-serif',
    description: "Presença, ritmo e uma construção contemporânea.",
  },
];
export const concepts = [
  {
    id: "meeting",
    name: "O Encontro",
    phrase: "Algo novo nasce entre duas partes.",
    description:
      "Duas partes independentes se aproximam. O espaço entre elas se torna uma ponte entre pessoas e possibilidades.",
    words: ["Conexão", "Encontro", "Acesso"],
    symbol: 0,
  },
  {
    id: "link",
    name: "Elo",
    phrase: "O elemento que torna a conexão possível.",
    description:
      "Uma estrutura intermediária une necessidades e serviços. Conexão estrutural, sem a representação literal de uma corrente.",
    words: ["Vínculo", "Estrutura", "Proximidade"],
    symbol: 2,
  },
  {
    id: "intersection",
    name: "Interseção",
    phrase: "Onde caminhos e oportunidades se encontram.",
    description:
      "Sobreposições e espaços compartilhados revelam um novo território. Um ponto de convergência entre diferentes caminhos.",
    words: ["Convergência", "Rede", "Possibilidade"],
    symbol: 4,
  },
  {
    id: "passage",
    name: "Passagem",
    phrase: "Uma abertura para o que vem depois.",
    description:
      "Uma conexão cria acesso ao que antes estava distante. Abertura abstrata, continuidade e novas possibilidades.",
    words: ["Abertura", "Continuidade", "Descoberta"],
    symbol: 10,
  },
];
export const symbols = [
  {
    id: 0,
    name: "Entre partes",
    family: "Encontro",
    path: "M12 12H40V40H12Z M52 40H80V68H52Z M12 44H36V68H12Z M56 12H80V36H56Z",
  },
  {
    id: 1,
    name: "Aproximação",
    family: "Encontro",
    path: "M12 20A22 22 0 0 1 44 40A22 22 0 0 1 12 60Z M80 20A22 22 0 0 0 48 40A22 22 0 0 0 80 60Z",
  },
  {
    id: 2,
    name: "Ponte",
    family: "Conexão",
    path: "M10 14H28V32H64V14H82V66H64V48H28V66H10Z",
  },
  {
    id: 3,
    name: "Continuidade",
    family: "Conexão",
    path: "M10 16H30V46H62V16H82V66H42V36H30V66H10Z",
  },
  {
    id: 4,
    name: "Área comum",
    family: "Interseção",
    path: "M14 14H50V30H78V66H42V50H14Z",
  },
  {
    id: 5,
    name: "Convergência",
    family: "Interseção",
    path: "M12 12H32V30H60V12H80V48H60V68H40V48H12Z",
  },
  {
    id: 6,
    name: "N essencial",
    family: "N oculto",
    path: "M12 68V12H32L60 42V12H80V68H60L32 38V68Z",
  },
  {
    id: 7,
    name: "Intervalo",
    family: "N oculto",
    path: "M12 12H34V52H12Z M58 28H80V68H58Z M38 12H54L54 68H38Z",
  },
  {
    id: 8,
    name: "Enlace",
    family: "NX",
    path: "M12 12H32L46 28L60 12H80L58 40L80 68H60L46 52L32 68H12L34 40Z",
  },
  {
    id: 9,
    name: "Desdobramento",
    family: "NX",
    path: "M12 12H36V32H56V12H80V36H60V44H80V68H56V48H36V68H12V44H32V36H12Z",
  },
  {
    id: 10,
    name: "Abertura",
    family: "Passagem",
    path: "M12 68V12H80V68H58V34H34V68Z",
  },
  {
    id: 11,
    name: "Horizonte",
    family: "Passagem",
    path: "M12 14H80V34H34V48H80V68H12Z",
  },
];
export const attributes = [
  "Confiável",
  "Acessível",
  "Inteligente",
  "Tecnológica",
  "Humana",
  "Sólida",
  "Jovem",
  "Premium",
  "Popular",
  "Elegante",
  "Prática",
  "Ousada",
  "Acolhedora",
  "Precisa",
  "Energética",
  "Sofisticada",
  "Simples",
  "Institucional",
  "Contemporânea",
  "Disruptiva",
];
export const foundations = [
  "Plataforma de acesso",
  "Rede de benefícios",
  "Conexão entre pessoas e serviços",
  "Passaporte de benefícios",
  "Infraestrutura digital",
  "Ecossistema de parceiros",
  "Plataforma de serviços",
  "Marketplace",
  "Clube de vantagens",
  "Outro",
];
export const ideas = [
  "Conexão",
  "Acesso",
  "Confiança",
  "Oportunidade",
  "Facilidade",
  "Benefício",
  "Descoberta",
  "Economia",
  "Tecnologia",
  "Cuidado",
];
export const futures = [
  {
    id: "health",
    name: "Especialista em saúde",
    description: "Uma grande plataforma de acesso a serviços de saúde.",
  },
  {
    id: "benefits",
    name: "Plataforma de benefícios",
    description: "Começa na saúde e oferece vantagens em diferentes setores.",
  },
  {
    id: "connections",
    name: "Plataforma de conexões",
    description:
      "Conecta pessoas a serviços, oportunidades e parceiros de diversas categorias.",
  },
  {
    id: "b2b",
    name: "Infraestrutura B2B",
    description:
      "Uma infraestrutura para empresas oferecerem acesso e benefícios.",
  },
  {
    id: "ecosystem",
    name: "Ecossistema",
    description:
      "Consumidores, empresas, parceiros e serviços em uma mesma rede.",
  },
];
export const spectra = [
  ["Popular", "Premium"],
  ["Humano", "Técnico"],
  ["Calmo", "Energético"],
  ["Discreto", "Ousado"],
  ["Institucional", "Jovem"],
  ["Minimalista", "Expressivo"],
  ["Editorial", "Tecnológico"],
  ["Amigável", "Preciso"],
  ["Clássico", "Contemporâneo"],
  ["Suave", "Forte"],
];
export const forms = [
  {
    id: "rigid",
    name: "Geométrico rígido",
    radius: 0,
    description: "Linhas exatas. Estrutura e clareza.",
  },
  {
    id: "soft",
    name: "Geométrico suavizado",
    radius: 12,
    description: "Geometria com uma presença próxima.",
  },
  {
    id: "architectural",
    name: "Arquitetônico",
    radius: 0,
    description: "Espaço, escala e composições estruturais.",
  },
  {
    id: "editorial",
    name: "Editorial",
    radius: 3,
    description: "Hierarquia, contraste e ritmo visual.",
  },
  {
    id: "modular",
    name: "Modular",
    radius: 6,
    description: "Um sistema de partes que se conectam.",
  },
  {
    id: "organic",
    name: "Orgânico controlado",
    radius: 24,
    description: "Curvas e fluidez com consistência.",
  },
];
export const photoPairs = [
  ["Pessoas", "Objetos"],
  ["Documental", "Publicitário"],
  ["Luz natural", "Estúdio"],
  ["Ambiente real", "Fundo controlado"],
  ["Close-up", "Plano aberto"],
  ["Cores naturais", "Tratamento forte"],
];
export const priorities = [
  ["Memorabilidade", "Neutralidade"],
  ["Simplicidade", "Expressividade"],
  ["Confiança", "Ousadia"],
  ["Acessibilidade", "Exclusividade"],
  ["Humanidade", "Tecnologia"],
  ["Flexibilidade", "Personalidade"],
  ["Modernidade", "Atemporalidade"],
];
export const applications = [
  "App",
  "Voucher",
  "Clínica",
  "Instagram",
  "Cartão digital",
  "Landing page",
];
export const sections = [
  { name: "Fundamentos", description: "O que nos move", group: 0 },
  { name: "Futuro da marca", description: "Para onde vamos", group: 0 },
  { name: "Personalidade", description: "Como queremos ser", group: 0 },
  { name: "Espectro visual", description: "Encontre o equilíbrio", group: 0 },
  {
    name: "Territórios conceituais",
    description: "Uma ideia que conecta",
    group: 1,
  },
  { name: "Símbolos", description: "Explore as possibilidades", group: 1 },
  { name: "Paletas", description: "A cor de uma sensação", group: 1 },
  { name: "Tipografia", description: "A voz da nossa marca", group: 1 },
  { name: "Formas", description: "Nossa linguagem gráfica", group: 1 },
  {
    name: "Fotografia / imagens",
    description: "Um olhar sobre o mundo",
    group: 1,
  },
  { name: "Aplicações", description: "A marca na vida real", group: 1 },
  { name: "Prioridades", description: "O que vem primeiro", group: 2 },
];
export type Answers = Record<
  string,
  string | string[] | number | number[] | Record<string, string> | Colors[]
>;
export type Direction = {
  id: string;
  name: string;
  symbol: number;
  palette: string;
  font: string;
  radius: number;
  wordmark: string;
  style: string;
  colors?: Colors;
  participantId?: string;
  customSvg?: string;
  customSvgName?: string;
  customSvgMode?: "monochrome" | "original";
};
export type Participant = {
  id: string;
  name: string;
  token?: string;
  answers: Answers;
  completed: number[];
  finishedAt?: string;
};
export type Session = {
  id: string;
  name: string;
  ownerHash?: string;
  createdAt: string;
  participants: Participant[];
  directions: Direction[];
  votes: Record<string, string>;
  mode?: string;
  revision?: number;
};
export const defaultDirection: Direction = {
  id: "",
  name: "Exploração livre",
  symbol: 0,
  palette: "confidence",
  font: "manrope",
  radius: 12,
  wordmark: "Nexo",
  style: "soft",
};
export function sectionValid(section: number, a: Answers): boolean {
  const arr = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
  const rank = (k: string) =>
    !!a[k + "First"] && !!a[k + "Second"] && a[k + "First"] !== a[k + "Second"];
  switch (section) {
    case 0:
      return (
        arr("foundation").every((x) => foundations.includes(x)) &&
        new Set(arr("foundation")).size === arr("foundation").length &&
        arr("foundation").length >= 1 &&
        arr("foundation").length <= 3 &&
        !!String(a.connectFrom || "").trim() &&
        !!String(a.connectTo || "").trim() &&
        arr("ideas").length === 10 &&
        new Set(arr("ideas")).size === 10 &&
        arr("ideas").every((x) => ideas.includes(x)) &&
        (!arr("foundation").includes("Outro") ||
          !!String(a.foundationOther || "").trim())
      );
    case 1:
      return futures.some((x) => x.id === a.future);
    case 2:
      return (
        new Set(arr("personality")).size === 5 &&
        new Set(arr("avoid")).size === 5 &&
        [...arr("personality"), ...arr("avoid")].every((x) =>
          attributes.includes(x),
        ) &&
        arr("personality").length === 5 &&
        arr("avoid").length === 5 &&
        !arr("personality").some((x) => arr("avoid").includes(x))
      );
    case 3:
      return (
        arr("spectrum").length === 10 &&
        (a.spectrum as number[]).every(
          (x) => Number.isInteger(x) && x >= 1 && x <= 7,
        )
      );
    case 4:
      return (
        concepts.some((x) => x.id === a.conceptFirst) &&
        concepts.some((x) => x.id === a.conceptSecond) &&
        rank("concept") &&
        !!String(a.conceptLikes || "").trim() &&
        !!String(a.conceptRejects || "").trim()
      );
    case 5:
      return (
        arr("symbolTop").length === 3 &&
        new Set(arr("symbolTop")).size === 3 &&
        arr("symbolTop").every((x) => symbols.some((s) => String(s.id) === x))
      );
    case 6:
      return (
        rank("palette") &&
        palettes.some((x) => x.id === a.paletteFirst) &&
        palettes.some((x) => x.id === a.paletteSecond)
      );
    case 7:
      return (
        rank("font") &&
        ["First", "Second", "Reject"].every((k) =>
          typography.some((x) => x.id === a["font" + k]),
        ) &&
        a.fontReject !== a.fontFirst &&
        a.fontReject !== a.fontSecond
      );
    case 8:
      return (
        forms.some((x) => x.id === a.form) &&
        [0, 6, 12, 16, 24, 99].includes(Number(a.radius)) &&
        typeof a.radius === "number"
      );
    case 9:
      return (
        arr("photo").length === 6 &&
        photoPairs.every((pair, i) => pair.includes(arr("photo")[i])) &&
        typeof a.photoDependency === "number" &&
        a.photoDependency >= 1 &&
        a.photoDependency <= 7
      );
    case 10:
      return applications.every((x) =>
        ["Muito Nexo", "Talvez", "Nada Nexo"].includes(
          (a.application as Record<string, string>)?.[x],
        ),
      );
    case 11:
      return (
        arr("priorities").length === 7 &&
        priorities.every((pair, i) => pair.includes(arr("priorities")[i]))
      );
    default:
      return false;
  }
}
