import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { KNOWLEDGE_ARTICLES } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import ReactMarkdown from "react-markdown";
import { Library, Search, BookMarked, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "clinical_procedure", label: "Clinical Procedures" },
  { value: "governance", label: "Governance & IPC" },
  { value: "legislation", label: "Legislation" },
  { value: "anatomy_physiology", label: "Anatomy & Physiology" },
  { value: "pathophysiology", label: "Pathophysiology" },
  { value: "terminology", label: "Terminology" },
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
      if (existing.length > 0) {
        setArticles(existing);
      } else {
        setArticles(KNOWLEDGE_ARTICLES);
      }
    } catch {
      setArticles(KNOWLEDGE_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

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
            <button onClick={() => setSelectedArticle(null)} className="p-1.5 rounded-lg hover:bg-muted">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-bold text-foreground flex-1 truncate">{selectedArticle.title}</h1>
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
                ul: ({ node, ...props }) => <ul className="space-y-1 mb-3 list-disc list-inside" {...props} />,
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
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-xs rounded-lg px-3 py-1.5 whitespace-nowrap font-semibold transition-all ${
              category === cat.value
                ? "bg-clinical-teal text-white"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedArticle(article)}
              className="group w-full text-left rounded-xl border border-border bg-card hover:bg-card hover:border-clinical-teal/40 transition-all p-3 animate-slide-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground mb-0.5">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">{article.source}</p>
                  <div className="mt-1.5">
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