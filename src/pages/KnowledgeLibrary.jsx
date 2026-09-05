import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { KNOWLEDGE_ARTICLES } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import ReactMarkdown from "react-markdown";
import { Library, Search, BookMarked, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All", description: "Browse the complete clinical knowledge collection.", focus: "Use search or choose a subject area to focus your revision." },
  { value: "clinical_procedure", label: "Clinical Procedures", description: "Step-by-step assessment, communication and person-centred care guidance.", focus: "Focus: safe preparation, systematic practice, documentation and escalation." },
  { value: "governance", label: "Governance & IPC", description: "How services maintain quality, safety and infection prevention standards.", focus: "Focus: accountability, audit, incident learning, standard precautions and antimicrobial stewardship." },
  { value: "legislation", label: "Legislation", description: "Core legal duties that shape safe, ethical health and care practice.", focus: "Focus: consent, capacity, confidentiality, equality, safeguarding and duty of candour." },
  { value: "anatomy_physiology", label: "Anatomy & Physiology", description: "Normal body structures, systems and the processes that maintain homeostasis.", focus: "Focus: structure-function relationships and communication between body systems." },
  { value: "pathophysiology", label: "Pathophysiology", description: "How disease disrupts normal physiology and produces clinical signs and symptoms.", focus: "Focus: recognising patterns, linking observations to mechanisms and escalating deterioration." },
  { value: "terminology", label: "Terminology", description: "Clinical language, abbreviations and measurements used in health records and handovers.", focus: "Focus: accurate interpretation, plain-language explanation and avoiding unsafe abbreviations." },
];

export default function KnowledgeLibrary() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadArticles();
  }, [navigate]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.KnowledgeArticle.list();
      const merged = new Map(existing.map((article) => [article.title, article]));
      KNOWLEDGE_ARTICLES.forEach((article) => merged.set(article.title, article));
      setArticles(Array.from(merged.values()));
    } catch {
      setArticles(KNOWLEDGE_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  const activeCategory = CATEGORIES.find((item) => item.value === category) || CATEGORIES[0];

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.content || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || a.category === category;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
            <button type="button" onClick={() => setSelectedArticle(null)} aria-label="Return to Knowledge Library" className="p-1.5 rounded-lg hover:bg-muted">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-bold leading-snug text-foreground flex-1">{selectedArticle.title}</h1>
          </div>
        </div>
        <div className="px-4 pt-4 pb-24 max-w-3xl mx-auto">
          <div className="mb-3">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground bg-muted rounded px-2 py-0.5">
              {selectedArticle.source}
            </span>
          </div>
          <div className="mb-3">
            <SKBadgeGroup skCodes={selectedArticle.sk_codes || []} poCodes={selectedArticle.performance_outcomes || []} />
          </div>
          <div className="prose prose-sm max-w-none mb-6">
            <ReactMarkdown
              components={{
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-bold text-clinical-teal mt-4 mb-1.5" {...props} />,
                p: ({ node, ...props }) => <p className="text-sm text-foreground/90 leading-relaxed mb-3" {...props} />,
                li: ({ node, ...props }) => <li className="text-sm text-foreground/90 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="space-y-1 mb-3 list-disc pl-5" {...props} />,
                ol: ({ node, ...props }) => <ol className="space-y-1 mb-3 list-decimal pl-5" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
              }}
            >
              {selectedArticle.content}
            </ReactMarkdown>
          </div>
          {selectedArticle.references && selectedArticle.references.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <BookMarked className="w-3 h-3" /> REFERENCES
              </p>
              <ul className="space-y-1">
                {selectedArticle.references.map((ref, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 text-clinical-teal" /> {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Library className="w-5 h-5 text-clinical-teal" />
          Knowledge Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evidence-based clinical reference — NHS England, Clinical Skills.net, peer-reviewed
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles, procedures, conditions…"
          className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal"
        />
      </div>

      {/* Category filter */}
      <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-3 xl:grid-cols-7" role="tablist" aria-label="Knowledge Library categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            role="tab"
            aria-selected={category === cat.value}
            onClick={() => setCategory(cat.value)}
            className={`min-h-12 w-full rounded-xl px-2.5 py-2 text-center text-xs font-semibold leading-snug whitespace-normal break-words transition-all ${
              category === cat.value
                ? "bg-clinical-teal text-white"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <section className="mb-4 rounded-xl border border-clinical-teal/20 bg-clinical-teal/5 px-4 py-3" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">{activeCategory.label}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activeCategory.description}</p>
          </div>
          <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold text-clinical-teal shadow-sm">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-medium leading-relaxed text-foreground/75">{activeCategory.focus}</p>
      </section>

      {/* Articles list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article, idx) => (
            <button
              key={article.id || article.title || idx}
              type="button"
              onClick={() => setSelectedArticle(article)}
              className="group w-full text-left rounded-xl border border-border bg-card hover:bg-card hover:border-clinical-teal/40 transition-all p-3 animate-slide-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground mb-0.5">{article.title}</h3>
                  <p className="text-xs font-medium text-clinical-teal">{article.source}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {(article.content || "").replace(/[#*_`]/g, "").replace(/\\n+/g, " ").trim().slice(0, 180)}
                    {(article.content || "").length > 180 ? "…" : ""}
                  </p>
                  <div className="mt-2">
                    <SKBadgeGroup skCodes={article.sk_codes || []} poCodes={article.performance_outcomes || []} />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-clinical-teal shrink-0 mt-1" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No articles found matching your search.</p>
          )}
        </div>
      )}
    </div>
  );
}