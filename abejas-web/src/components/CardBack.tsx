interface Props {
  small?: boolean;
  style?: React.CSSProperties;
}

/** Reverso genérico de carta (mano oculta de otros jugadores, mazo, etc). */
export default function CardBack({ small, style }: Props) {
  return (
    <div className={"card-back" + (small ? " small" : "")} style={style} aria-hidden="true">
      <img src="/cards/back.jpg" alt="" />
    </div>
  );
}
