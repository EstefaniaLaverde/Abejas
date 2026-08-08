/**
 * Set pequeño de iconos SVG en línea (sin depender de una librería externa).
 * Estilo: trazo simple, esquinas redondeadas, un solo color (heredado de
 * `currentColor`) — así siguen la paleta de campo/miel del resto del juego
 * en vez de verse como un emoji genérico pegado encima.
 */

interface IconProps {
  size?: number;
  className?: string;
}

/** Abeja estilizada: cuerpo a rayas + alas. Mascota del juego. */
export function BeeIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="9.5" cy="7.5" rx="4" ry="3.4" fill="currentColor" opacity="0.35" />
      <ellipse cx="15" cy="8" rx="3.6" ry="3" fill="currentColor" opacity="0.35" />
      <rect x="7.5" y="10" width="9" height="7.5" rx="3.5" fill="currentColor" />
      <path d="M7.5 12.6H16.5" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7.5 15.1H16.5" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9.3" cy="10.6" r="1.1" fill="var(--ink)" />
      <path
        d="M9 10.2C7.6 8.6 7.6 7 9.3 6"
        stroke="var(--ink)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Un par de cartas superpuestas: representa "cartas en mano". */
export function CardsIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="6" width="12" height="15" rx="2.2" fill="currentColor" opacity="0.55" />
      <rect x="8" y="3" width="13" height="16" rx="2.2" fill="currentColor" />
    </svg>
  );
}

/** Lupa: usada para ampliar una carta. */
export function SearchIcon({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="M19.5 19.5L15.3 15.3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** X para cerrar un panel/modal. */
export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Brote/hoja: junto al botón de cosechar. */
export function SproutIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21V12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 13C12 13 6 12.5 6 6.5C12 6.5 12.5 12 12.5 12"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M12 10C12 10 18 9.5 18 4.5C12.5 4.5 12 9.5 12 9.5"
        fill="currentColor"
      />
    </svg>
  );
}

/** Trofeo con toque de miel: pantalla de resultados. */
export function TrophyIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 4H18V9C18 12.3 15.3 15 12 15C8.7 15 6 12.3 6 9V4Z"
        fill="currentColor"
      />
      <path
        d="M6 5H3.5C3.5 8 5 9.5 6.8 9.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 5H20.5C20.5 8 19 9.5 17.2 9.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="10.5" y="15" width="3" height="3.5" fill="currentColor" />
      <path d="M7.5 21H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 18.5H14.5V21H9.5Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
