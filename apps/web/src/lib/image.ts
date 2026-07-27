export const itemSprite = (identifier: string) => {
  const fullName = identifier
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ")
    .replace(/Never Melt Ice/, "Never-Melt Ice")
    .replace(/Kings Rock/, "King's Rock");
  return `https://championsbattledata.com/pokemon_champions_assets/items/${encodeURIComponent(fullName)}.png`;
};

export const typeIcon = (type: string) => {
  const name = type[0].toUpperCase() + type.slice(1);

  return `https://championsbattledata.com/pokemon_champions_assets/types/${name}.png`;
};
