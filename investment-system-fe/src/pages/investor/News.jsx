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

const CATEGORY_IMAGES = {
  Gold:
    "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80",
  Silver:
    "https://images.unsplash.com/photo-1610375461369-d613b5647341?auto=format&fit=crop&w=1200&q=80",
  "Exchange Rate":
    "https://images.unsplash.com/photo-1554224154-26032fced8bd?auto=format&fit=crop&w=1200&q=80",
  Oil:
    "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80",
};


const ARTICLE_IMAGES = {
  1: "/news-images/gold-coins-bars.png",
  2: "/news-images/gold-coins-close.png",
  3: "/news-images/gold-bars-close.avif",
  4: "/news-images/gold-bars-rows.png",
  5: "/news-images/gold-silver-hands.png",
  6: "/news-images/gold-silver-tray.png",
  7: "/news-images/gold-silver-hands.png",
  8: "/news-images/gold-grain.avif",
  9: "/news-images/gold-bars-rows.png",
  10: "/news-images/gold-jewelry-store.avif",
  11: "/news-images/gold-jewelry-case.avif",
  12: "/news-images/gold-bangles-case.png",
  13: "/news-images/gold-silver-tray.png",
  14: "/news-images/gold-coins-bars.png",
  15: "/news-images/gold-bars-rows.png",
  16: "/news-images/gold-bangles-case.png",
  17: "/news-images/gold-silver-hands.png",
  18: "/news-images/silver-bars.png",
  19: "/news-images/silver-ingots.png",
  20: "/news-images/silver-bars.png",
  21: "/news-images/silver-bars.png",
  22: "/news-images/gold-silver-tray.png",
  23: "/news-images/silver-bars.png",
  24: "/news-images/gold-silver-hands.png",
  25: "/news-images/silver-bars.png",
  26: "/news-images/gold-silver-hands.png",
  27: "/news-images/usd-single-note.png",
  28: "/news-images/usd-bank-table.png",
  29: "/news-images/usd-counting.png",
  30: "/news-images/usd-machine.png",
  31: "/news-images/usd-desk.png",
  32: "/news-images/usd-counting.png",
  33: "/news-images/usd-single-note.png",
  34: "/news-images/oil-terminal.png",
  35: "/news-images/goldman-phone.png",
  36: "/news-images/oil-tanker.png",
  37: "/news-images/oil-pump.png",
  38: "/news-images/oil-pump.png",
  39: "/news-images/oil-terminal.png",
  40: "/news-images/japan-official.png",
};

const NEWS_DATA = [
  // GOLD - 15
  {
    id: 1,
    title: "Gold slips and heads for second consecutive weekly fall",
    category: "Gold",
    source: "Reuters",
    author: "Ashitha Shivaprasad",
    date: "2026-03-13",
     
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Gold eased as the dollar stayed firm and rate-cut expectations softened amid oil-driven inflation worries.",
    link: "https://www.reuters.com/world/india/gold-set-weekly-drop-oil-price-surge-weighs-rate-cut-hopes-2026-03-13/",
  },
  {
    id: 2,
    title: "Gold slips over 1% on strong dollar, easing rate-cut bets",
    category: "Gold",
    source: "Reuters",
    author: "Ashitha Shivaprasad",
    date: "2026-03-12",
     
    image: CATEGORY_IMAGES.Gold,
    summary:
      "A stronger U.S. dollar and persistent inflation concerns pulled bullion lower in a volatile session.",
    link: "https://www.reuters.com/world/india/gold-steady-dipbuying-offsets-firm-dollar-us-inflation-woes-2026-03-12/",
  },
  {
    id: 3,
    title: "Gold eases as firmer dollar, lingering inflation concerns persist",
    category: "Gold",
    source: "Reuters",
    author: "Ashitha Shivaprasad",
    date: "2026-03-11",
     
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Bullion stayed under pressure as investors weighed inflation jitters and the path of U.S. rates.",
    link: "https://www.reuters.com/world/india/gold-edges-higher-inflation-jitters-ease-key-us-data-focus-2026-03-11/",
  },
  {
    id: 4,
    title: "Gold slips on stronger dollar, higher rate expectations",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-03-09",
     
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Oil-linked inflation concerns helped strengthen the dollar and weighed on gold demand.",
    link: "https://www.reuters.com/world/india/gold-prices-fall-firmer-dollar-dimming-rate-cut-hopes-2026-03-09/",
  },
  {
    id: 5,
    title: "Gold slips, silver down nearly 14% on firmer dollar",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-02-05",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "A broad sell-off in precious metals hit both gold and silver as the dollar gained ground.",
    link: "https://www.reuters.com/world/india/gold-rises-over-1-geopolitical-economic-tensions-lift-precious-metals-2026-02-05/",
  },
  {
    id: 6,
    title: "Gold set for biggest daily gain since 2008, silver also rebounds",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-02-03",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Bargain hunters stepped back into bullion after a sharp two-day washout in the market.",
    link: "https://www.reuters.com/world/india/gold-rebounds-more-than-3-after-sharp-selloff-2026-02-03/",
  },
  {
    id: 7,
    title: "Gold, silver extend fall as CME margin hikes compound selloff",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-02-02",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Fresh margin hikes added to pressure after one of bullion's sharpest slides in decades.",
    link: "https://www.reuters.com/world/india/gold-falls-15-firm-dollar-silver-recovers-over-three-week-low-2026-02-02/",
  },
  {
    id: 8,
    title: "Gold tops $4,900/oz; silver and platinum extend record rally",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-22",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Safe-haven demand and a softer dollar helped gold break to a fresh record above $4,900.",
    link: "https://www.reuters.com/world/india/gold-falls-easing-geopolitical-tensions-dampen-safe-haven-demand-2026-01-22/",
  },
  {
    id: 9,
    title: "Gold cracks $4,600/oz as Fed uncertainty fans safe-haven demand",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-12",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Investors turned to bullion as policy uncertainty around the Fed boosted defensive positioning.",
    link: "https://www.reuters.com/world/india/gold-silver-notch-record-highs-safe-haven-demand-fed-rate-cut-bets-2026-01-12/",
  },
  {
    id: 10,
    title: "Gold inches closer to record peak as geopolitical risks lift sentiment",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-06",
     
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Geopolitical risk and upcoming U.S. payroll data kept the precious metals trade active.",
    link: "https://www.reuters.com/world/india/gold-hits-one-week-high-fed-rate-cut-bets-venezuela-turmoil-2026-01-06/",
  },
  {
    id: 11,
    title: "Precious metals rise early in 2026 on rate-cut bets and safe-haven demand",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-02",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Gold started the year firm while silver and platinum outperformed on supply and policy themes.",
    link: "https://www.reuters.com/world/india/precious-metals-kick-off-new-year-higher-after-robust-2025-rally-2026-01-02/",
  },
  {
    id: 12,
    title: "Gold rebounds, poised to cap off best year in over four decades",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-30",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Bullion steadied near year-end after a record-setting year for precious metals.",
    link: "https://www.reuters.com/world/india/gold-bounces-back-two-week-low-silver-recovers-2025-12-30/",
  },
  {
    id: 13,
    title: "Gold, silver and platinum take a breather after record rally",
    category: "Gold",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-24",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "Gold cooled slightly after breaking above the key $4,500 mark during a historic rally.",
    link: "https://www.reuters.com/world/india/gold-tops-4500-silver-platinum-hit-records-metal-markets-frenzy-2025-12-24/",
  },
  {
    id: 14,
    title: "Gold, silver and platinum sparkle at all-time peaks",
    category: "Gold",
    source: "Reuters",
    author: "Sarah Qureshi",
    date: "2025-12-23",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "A synchronized rally pushed several precious metals to new records in late December.",
    link: "https://www.reuters.com/world/india/gold-hits-record-high-safe-haven-demand-silver-climbs-new-peak-2025-12-23/",
  },
  {
    id: 15,
    title: "Gold climbs to over one-month high after Fed rate cut",
    category: "Gold",
    source: "Reuters",
    author: "Sarah Qureshi",
    date: "2025-12-11",
      
    image: CATEGORY_IMAGES.Gold,
    summary:
      "A Fed cut and weaker dollar helped lift gold while silver hovered near another record.",
    link: "https://www.reuters.com/world/india/gold-edges-lower-after-divided-fed-cuts-rates-silver-hits-record-high-2025-12-11/",
  },

  // SILVER - 11
  {
    id: 16,
    title: "Silver and gold prices cool in Vietnam's domestic market",
    category: "Silver",
    source: "Investing.com Vietnam",
    author: "Kieu Giang",
    date: "2026-03-13",
     
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Domestic bullion and silver prices eased as the global precious-metals complex corrected.",
    link: "https://vn.investing.com/news/commodities-news/gia-vang-bac-trong-nuoc-dong-loat-ha-nhiet-2561966",
  },
  {
    id: 17,
    title: "Silver slips with gold as firmer dollar pressure returns",
    category: "Silver",
    source: "Reuters",
    author: "Ashitha Shivaprasad",
    date: "2026-03-12",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Silver also softened as Treasury yields rose and the dollar stayed elevated.",
    link: "https://www.reuters.com/world/india/gold-steady-dipbuying-offsets-firm-dollar-us-inflation-woes-2026-03-12/",
  },
  {
    id: 18,
    title: "UBS says silver upside may be limited over the next 12 months",
    category: "Silver",
    source: "Investing.com Vietnam",
    author: "Investing.com",
    date: "2026-03-05",
     
    image: CATEGORY_IMAGES.Silver,
    summary:
      "The bank kept a constructive but more measured view after silver's explosive run-up.",
    link: "https://vn.investing.com/news/commodities-news/ubs-du-bao-gia-bac-co-tiem-nang-tang-han-che-trong-12-thang-toi-2554868",
  },
  {
    id: 19,
    title: "Silver and gold retreat after margin-driven selloff",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-02-02",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Silver stayed highly volatile as tighter margin rules amplified liquidation pressure.",
    link: "https://www.reuters.com/world/india/gold-falls-15-firm-dollar-silver-recovers-over-three-week-low-2026-02-02/",
  },
  {
    id: 20,
    title: "Indian gold and silver futures jump to record highs",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-27",
     
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Domestic futures in India mirrored the global rally as silver pushed to fresh peaks.",
    link: "https://www.reuters.com/world/india/indian-gold-silver-futures-jump-record-high-tracking-global-gains-2026-01-27/",
  },
  {
    id: 21,
    title: "Speculative frenzy catapults silver above $100 an ounce",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-23",
    readTime: "5 min read",
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Retail buying, ETF inflows and supply tightness drove an extraordinary move in silver.",
    link: "https://www.reuters.com/world/india/gold-silver-platinum-extend-recordsetting-rally-2026-01-23/",
  },
  {
    id: 22,
    title: "Silver powers to a fresh record high with gold and platinum",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2026-01-12",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Silver extended its breakout as safe-haven flows spread across the precious metals complex.",
    link: "https://www.reuters.com/world/india/gold-silver-notch-record-highs-safe-haven-demand-fed-rate-cut-bets-2026-01-12/",
  },
  {
    id: 23,
    title: "Silver rises 9% to hit a fresh record high",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-26",
     
    image: CATEGORY_IMAGES.Silver,
    summary:
      "A sharp year-end burst pushed silver to another all-time high on strong momentum.",
    link: "https://www.reuters.com/world/india/silver-rises-9-hit-fresh-record-high-2025-12-26/",
  },
  {
    id: 24,
    title: "Silver crosses $77 while gold and platinum stretch the rally",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-26",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Silver broke another milestone as rate-cut hopes and supply deficits fueled gains.",
    link: "https://www.reuters.com/world/india/silver-tops-75-gold-platinum-surge-records-2025-12-26/",
  },
  {
    id: 25,
    title: "Silver climbs to record high, gold posts weekly gain",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-19",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Investment demand and supply tightness kept silver at the center of the week’s rally.",
    link: "https://www.reuters.com/world/india/gold-prices-slip-lower-us-inflation-figures-firmer-dollar-2025-12-19/",
  },
  {
    id: 26,
    title: "Gold gains after Fed rate cut while silver hits an all-time peak",
    category: "Silver",
    source: "Reuters",
    author: "Reuters Staff",
    date: "2025-12-10",
      
    image: CATEGORY_IMAGES.Silver,
    summary:
      "Silver continued to outperform as the Fed decision reinforced precious-metals momentum.",
    link: "https://www.reuters.com/world/india/gold-inches-up-ahead-fed-verdict-silver-powers-fresh-records-above-60-2025-12-10/",
  },

  // EXCHANGE RATE - 7
  {
    id: 27,
    title: "USD exchange rate today: Dollar index rises for the third straight session",
    category: "Exchange Rate",
    source: "Vietnam.vn",
    author: "Bao Cong Thuong",
    date: "2026-03-13",
     
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "The State Bank’s reference rate and the broader dollar trend remained key talking points in Vietnam.",
    link: "https://www.vietnam.vn/en/ty-gia-usd-hom-nay-13-3-2026-dollar-index-tang-phien-thu-ba-lien-tiep",
  },
  {
    id: 28,
    title: "Commercial banks slightly increased the USD exchange rate",
    category: "Exchange Rate",
    source: "Vietnam.vn",
    author: "Vietnam.vn",
    date: "2026-03-13",
    readTime: "2 min read",
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "Bank quotes edged up as domestic traders tracked movements in the global U.S. dollar.",
    link: "https://www.vietnam.vn/en/ngan-hang-thuong-mai-tang-nhe-ty-gia-usd",
  },
  {
    id: 29,
    title: "Dollar rises broadly as investors weigh Middle East risks",
    category: "Exchange Rate",
    source: "Reuters",
    author: "Saqib Iqbal Ahmed",
    date: "2026-03-13",
      
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "The greenback benefited from safe-haven demand as markets priced in geopolitical stress.",
    link: "https://www.reuters.com/world/asia-pacific/dollar-poised-second-weekly-gain-with-no-end-sight-iran-war-2026-03-13/",
  },
  {
    id: 30,
    title: "Dollar flirts with new 2026 highs as oil jump hurts euro",
    category: "Exchange Rate",
    source: "Reuters",
    author: "Saqib Iqbal Ahmed",
    date: "2026-03-12",
      
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "A stronger dollar became an important benchmark for comparing global asset prices.",
    link: "https://www.reuters.com/world/asia-pacific/us-dollar-hovers-near-2026-highs-oils-rise-spurs-hawkish-central-bank-bets-2026-03-12/",
  },
  {
    id: 31,
    title: "Dollar rises against dong",
    category: "Exchange Rate",
    source: "VnExpress",
    author: "Minh Hieu",
    date: "2026-03-01",
     
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "The USD strengthened against the Vietnamese dong at banks and on the informal market.",
    link: "https://e.vnexpress.net/news/business/markets/dollar-rises-against-dong-5045611.html",
  },
  {
    id: 32,
    title: "US dollar surges above 27,000 VND on the free market",
    category: "Exchange Rate",
    source: "Vietnam.vn",
    author: "Vietnam.vn",
    date: "2026-03-10",
     
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "Parallel-market pricing highlighted why currency conversion matters in local-vs-global comparisons.",
    link: "https://www.vietnam.vn/en/gia-usd-tang-kich-tran-thi-truong-tu-do-vuot-27-000-dong-usd",
  },
  {
    id: 33,
    title: "Stocks slip, dollar strong as Iran conflict pushes oil prices higher",
    category: "Exchange Rate",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-13",
      
    image: CATEGORY_IMAGES["Exchange Rate"],
    summary:
      "A stronger dollar and pricier oil combined to reshape short-term cross-asset comparisons.",
    link: "https://www.reuters.com/world/china/global-markets-wrapup-1-2026-03-13/",
  },

  // OIL - 7
  {
    id: 34,
    title: "US says oil from strategic reserve to start reaching market next week",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-14",
     
    image: CATEGORY_IMAGES.Oil,
    summary:
      "Washington moved to cool the market by releasing oil from the strategic reserve.",
    link: "https://www.reuters.com/business/energy/us-says-oil-strategic-reserve-start-reaching-market-next-week-2026-03-14/",
  },
  {
    id: 35,
    title: "Goldman hikes average Brent oil forecast to over $100 for March",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-13",
      
    image: CATEGORY_IMAGES.Oil,
    summary:
      "Escalating Middle East disruptions forced a major upward revision to near-term oil forecasts.",
    link: "https://www.reuters.com/business/energy/goldman-hikes-average-brent-oil-forecast-over-100-barrel-march-2026-03-13/",
  },
  {
    id: 36,
    title: "Crude futures turn positive on continued Hormuz closure",
    category: "Oil",
    source: "Reuters",
    author: "Erwin Seba",
    date: "2026-03-13",
      
    image: CATEGORY_IMAGES.Oil,
    summary:
      "Supply fears kept the crude market on edge even as headlines hinted at partial de-escalation.",
    link: "https://www.reuters.com/business/energy/oil-drops-after-us-issues-license-countries-buy-russian-oil-stranded-sea-30-days-2026-03-13/",
  },
  {
    id: 37,
    title: "Iran war: Oil markets brace for wild price swings",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-13",
     
    image: CATEGORY_IMAGES.Oil,
    summary:
      "The market prepared for rapid repricing as conflict threatened one of the world’s key chokepoints.",
    link: "https://www.reuters.com/markets/commodities/energy/iran-war-oil-markets-brace-wild-price-swings-2026-03-13/",
  },
  {
    id: 38,
    title: "Oil dives and settles down 11% after Trump predicts de-escalation",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-10",
     
    image: CATEGORY_IMAGES.Oil,
    summary:
      "One of the biggest one-day drops in years showed how sensitive oil remains to geopolitical headlines.",
    link: "https://www.reuters.com/business/energy/oil-falls-over-6-trump-predicts-middle-east-de-escalation-2026-03-10/",
  },
  {
    id: 39,
    title: "Kharg Island, struck by US, is a key hub for Iran oil exports",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-14",
     
    image: CATEGORY_IMAGES.Oil,
    summary:
      "The report explains why infrastructure around Kharg matters so much for global supply risk.",
    link: "https://www.reuters.com/business/energy/kharg-island-struck-by-us-is-key-hub-iran-oil-exports-2026-03-14/",
  },
  {
    id: 40,
    title: "Europe repaid Tokyo a favour by backing oil stock release",
    category: "Oil",
    source: "Reuters",
    author: "Reuters",
    date: "2026-03-14",
     
    image: CATEGORY_IMAGES.Oil,
    summary:
      "Coordination on emergency stockpile releases became central to stabilizing the market.",
    link: "https://www.reuters.com/business/energy/europe-repaid-tokyo-favour-by-supporting-oil-stock-release-japan-minister-says-2026-03-14/",
  },
];

const CATEGORIES = ["All", "Gold", "Silver", "Exchange Rate", "Oil"];
const ARTICLES_PER_PAGE = 9;


const NEWS_WITH_IMAGES = NEWS_DATA.map((article) => ({
  ...article,
  image: ARTICLE_IMAGES[article.id] || article.image,
}));

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function News() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [openingArticleId, setOpeningArticleId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const preservedScrollYRef = useRef(null);
  const shouldRestoreScrollRef = useRef(false);

  const filteredNews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return NEWS_WITH_IMAGES.filter((article) => {
      const matchCategory =
        activeCategory === "All" || article.category === activeCategory;

      const matchKeyword =
        !keyword ||
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword) ||
        article.source.toLowerCase().includes(keyword) ||
        article.category.toLowerCase().includes(keyword);

      return matchCategory && matchKeyword;
    });
  }, [activeCategory, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ARTICLES_PER_PAGE));

  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredNews.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredNews, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useLayoutEffect(() => {
    if (!shouldRestoreScrollRef.current || preservedScrollYRef.current === null) return;

    window.scrollTo({ top: preservedScrollYRef.current, behavior: "auto" });
  }, [currentPage]);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current || preservedScrollYRef.current === null) return;

    const targetY = preservedScrollYRef.current;
    const restore = () => window.scrollTo({ top: targetY, behavior: "auto" });

    restore();
    const raf = window.requestAnimationFrame(restore);
    const timeoutId = window.setTimeout(() => {
      restore();
      preservedScrollYRef.current = null;
      shouldRestoreScrollRef.current = false;
    }, 140);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [currentPage]);

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
    setIsLeaving(true);

    window.setTimeout(() => {
      window.location.assign(article.link);
    }, 220);
  };

  return (
    <>
      <Header role="INVESTOR" />

      <main className={styles.pageWrapper}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Market News & Insights</h1>
          <p className={styles.heroSubtitle}>
            Recent articles about gold, silver, exchange rates and oil to support
            your comparison between Vietnam and the global market.
          </p>
        </section>

        <section className={styles.toolbarSection}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search recent news by keyword, source, or category..."
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

        <section className={styles.resultsHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Latest Articles</h2>
            <p className={styles.resultCount}>{filteredNews.length} articles found</p>
          </div>
          <p className={styles.pageIndicator}>
            Page {currentPage} / {totalPages}
          </p>
        </section>

        <section className={styles.newsGrid}>
          {paginatedNews.map((article, index) => (
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
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES.Gold;
                  }}
                />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTopMeta}>
                  <span className={styles.categoryTag}>{article.category}</span>
                  <span className={styles.readTime}>
                    <Clock3 size={13} />
                    {article.readTime}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardSummary}>{article.summary}</p>

                <div className={styles.cardMeta}>
                  <span>
                    <UserRound size={14} />
                    {article.author}
                  </span>
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

        {!paginatedNews.length && (
          <div className={styles.emptyState}>
            No article matched your keyword. Try another topic or category.
          </div>
        )}

        {filteredNews.length > 0 && (
          <section className={styles.paginationSection}>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => {
                  preservedScrollYRef.current = window.scrollY;
                  shouldRestoreScrollRef.current = true;
                  setCurrentPage((page) => Math.max(1, page - 1));
                }}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      preservedScrollYRef.current = window.scrollY;
                      shouldRestoreScrollRef.current = true;
                      setCurrentPage(page);
                    }}
                    className={`${styles.pageButton} ${
                      currentPage === page ? styles.pageButtonActive : ""
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => {
                  preservedScrollYRef.current = window.scrollY;
                  shouldRestoreScrollRef.current = true;
                  setCurrentPage((page) => Math.min(totalPages, page + 1));
                }}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <div className={`${styles.pageTransition} ${isLeaving ? styles.pageTransitionVisible : ""}`}>
        <div className={styles.transitionCard}>Opening article...</div>
      </div>
    </>
  );
}
