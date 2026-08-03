import type { CardType } from "./types.js";

/**
 * Los 10 tipos de cultivo del juego, con su tabla de conversión a abejas
 * y el número total de cartas de ese tipo en el mazo (150 en total).
 */
export const CARD_TYPES: CardType[] = [
  {
    id: "papa-bandera",
    name: "Papa bandera",
    totalInDeck: 24,
    beeTable: [
      { count: 4, bees: 1 },
      { count: 7, bees: 2 },
      { count: 10, bees: 3 },
      { count: 12, bees: 4 },
    ],
  },
  {
    id: "lulo",
    name: "Lulo",
    totalInDeck: 22,
    beeTable: [
      { count: 4, bees: 1 },
      { count: 7, bees: 2 },
      { count: 9, bees: 3 },
      { count: 11, bees: 4 },
    ],
  },
  {
    id: "chontaduro",
    name: "Chontaduro",
    totalInDeck: 20,
    beeTable: [
      { count: 4, bees: 1 },
      { count: 6, bees: 2 },
      { count: 8, bees: 3 },
      { count: 10, bees: 4 },
    ],
  },
  {
    id: "achiote",
    name: "Achiote",
    totalInDeck: 18,
    beeTable: [
      { count: 3, bees: 1 },
      { count: 6, bees: 2 },
      { count: 8, bees: 3 },
      { count: 9, bees: 4 },
    ],
  },
  {
    id: "yacon",
    name: "Yacón",
    totalInDeck: 16,
    beeTable: [
      { count: 3, bees: 1 },
      { count: 5, bees: 2 },
      { count: 7, bees: 3 },
      { count: 8, bees: 4 },
    ],
  },
  {
    id: "yuca-brava",
    name: "Yuca brava",
    totalInDeck: 14,
    beeTable: [
      { count: 3, bees: 1 },
      { count: 5, bees: 2 },
      { count: 6, bees: 3 },
      { count: 7, bees: 4 },
    ],
  },
  {
    id: "coca",
    name: "Coca",
    totalInDeck: 12,
    beeTable: [
      { count: 2, bees: 1 },
      { count: 4, bees: 2 },
      { count: 6, bees: 3 },
      { count: 7, bees: 4 },
    ],
  },
  {
    id: "maiz-morado",
    name: "Maíz morado",
    totalInDeck: 10,
    beeTable: [
      { count: 2, bees: 1 },
      { count: 4, bees: 2 },
      { count: 5, bees: 3 },
      { count: 6, bees: 4 },
    ],
  },
  {
    id: "chachafruto",
    name: "Chachafruto",
    totalInDeck: 8,
    beeTable: [
      { count: 2, bees: 1 },
      { count: 3, bees: 2 },
      { count: 4, bees: 3 },
      { count: 5, bees: 4 },
    ],
  },
  {
    id: "capuchina",
    name: "Capuchina",
    totalInDeck: 6,
    beeTable: [
      { count: 2, bees: 2 },
      { count: 3, bees: 3 },
    ],
  },
];

export const TOTAL_CARDS_IN_DECK = CARD_TYPES.reduce(
  (sum, t) => sum + t.totalInDeck,
  0,
);

export function getCardType(typeId: string): CardType {
  const type = CARD_TYPES.find((t) => t.id === typeId);
  if (!type) throw new Error(`Tipo de carta desconocido: ${typeId}`);
  return type;
}

/**
 * Dado un tipo de cultivo y una cantidad de cartas en una parcela,
 * devuelve el mayor escalón alcanzado (o undefined si no alcanza el mínimo).
 */
export function highestReachedThreshold(
  typeId: string,
  cardCount: number,
): { count: number; bees: number } | undefined {
  const type = getCardType(typeId);
  let reached: { count: number; bees: number } | undefined;
  for (const threshold of type.beeTable) {
    if (cardCount >= threshold.count) {
      reached = threshold;
    }
  }
  return reached;
}
