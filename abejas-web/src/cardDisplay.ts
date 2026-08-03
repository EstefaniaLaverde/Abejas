import { CARD_TYPES, getCardType, highestReachedThreshold } from "@abejas/game";

const COLORS: Record<string, string> = {
  "papa-bandera": "#c98a4b",
  lulo: "#8bc34a",
  chontaduro: "#b5651d",
  achiote: "#c0392b",
  yacon: "#e0a458",
  "yuca-brava": "#e8d9a0",
  coca: "#2e7d32",
  "maiz-morado": "#6a3d9a",
  chachafruto: "#a0522d",
  capuchina: "#f39c12",
};

export function cardTypeName(typeId: string): string {
  try {
    return getCardType(typeId).name;
  } catch {
    return typeId;
  }
}

export function cardTypeColor(typeId: string): string {
  return COLORS[typeId] ?? "#999999";
}

/** Todos los tipos, en el mismo orden que la tabla de referencia del juego. */
export const ALL_CARD_TYPE_IDS = CARD_TYPES.map((t) => t.id);

export { highestReachedThreshold };

/**
 * Agrupa cartas por tipo y cuenta cuántas hay de cada uno.
 * Útil para mostrar una parcela o el compost de forma compacta.
 */
export function groupByType(cards: { typeId: string }[]): { typeId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.typeId, (counts.get(card.typeId) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([typeId, count]) => ({ typeId, count }));
}
