import styles from "./News.module.css";

const categories = [
  "All",
  "Market News",
  "Expert Opinion",
  "Policy Updates",
  "Economic Analysis",
  "Investment Guides",
];

const newsList = [
  {
    id: 1,
    title: "Why Silver is Outperforming Gold This Week",
    category: ["Market News", "Economic Analysis"],
    author: "John Doe",
    date: "2024-07-29",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d",
  },
  {
    id: 2,
    title: "Fed Rate Cuts: Understanding the Impact on Platinum Prices",
    category: ["Expert Opinion", "Policy Updates"],
    author: "Jane Smith",
    date: "2024-07-28",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
  },
  {
    id: 3,
    title: "Gold's Resilient Outlook Amidst Global Economic Uncertainty",
    category: ["Market News", "Investment Guides"],
    author: "David Lee",
    date: "2024-07-27",
    image: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6",
  },
];

export default function MarketNews() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Market News & Insights</h1>
      <p className={styles.subtitle}>
        Stay informed with the latest updates, expert opinions, and in-depth
        analysis on the precious metals market.
      </p>

      {/* Search */}
      <div className={styles.searchBox}>
        <input placeholder="Search..." />
        <button>🔍</button>
      </div>

      {/* Categories */}
      <div className={styles.categories}>
        {categories.map((item) => (
          <button key={item} className={styles.categoryBtn}>
            {item}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className={styles.grid}>
        {newsList.map((news) => (
          <div key={news.id} className={styles.card}>
            <img src={news.image} alt={news.title} />
            <div className={styles.cardBody}>
              <h3>{news.title}</h3>

              <div className={styles.tags}>
                {news.category.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <p className={styles.meta}>
                By {news.author} • {news.date}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button>1</button>
        <button className={styles.active}>2</button>
        <button>3</button>
        <button>4</button>
        <button>5</button>
      </div>
    </div>
  );
}
