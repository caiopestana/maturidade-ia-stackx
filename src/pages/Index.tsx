import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, RotateCcw, Sun, ArrowRight, ArrowLeft, Download, Sparkles, ShieldCheck, Building2, Mail, Phone, UserRound, BriefcaseBusiness, Globe } from "lucide-react";

import stackxDarkmode from "@/assets/stackx-darkmode.svg";
import stackxWhitemode from "@/assets/stackx-whitemode.svg";
import { Button } from "@/components/ui/button";
import { companySizeOptions, formatScore, getMaturityBand, normalizeSectionScore, scoredSections } from "@/data/aiMaturityQuiz";

type ThemeMode = "dark" | "light";
type Screen = "intro" | "quiz" | "results";

type IntroData = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  consent: boolean;
};

type Answers = Record<string, number>;

const personalMailDomains = [
  "gmail.com", "yahoo.com", "yahoo.com.br", "hotmail.com", "hotmail.com.br",
  "outlook.com", "outlook.com.br", "uol.com.br", "bol.com.br", "ig.com.br",
  "terra.com.br", "icloud.com", "me.com", "msn.com", "live.com"
];

const getValidationSchemas = async () => {
  const { z } = await import("zod");
  const introSchema = z.object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    jobTitle: z.string().trim().min(2, "Informe seu cargo."),
    email: z.string().trim().email("Use um e-mail válido.").refine(
      (val) => {
        const domain = val.split('@')[1];
        return domain && !personalMailDomains.includes(domain.toLowerCase());
      },
      { message: "Por favor, utilize um e-mail corporativo válido ao invés de pessoal." }
    ),
    phone: z.string().trim().regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Informe um celular com DDD válido."),
    companyName: z.string().trim().min(2, "Informe o nome da empresa."),
    companySize: z.string().min(1, "Selecione o número de colaboradores."),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Você precisa concordar com os Termos e Políticas de Privacidade." })
    })
  });
  const openQuestionSchema = z.string().max(500, "A resposta pode ter no máximo 500 caracteres.");
  return { introSchema, openQuestionSchema };
};

const initialIntroData: IntroData = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  companyName: "",
  companySize: "",
  consent: false
};

const steps = ["intro", ...scoredSections.map((section) => section.id), "open"] as const;

const StackXMark = ({ theme }: { theme: ThemeMode }) =>
  <div className="inline-flex items-center rounded-full border border-border bg-card py-2 px-4 shadow-soft">
    <img
      src={theme === "dark" ? stackxDarkmode : stackxWhitemode}
      alt="Diagnóstico de Maturidade em IA"
      width={36}
      height={36}
      className="h-9 w-9 object-contain mr-3" />
    <span className="text-sm sm:text-base font-sans font-semibold whitespace-nowrap">Diagnóstico de Maturidade em IA</span>
  </div>;



const Index = () => {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [screen, setScreen] = useState<Screen>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [introData, setIntroData] = useState<IntroData>(initialIntroData);
  const [answers, setAnswers] = useState<Answers>({});
  const [openAnswer, setOpenAnswer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("stackx-theme") as ThemeMode | null;
    const initialTheme = storedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    window.localStorage.setItem("stackx-theme", theme);
  }, [theme]);

  const answeredRequiredCount = useMemo(() => {
    const introCount = [
      introData.fullName,
      introData.jobTitle,
      introData.email,
      introData.phone,
      introData.companyName,
      introData.companySize].
      filter(Boolean).length + (introData.consent ? 1 : 0);

    return introCount + Object.keys(answers).length;
  }, [answers, introData]);

  const totalRequiredCount = 17;
  const progressPercent = Math.round(answeredRequiredCount / totalRequiredCount * 100);

  const sectionScores = useMemo(
    () =>
      scoredSections.map((section) => {
        const rawScore = section.questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0);
        const score = normalizeSectionScore(rawScore);
        return {
          ...section,
          rawScore,
          score,
          band: getMaturityBand(score)
        };
      }),
    [answers]
  );

  const overallScore = useMemo(() => {
    const scored = sectionScores.reduce((sum, section) => sum + section.score, 0);
    return Number((scored / sectionScores.length).toFixed(1));
  }, [sectionScores]);

  const overallBand = getMaturityBand(overallScore);
  const currentStep = steps[stepIndex];
  const currentSection = scoredSections.find((section) => section.id === currentStep);

  const currentDateLabel = useMemo(
    () =>
      (completedAt ?? new Date()).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
    [completedAt]
  );

  const resultNarrative = useMemo(() => {
    const topSection = [...sectionScores].sort((a, b) => b.score - a.score)[0];
    const lowSection = [...sectionScores].sort((a, b) => a.score - b.score)[0];

    return `Seu diagnóstico indica um estágio ${overallBand.label.toLowerCase()} em IA. ${topSection.name} aparece como o ponto mais forte, enquanto ${lowSection.name} representa a principal oportunidade para estruturar a próxima evolução do time.`;
  }, [overallBand.label, sectionScores]);

  const toggleTheme = () => setTheme((prev) => prev === "dark" ? "light" : "dark");

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleIntroChange = (field: keyof IntroData, value: string | boolean) => {
    const nextValue = field === "phone" && typeof value === "string" ? formatPhoneInput(value) : value;
    setIntroData((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateCurrentStep = () => {
    if (currentStep === "intro") {
      const result = introSchema.safeParse(introData);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        const nextErrors = Object.fromEntries(
          Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? "Campo inválido."])
        );
        setErrors(nextErrors);
        return false;
      }

      setErrors({});
      return true;
    }

    if (currentStep === "open") {
      const result = openQuestionSchema.safeParse(openAnswer);
      if (!result.success) {
        setErrors({ open: result.error.issues[0]?.message ?? "Resposta inválida." });
        return false;
      }

      setErrors({});
      return true;
    }

    if (currentSection) {
      const missing = currentSection.questions.filter((question) => answers[question.id] === undefined);
      if (missing.length > 0) {
        setErrors({
          [currentSection.id]: "Responda as duas perguntas da seção para continuar."
        });
        return false;
      }
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (stepIndex === steps.length - 1) {
      setCompletedAt(new Date());
      setScreen("results");
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      setScreen("intro");
      return;
    }

    setErrors({});
    setStepIndex((prev) => prev - 1);
  };

  const startQuiz = () => {
    setScreen("quiz");
    setStepIndex(0);
  };

  const restartQuiz = () => {
    setScreen("intro");
    setStepIndex(0);
    setIntroData(initialIntroData);
    setAnswers({});
    setOpenAnswer("");
    setErrors({});
    setCompletedAt(null);
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;

    setIsGeneratingPdf(true);
    try {
      const element = reportRef.current;

      // Save original styles
      const originalStyle = element.getAttribute("style") || "";
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      const originalMargin = element.style.margin;

      // Temporarily fix dimensions to forces desktop layout for the PDF
      // so responsive classes don't mess up when html2canvas captures
      element.style.width = "1200px";
      element.style.maxWidth = "1200px";
      element.style.margin = "0";

      // Yield thread to allow DOM to paint the new dimensions
      await new Promise(resolve => setTimeout(resolve, 50));

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: theme === "dark" ? "#0A0A0A" : "#F5F5F5",
        useCORS: true,
        windowWidth: 1200,
        width: 1200
      });

      // Restore original styles immediately after capture
      element.setAttribute("style", originalStyle);
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.margin = originalMargin;

      const imageData = canvas.toDataURL("image/png");
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`diagnostico-stackx-${introData.companyName || "empresa"}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderProgressHeader = () => {
    if (screen !== "quiz") return null;

    return (
      <div className="panel-card sticky top-4 z-20 p-4 sm:p-5 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 opacity-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Progresso global</p>
            <p className="text-sm text-muted-foreground">{answeredRequiredCount} de {totalRequiredCount} respostas obrigatórias concluídas</p>
          </div>
          <div className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold">{progressPercent}%</div>
        </div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>);

  };

  const renderIntro = () =>
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 flex flex-col justify-center min-h-[85vh]">
      <section className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch lg:gap-12">
        <div className="bento-card bg-hero-gradient relative flex flex-col justify-center overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative space-y-6">
            <StackXMark theme={theme} />
            <div className="max-w-2xl space-y-4">
              <p className="section-label font-sans">Diagnóstico estratégico</p>
              <h1 className="text-balance text-4xl leading-none sm:text-6xl font-sans font-semibold">
                Descubra o nível de maturidade em IA da sua empresa.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg font-sans">Um diagnóstico interativo com o objetivo de mapear cultura, capacitação, processos, projetos e governança com IA dentro das empresas.

              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 pt-2">
              <Button variant="hero" size="lg" onClick={startQuiz} className="w-full sm:w-auto">
                Iniciar diagnóstico <ArrowRight />
              </Button>
              <Button variant="subtle" size="lg" asChild className="w-full sm:w-auto bg-transparent border-transparent shadow-none">
                <a href="https://www.stackx.com.br" target="_blank" rel="noreferrer">
                  <Globe className="mr-2 h-4 w-4" /> Voltar para o site
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-8">
          {[
            {
              icon: ShieldCheck,
              title: "5 pilares avaliados",
              text: "Cultura, capacitação, ferramentas, projetos e governança em uma leitura clara de 0 a 5."
            },
            {
              icon: Building2,
              title: "Visão para liderança",
              text: "Ideal para founders, RH, tecnologia e gestores que precisam decidir próximos passos com evidência."
            },
            {
              icon: Sparkles,
              title: "Resultado acionável",
              text: "Receba um retrato imediato do momento atual e onde concentrar os esforços do time."
            }].
            map((item) =>
              <article key={item.title} className="panel-card group p-6 sm:p-8 transition-transform duration-300 hover:-translate-y-1">
                <item.icon className="mb-4 h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                <h2 className="mb-2 text-2xl font-bold font-sans">{item.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            )}
        </div>
      </section>
    </main>;


  const renderInfoStep = () =>
    <section className="grid gap-6 md:gap-8 lg:grid-cols-[0.8fr_1.2fr] xl:gap-16">
      <aside className="panel-card p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
        <p className="section-label">Seção 1</p>
        <h2 className="mt-4 text-3xl font-bold font-sans">Informações iniciais</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Antes do diagnóstico, precisamos de alguns dados para te conhecer melhor para personalizar sua experiência com nosso diagnóstico de maturidade.

        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { icon: UserRound, label: "Nome, cargo e empresa" },
            { icon: Mail, label: "E-mail corporativo validado" },
            { icon: Phone, label: "Celular com DDD" },
            { icon: BriefcaseBusiness, label: "Porte da organização" }].
            map((item) =>
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="font-sans">{item.label}</span>
              </div>
            )}
        </div>
      </aside>

      <div className="bento-card p-6 sm:p-8 lg:p-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { key: "fullName", label: "Nome completo", type: "text" },
            { key: "jobTitle", label: "Cargo", type: "text" },
            { key: "email", label: "E-mail corporativo", type: "email" },
            { key: "phone", label: "Celular com DDD", type: "tel" },
            { key: "companyName", label: "Nome da empresa", type: "text" }].
            map((field) =>
              <label key={field.key} className={`flex flex-col gap-2 ${field.key === "companyName" ? "sm:col-span-2" : ""}`}>
                <span className="text-sm font-semibold font-sans">{field.label}</span>
                <input
                  type={field.type}
                  value={introData[field.key as keyof IntroData] as string}
                  onChange={(event) => handleIntroChange(field.key as keyof IntroData, event.target.value)}
                  className="h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                  placeholder={field.label} />

                {errors[field.key] && <span className="text-sm text-danger">{errors[field.key]}</span>}
              </label>
            )}
        </div>

        <div className="mt-8">
          <p className="mb-4 text-sm font-semibold font-sans">Número de colaboradores na empresa</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {companySizeOptions.map((option) => {
              const selected = introData.companySize === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleIntroChange("companySize", option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-300 ${selected ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/40"}`
                  }>

                  {option.label}
                </button>);

            })}
          </div>
          {errors.companySize && <span className="mt-2 block text-sm text-danger">{errors.companySize}</span>}
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-panel p-4 text-sm">
          <input
            type="checkbox"
            checked={introData.consent}
            onChange={(event) => handleIntroChange("consent", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring my-[2px]" />

          <span>
            Concordo com os Termos e Políticas de Privacidade.
            {errors.consent && <span className="mt-1 block text-danger">{errors.consent}</span>}
          </span>
        </label>
      </div>
    </section>;


  const renderScoredStep = () => {
    if (!currentSection) return null;

    return (
      <section className="grid gap-6 md:gap-8 lg:grid-cols-[0.8fr_1.2fr] xl:gap-16">
        <aside className="panel-card p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <p className="section-label">Seção {stepIndex + 1}</p>
          <h2 className="mt-4 text-3xl font-bold font-sans">{currentSection.name}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-sans">{currentSection.description}</p>
        </aside>

        <div className="grid gap-6 md:gap-8">
          {currentSection.questions.map((question, index) =>
            <article key={question.id} className="bento-card p-6 sm:p-8 lg:p-10">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-left font-sans">{question.prompt}</h3>
                </div>
              </div>

              <div className="grid gap-3">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.score;
                  return (
                    <button
                      key={`${question.id}-${option.label}`}
                      type="button"
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, [question.id]: option.score }));
                        setErrors((prev) => ({ ...prev, [currentSection.id]: "" }));
                      }}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${selected ?
                        "border-primary bg-accent shadow-glow" :
                        "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40"}`
                      }>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium font-sans">{option.label}</span>
                      </div>
                    </button>);

                })}
              </div>
            </article>
          )}
          {errors[currentSection.id] && <p className="text-sm text-danger">{errors[currentSection.id]}</p>}
        </div>
      </section>);

  };

  const renderOpenStep = () =>
    <section className="grid gap-6 md:gap-8 lg:grid-cols-[0.8fr_1.2fr] xl:gap-16">
      <aside className="panel-card p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
        <p className="section-label">Seção final</p>
        <h2 className="mt-4 text-3xl font-bold font-sans">Pergunta aberta</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-sans">Compartilhe um desafio atual relacionado a IA.

        </p>
      </aside>

      <div className="bento-card p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
        <label className="flex flex-col gap-4">
          <span className="text-sm font-semibold font-sans">Existe algum desafio atual em IA que você gostaria de resolver no seu time?</span>
          <textarea
            value={openAnswer}
            maxLength={500}
            onChange={(event) => {
              setOpenAnswer(event.target.value);
              setErrors((prev) => ({ ...prev, open: "" }));
            }}
            className="min-h-[220px] rounded-[1.5rem] border border-input bg-background p-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
            placeholder="Opcional: descreva contexto, gargalos ou oportunidades." />

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="font-sans">Opcional · até 500 caracteres</span>
            <span>{openAnswer.length}/500</span>
          </div>
          {errors.open && <span className="text-sm text-danger">{errors.open}</span>}
        </label>
      </div>
    </section>;


  const renderQuiz = () =>
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="space-y-8 sm:space-y-12">
        {renderProgressHeader()}
        {currentStep === "intro" && renderInfoStep()}
        {currentSection && renderScoredStep()}
        {currentStep === "open" && renderOpenStep()}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="subtle" size="lg" onClick={handleBack}>
            <ArrowLeft /> Voltar
          </Button>
          <Button variant="hero" size="lg" onClick={handleNext}>
            {stepIndex === steps.length - 1 ? "Ver resultado" : "Próximo"} <ArrowRight />
          </Button>
        </div>
      </div>
    </main>;


  const renderResults = () =>
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="space-y-8 lg:space-y-12" ref={reportRef}>
        <section className="grid gap-8">
          <div className="bento-card p-6 sm:p-10 lg:p-14">
            <div className="flex flex-row justify-between items-start gap-5 border-b border-border pb-8">
              <div className="flex flex-col gap-1">
                <p className="section-label">Diagnóstico de Maturidade em IA</p>
                <div className="h-1 w-12 rounded-full bg-primary mt-1" />
              </div>
              <img
                src={theme === "dark" ? stackxDarkmode : stackxWhitemode}
                alt="StackX"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              />
            </div>

            <div className="pt-6">
              <p className="section-label text-muted-foreground/60">Resultado final</p>
              <h1 className="mt-3 mb-4 font-display text-4xl sm:text-5xl font-bold leading-normal pt-1 pb-1 break-words">{introData.fullName}</h1>
              <p className="text-base text-muted-foreground">{introData.companyName} · {introData.jobTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">Realizado em {currentDateLabel}</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-[0.6fr_0.4fr] lg:gap-8">
              <div className="panel-card p-8 lg:p-10">
                <p className="section-label">Pontuação geral</p>
                <div className="mt-6 flex items-end gap-3">
                  <span className="font-display text-7xl font-bold leading-none">{formatScore(overallScore)}</span>
                  <span className="pb-3 text-xl text-muted-foreground">/ 5</span>
                </div>
                <p className={`mt-5 text-xl font-bold tone-${overallBand.tone}`}>
                  {overallBand.emoji} {overallBand.label}
                </p>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{resultNarrative}</p>
              </div>

              <div className="panel-card p-8 lg:p-10 flex flex-col justify-center">
                <p className="section-label">Leitura rápida</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>• {overallBand.description}</p>
                  <p>• O relatório detalha os 5 pilares pontuados em escala normalizada.</p>
                  <p>• Use o PDF para compartilhar a análise com sua liderança.</p>
                </div>
              </div>
            </div>
          </div>

          {openAnswer &&
            <div className="panel-card p-6">
              <p className="section-label">Desafio atual</p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{openAnswer}</p>
            </div>
          }
        </section>

        <section className="flex flex-wrap gap-6 lg:gap-8">
          {sectionScores.map((section) =>
            <article key={section.id} className="bento-card p-6 sm:p-8 flex-1 min-w-[300px] lg:min-w-[340px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">Pilar avaliado</p>
                  <h2 className="mt-2 text-2xl font-semibold">{section.name}</h2>
                </div>
                <div className="text-lg font-bold whitespace-nowrap">
                  {formatScore(section.score)}<span className="text-xs font-semibold text-muted-foreground ml-1">/ 5</span>
                </div>
              </div>
              <div className="mt-5 score-bar">
                <div className="score-bar-fill" style={{ width: `${section.score / 5 * 100}%` }} />
              </div>
              <p className={`mt-4 text-sm font-semibold tone-${section.band.tone}`}>
                {section.band.emoji} {section.band.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.band.description}</p>
            </article>
          )}
        </section>
      </div >

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="panel-card p-8 sm:p-12 flex flex-col justify-center">
          <p className="section-label">Ações</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="hero" size="lg" onClick={exportPdf} disabled={isGeneratingPdf}>
              <Download /> {isGeneratingPdf ? "Gerando PDF..." : "Baixar meu diagnóstico em PDF"}
            </Button>
            <Button variant="subtle" size="lg" onClick={restartQuiz}>
              <RotateCcw /> Refazer o diagnóstico
            </Button>
            <Button variant="subtle" size="lg" asChild>
              <a href="https://www.stackx.com.br" target="_blank" rel="noreferrer">
                <Globe /> Voltar para o site
              </a>
            </Button>
          </div>
        </div>

        <div className="bento-card p-6 sm:p-10 lg:p-12">
          <p className="section-label">Próximo passo</p>
          <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold text-balance">
            Quer dar o próximo passo no desenvolvimento do seu time em IA?
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Fale com um dos especialistas da StackX para entender a solução ideal para o momento da sua empresa.
          </p>
          <Button variant="hero" size="lg" className="mt-5" asChild>
            <a href="https://wa.me/554799569692?text=Fiz%20meu%20diagn%C3%B3stico%20de%20maturidade%20em%20IA%20para%20minha%20empresa,%20e%20gostaria%20de%20saber%20como%20a%20StackX%20pode%20ajudar%20meu%20time%20a%20se%20desenvolver%20com%20IA" target="_blank" rel="noreferrer">
              Falar com especialistas <ArrowRight />
            </a>
          </Button>
        </div>
      </section>
    </main >;


  return (
    <div className="app-shell">
      <header className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-4 py-6 sm:py-8">
        <StackXMark theme={theme} />
        <Button variant="subtle" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </header>

      {screen === "intro" && renderIntro()}
      {screen === "quiz" && renderQuiz()}
      {screen === "results" && renderResults()}
    </div>);

};

export default Index;