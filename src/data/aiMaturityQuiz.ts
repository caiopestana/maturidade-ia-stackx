export type Option = {
  label: string;
  score: number;
};

export type ScoredQuestion = {
  id: string;
  prompt: string;
  options: Option[];
};

export type ScoredSection = {
  id: string;
  name: string;
  description: string;
  questions: [ScoredQuestion, ScoredQuestion];
};

export type CompanySizeOption = {
  value: string;
  label: string;
};

export const companySizeOptions: CompanySizeOption[] = [
  { value: "lt10", label: "Menos de 10" },
  { value: "10-50", label: "10 a 50" },
  { value: "51-100", label: "51 a 100" },
  { value: "101-300", label: "101 a 300" },
  { value: "301-500", label: "301 a 500" },
  { value: "501-1000", label: "501 a 1.000" },
  { value: "gt1000", label: "Mais de 1.000" },
  { value: "unknown", label: "Não sei informar" },
];

const fivePointScale = [
  { label: "Nunca", score: 0 },
  { label: "Raramente", score: 1 },
  { label: "Às vezes", score: 2 },
  { label: "Frequentemente", score: 3 },
  { label: "Sempre", score: 4 },
] as const;

export const scoredSections: ScoredSection[] = [
  {
    id: "culture",
    name: "Cultura & Estratégia",
    description: "Alinhamento da liderança, metas e posicionamento estratégico sobre IA.",
    questions: [
      {
        id: "p1",
        prompt: "A IA está nas conversas estratégicas da liderança?",
        options: [...fivePointScale],
      },
      {
        id: "p2",
        prompt: "A empresa possui metas ou indicadores relacionados ao uso de IA?",
        options: [
          { label: "Não possui", score: 0 },
          { label: "Está considerando", score: 1 },
          { label: "Sim, em construção", score: 2 },
          { label: "Sim, parcialmente implementadas", score: 3 },
          { label: "Sim, bem definidas e acompanhadas", score: 4 },
        ],
      },
    ],
  },
  {
    id: "training",
    name: "Capacitação",
    description: "Acesso a treinamentos, trilhas estruturadas e desenvolvimento contínuo.",
    questions: [
      {
        id: "p3",
        prompt: "Os colaboradores têm acesso a treinamentos sobre IA (cursos, workshops)?",
        options: [...fivePointScale],
      },
      {
        id: "p4",
        prompt: "Existe uma trilha de aprendizado estruturada sobre IA?",
        options: [
          { label: "Não", score: 0 },
          { label: "Em planejamento", score: 1 },
          { label: "Sim, inicial", score: 2 },
          { label: "Sim, intermediária", score: 3 },
          { label: "Sim, avançada e contínua", score: 4 },
        ],
      },
    ],
  },
  {
    id: "tools",
    name: "Ferramentas & Processos",
    description: "Uso de ferramentas, incentivo interno e adaptação operacional para IA.",
    questions: [
      {
        id: "p5",
        prompt: "A empresa utiliza e incentiva ferramentas de IA (ChatGPT, Copilot, Midjourney etc.)?",
        options: [
          { label: "Não há uso conhecido", score: 0 },
          { label: "Profissionais usam por conta própria, sem incentivo", score: 1 },
          { label: "Há incentivo informal, sem diretrizes claras", score: 2 },
          { label: "Adoção estruturada em algumas áreas", score: 3 },
          { label: "Adoção padronizada com estratégia e diretrizes definidas", score: 4 },
        ],
      },
      {
        id: "p6",
        prompt: "Os processos foram adaptados para aproveitar o uso de IA?",
        options: [
          { label: "Não foram adaptados", score: 0 },
          { label: "Pouco adaptados", score: 1 },
          { label: "Em fase de adaptação", score: 2 },
          { label: "Bastante adaptados", score: 3 },
          { label: "Totalmente redesenhados", score: 4 },
        ],
      },
    ],
  },
  {
    id: "projects",
    name: "Projetos com IA",
    description: "Evolução de pilotos, implantação prática e estrutura responsável pelas iniciativas.",
    questions: [
      {
        id: "p7",
        prompt: "A empresa já desenvolveu projetos com aplicação prática de IA?",
        options: [
          { label: "Nunca", score: 0 },
          { label: "MVPs ou provas de conceito", score: 1 },
          { label: "Alguns pilotos ativos", score: 2 },
          { label: "Projetos implantados em áreas específicas", score: 3 },
          { label: "Projetos escalados em toda a empresa", score: 4 },
        ],
      },
      {
        id: "p8",
        prompt: "Existe uma área ou time responsável por iniciativas com IA?",
        options: [
          { label: "Não existe", score: 0 },
          { label: "Existe de forma informal", score: 1 },
          { label: "Time ou comitê em formação", score: 2 },
          { label: "Time dedicado parcialmente", score: 3 },
          { label: "Time dedicado exclusivamente", score: 4 },
        ],
      },
    ],
  },
  {
    id: "governance",
    name: "Governança & Ética",
    description: "Diretrizes, revisão de riscos e práticas responsáveis para escalar IA.",
    questions: [
      {
        id: "p9",
        prompt: "A empresa possui diretrizes claras sobre o uso responsável e ético da IA?",
        options: [
          { label: "Não possui", score: 0 },
          { label: "Em discussão", score: 1 },
          { label: "Rascunho elaborado", score: 2 },
          { label: "Diretrizes parciais em vigor", score: 3 },
          { label: "Diretrizes completas e divulgadas", score: 4 },
        ],
      },
      {
        id: "p10",
        prompt: "Existe política ou comitê para revisar riscos da IA (vieses, segurança, privacidade)?",
        options: [
          { label: "Não existe", score: 0 },
          { label: "Está sendo discutido", score: 1 },
          { label: "Política inicial criada", score: 2 },
          { label: "Comitê ativo parcialmente", score: 3 },
          { label: "Comitê ativo e estruturado", score: 4 },
        ],
      },
    ],
  },
];

export type MaturityBand = {
  label: string;
  emoji: string;
  description: string;
  tone: "danger" | "warning" | "caution" | "success" | "info";
};

export const getMaturityBand = (score: number): MaturityBand => {
  if (score <= 1) {
    return {
      label: "Iniciante",
      emoji: "🔴",
      description: "A empresa ainda não iniciou sua jornada com IA.",
      tone: "danger",
    };
  }

  if (score <= 2) {
    return {
      label: "Exploratório",
      emoji: "🟠",
      description: "Há iniciativas pontuais, mas sem estrutura consistente.",
      tone: "warning",
    };
  }

  if (score <= 3) {
    return {
      label: "Em desenvolvimento",
      emoji: "🟡",
      description: "A empresa está construindo bases sólidas para adoção de IA.",
      tone: "caution",
    };
  }

  if (score <= 4) {
    return {
      label: "Avançado",
      emoji: "🟢",
      description: "A IA já faz parte de processos, rituais e times da empresa.",
      tone: "success",
    };
  }

  return {
    label: "Referência",
    emoji: "🔵",
    description: "A empresa é referência no uso estratégico, estruturado e escalável de IA.",
    tone: "info",
  };
};

export const formatScore = (value: number) => value.toFixed(1);

export const normalizeSectionScore = (rawScore: number) => Number(((rawScore / 8) * 5).toFixed(1));
