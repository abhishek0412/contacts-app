import React from "react";
import { useGetContactStatsQuery } from "../../features";

const defaultStats = { total: 0, recentlyAdded: 0, favorites: 0, companies: 0 };

const cards = [
  { key: "total", label: "Total Contacts" },
  { key: "recentlyAdded", label: "Recently Added" },
  { key: "favorites", label: "Favorites" },
  { key: "companies", label: "Companies" },
];

const StatsCards = () => {
  const { data: stats = defaultStats } = useGetContactStatsQuery();

  return (
    <div className="stats-grid">
      {cards.map(({ key, label }) => (
        <div className="stats-card glass-card" key={key}>
          <span className="stats-label">{label}</span>
          <span className="stats-value">{stats[key] ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
