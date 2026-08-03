import { CARD_TYPES } from "@abejas/game";
import { cardTypeColor } from "../cardDisplay";

/**
 * Tabla de referencia, siempre disponible, de cuántas cartas de cada
 * cultivo se necesitan para obtener abejas.
 */
export default function BeeConversionTable() {
  return (
    <details className="bee-conversion-table">
      <summary>Tabla de conversión: cultivo → abejas</summary>
      <table>
        <thead>
          <tr>
            <th>Cultivo</th>
            <th>Cartas en el mazo</th>
            <th>Conversión (cartas → abejas)</th>
          </tr>
        </thead>
        <tbody>
          {CARD_TYPES.map((type) => (
            <tr key={type.id}>
              <td>
                <span className="type-swatch" style={{ backgroundColor: cardTypeColor(type.id) }} />
                {type.name}
              </td>
              <td>{type.totalInDeck}</td>
              <td>{type.beeTable.map((t) => `${t.count}→${t.bees}`).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
