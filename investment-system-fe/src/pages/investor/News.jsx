import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  CalendarDays,
  UserRound,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "./News.module.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_IMAGES = {
  Gold:   "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80",
  Silver: "https://images.unsplash.com/photo-1610375461369-d613b5647341?auto=format&fit=crop&w=1200&q=80",
};

const API_BASE = "http://localhost:8002/news";

const CATEGORIES = ["All", "Gold", "Silver"];
const ARTICLES_PER_PAGE = 9;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Normalise one raw API article into the shape the UI expects. */
const normalise = (raw, category, index) => ({
  // stable key: category + index (API articles have no id)
  id:       `${category}-${index}`,
  title:    raw.title    ?? "Untitled",
  summary:  raw.description ?? "",
  source:   extractSource(raw.title),
  author:   "Staff Reporter",
  date:     raw.published_at ?? new Date().toISOString(),
  category,
  image:    raw.image_url || CATEGORY_IMAGES[category],
  link:     raw.url ?? "#",
});

/** Pull the source name out of titles like "Headline text - Source Name" */
const extractSource = (title = "") => {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "News";
};

/** Strip the trailing " - Source Name" from the display title. */
const cleanTitle = (title = "") => {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts.slice(0, -1).join(" - ") : title;
};

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={`${styles.newsCard} ${styles.skeletonCard}`}>
      <div className={`${styles.imageWrap} ${styles.skeletonImage}`} />
      <div className={styles.cardBody}>
        <div className={styles.skeletonLine} style={{ width: "40%", height: 18, marginBottom: 12 }} />
        <div className={styles.skeletonLine} style={{ width: "90%", height: 22, marginBottom: 8 }} />
        <div className={styles.skeletonLine} style={{ width: "75%", height: 22, marginBottom: 16 }} />
        <div className={styles.skeletonLine} style={{ width: "100%", height: 14, marginBottom: 6 }} />
        <div className={styles.skeletonLine} style={{ width: "80%",  height: 14 }} />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function News() {
  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [searchTerm, setSearchTerm]       = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage]     = useState(1);
  const [openingArticleId, setOpeningArticleId] = useState(null);
  const preservedScrollYRef   = useRef(null);
  const shouldRestoreScrollRef = useRef(false);

  // ── Fetch both categories in parallel on mount ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [goldRes, silverRes] = await Promise.all([
          fetch(`${API_BASE}/GOLD`),
          fetch(`${API_BASE}/SILVER`),
        ]);

        if (!goldRes.ok)   throw new Error(`Gold feed returned ${goldRes.status}`);
        if (!silverRes.ok) throw new Error(`Silver feed returned ${silverRes.status}`);

        const [goldData, silverData] = await Promise.all([
          goldRes.json(),
          silverRes.json(),
        ]);

        if (cancelled) return;

        const gold   = goldData.map((a, i)   => normalise(a, "Gold",   i));
        const silver = silverData.map((a, i) => normalise(a, "Silver", i));

        // Merge and sort newest-first
        const merged = [...gold, ...silver].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setArticles(merged);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredNews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return articles.filter((article) => {
      const matchCategory =
        activeCategory === "All" || article.category === activeCategory;
      const matchKeyword =
        !keyword ||
        article.title.toLowerCase().includes(keyword)   ||
        article.summary.toLowerCase().includes(keyword) ||
        article.source.toLowerCase().includes(keyword)  ||
        article.category.toLowerCase().includes(keyword);
      return matchCategory && matchKeyword;
    });
  }, [articles, activeCategory, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ARTICLES_PER_PAGE));

  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredNews.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredNews, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  // ── Scroll restoration across page changes ───────────────────────────────
  useLayoutEffect(() => {
    if (!shouldRestoreScrollRef.current || preservedScrollYRef.current === null) return;
    window.scrollTo({ top: preservedScrollYRef.current, behavior: "auto" });
  }, [currentPage]);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current || preservedScrollYRef.current === null) return;
    const targetY = preservedScrollYRef.current;
    const restore = () => window.scrollTo({ top: targetY, behavior: "auto" });
    restore();
    const raf       = window.requestAnimationFrame(restore);
    const timeoutId = window.setTimeout(() => {
      restore();
      preservedScrollYRef.current    = null;
      shouldRestoreScrollRef.current = false;
    }, 140);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [currentPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleExternalOpen = (event, article) => {
    event.preventDefault();
    setOpeningArticleId(article.id);
    window.setTimeout(() => {
      window.open(article.link, "_blank", "noopener,noreferrer");
    }, 220);
  };

  const changePage = (newPage) => {
    preservedScrollYRef.current    = window.scrollY;
    shouldRestoreScrollRef.current = true;
    setCurrentPage(newPage);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header role="INVESTOR" />

      <main className={styles.pageWrapper}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Market News & Insights</h1>
          <p className={styles.heroSubtitle}>
            Recent articles about gold and silver to support your comparison
            between Vietnam and the global market.
          </p>
        </section>

        <section className={styles.toolbarSection}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search news by keyword, source, or category..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryRow}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`${styles.categoryButton} ${
                  activeCategory === category ? styles.categoryButtonActive : ""
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* ── Error banner ── */}
        {error && (
          <div className={styles.errorBanner}>
            Failed to load news: {error}. Please try refreshing.
          </div>
        )}

        {/* ── Results header ── */}
        {!loading && !error && (
          <section className={styles.resultsHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Latest Articles</h2>
              <p className={styles.resultCount}>{filteredNews.length} articles found</p>
            </div>
            <p className={styles.pageIndicator}>
              Page {currentPage} / {totalPages}
            </p>
          </section>
        )}

        {/* ── Grid ── */}
        <section className={styles.newsGrid}>
          {loading
            ? Array.from({ length: ARTICLES_PER_PAGE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : paginatedNews.map((article, index) => (
                <a
                  key={article.id}
                  href={article.link}
                  onClick={(event) => handleExternalOpen(event, article)}
                  className={`${styles.newsCard} ${
                    openingArticleId === article.id ? styles.newsCardOpening : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.imageWrap}>
                    <img
                      src={article.image}
                      alt={article.title}
                      className={styles.cardImage}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = CATEGORY_IMAGES[article.category];
                      }}
                    />
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTopMeta}>
                      <span className={styles.categoryTag}>{article.category}</span>
                      <span className={styles.sourceName}>{article.source}</span>
                    </div>

                    <h3 className={styles.cardTitle}>{cleanTitle(article.title)}</h3>
                    <p className={styles.cardSummary}>{article.summary}</p>

                    <div className={styles.cardMeta}>
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(article.date)}
                      </span>
                    </div>

                    <span className={styles.readMore}>
                      Read article
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </a>
              ))}
        </section>

        {!loading && !error && paginatedNews.length === 0 && (
          <div className={styles.emptyState}>
            No article matched your keyword. Try another topic or category.
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && filteredNews.length > 0 && (
          <section className={styles.paginationSection}>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => changePage(page)}
                  className={`${styles.pageButton} ${
                    currentPage === page ? styles.pageButtonActive : ""
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}