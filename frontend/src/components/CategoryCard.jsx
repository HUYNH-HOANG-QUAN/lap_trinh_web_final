// components/CategoryCard.jsx – Card danh mục sản phẩm
// Props:
//   - category: object danh mục
//   - isActive: danh mục đang được chọn không?
//   - onClick: hàm xử lý khi click

import { Store, Droplet, Zap, Flame, Pill, ShoppingBag } from "lucide-react";

const getCategoryIcon = (name, originalIcon) => {
  const normalized = name.toLowerCase();
  
  if (normalized === "tất cả") {
    return <ShoppingBag size={32} color="var(--primary)" />;
  }
  if (normalized.includes("whey")) {
    return <Droplet size={32} color="var(--primary)" />;
  }
  if (normalized.includes("pre") || normalized.includes("workout")) {
    return <Zap size={32} color="var(--primary)" />;
  }
  if (normalized.includes("creatine") || normalized.includes("creatin")) {
    return <Flame size={32} color="var(--primary)" />;
  }
  if (normalized.includes("vitamin") || normalized.includes("bcaa") || normalized.includes("pill")) {
    return <Pill size={32} color="var(--primary)" />;
  }
  if (normalized.includes("bar") || normalized.includes("cookie")) {
    return <Store size={32} color="var(--primary)" />;
  }
  
  return originalIcon || <Store size={32} color="var(--primary)" />;
};

const CategoryCard = ({ category, isActive, onClick }) => {
  return (
    <div
      className={`category-card ${isActive ? "active" : ""}`}
      onClick={() => onClick(category)}
    >
      <div className="category-icon">
        {getCategoryIcon(category.name, category.icon)}
      </div>
      <div className="category-name">{category.name}</div>
      <div className="category-count">{category.count || 0} sản phẩm</div>
    </div>
  );
};

export default CategoryCard;
