import React, { useState, useEffect } from "react";
import { Coins, Heart } from "lucide-react";
import styles from "./VirtualPet.module.css";

// ==========================================
// 1. IMPORT ẢNH TẠI ĐÂY
// React sẽ tự động hiểu và lấy đúng file ảnh trong thư mục assets
// ==========================================
import petImg from "../../assets/image/pet.png";
import petSad from "../../assets/image/sad.png";
import petHappy from "../../assets/image/happy.png";

const VirtualPet = () => {
  const [hunger, setHunger] = useState(80); // 100 là no bụng
  const [happiness, setHappiness] = useState(80); // 100 là vui vẻ
  const [isInteracting, setIsInteracting] = useState(false);
  const [particles, setParticles] = useState([]);

  // Logic thời gian: Tự động đói và buồn theo thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setHunger((prev) => Math.max(prev - 2, 0));
      setHappiness((prev) => Math.max(prev - 1, 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePet = () => {
    setIsInteracting(true);
    setHappiness((prev) => Math.min(prev + 5, 100));
    spawnParticle("❤️");
    setTimeout(() => setIsInteracting(false), 400);
  };

  const handleFeed = () => {
    setIsInteracting(true);
    setHunger((prev) => Math.min(prev + 20, 100));
    spawnParticle("🪙");
    setTimeout(() => setIsInteracting(false), 400);
  };

  const handlePlay = () => {
    setIsInteracting(true);
    setHappiness((prev) => Math.min(prev + 20, 100));
    setHunger((prev) => Math.max(prev - 10, 0));
    spawnParticle("✨");
    setTimeout(() => setIsInteracting(false), 400);
  };

  const spawnParticle = (emoji) => {
    const id = Date.now();
    setParticles((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
  };

  const getHungerColor = () =>
    hunger < 30 ? "#ef4444" : hunger < 60 ? "#f59e0b" : "#10b981";
  const getHappyColor = () =>
    happiness < 30 ? "#ef4444" : happiness < 60 ? "#3b82f6" : "#ec4899";

  // ==========================================
  // 2. GÁN BIẾN ẢNH ĐÃ IMPORT VÀO
  // Hiện tại bạn mới có 1 ảnh pet.png, nên mình gán chung cho cả 3 trạng thái.
  // Sau này có thêm ảnh, bạn cứ import thêm ở trên rồi sửa ở đây.
  // ==========================================
  const imgNormal = petImg;
  const imgHappy = petHappy;
  const imgSad = petSad;

  let currentImage = imgNormal;
  if (isInteracting || happiness > 90) {
    currentImage = imgHappy;
  } else if (hunger < 30 || happiness < 30) {
    currentImage = imgSad;
  }

  return (
    <div className={styles.petContainer}>
      <div className={styles.statsPanel}>
        <div className={styles.statRow}>
          <div className={styles.statHeader}>
            <span>Power</span>
            <span style={{ color: getHungerColor() }}>{hunger}%</span>
          </div>
          <div className={styles.barBg}>
            <div
              className={styles.barFill}
              style={{ width: `${hunger}%`, backgroundColor: getHungerColor() }}
            />
          </div>
        </div>

        <div className={styles.statRow}>
          <div className={styles.statHeader}>
            <span>Emotion</span>
            <span style={{ color: getHappyColor() }}>{happiness}%</span>
          </div>
          <div className={styles.barBg}>
            <div
              className={styles.barFill}
              style={{
                width: `${happiness}%`,
                backgroundColor: getHappyColor(),
              }}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.btnFeed}`}
            onClick={handleFeed}
          >
            <Coins size={14} /> Coin
          </button>
          <button
            className={`${styles.actionBtn} ${styles.btnPlay}`}
            onClick={handlePlay}
          >
            <Heart size={14} /> Fun
          </button>
        </div>
      </div>

      {particles.map((p) => (
        <div key={p.id} className={styles.heartParticle}>
          {p.emoji}
        </div>
      ))}

      {/* LINH VẬT 3D */}
      <div
        className={`${styles.petMascot} ${isInteracting ? styles.petInteracting : ""}`}
        onClick={handlePet}
        title="Nhấn để nựng Capy!"
        style={{
          // Biến currentImage giờ đã là một URL hợp lệ do React cung cấp
          backgroundImage: `url('${currentImage}')`,
          transition: "background-image 0.2s ease-in-out",
        }}
      />
    </div>
  );
};

export default VirtualPet;
