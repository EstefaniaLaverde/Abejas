/** Error lanzado cuando una acción viola una regla del juego. */
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}
