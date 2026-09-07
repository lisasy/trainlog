export type WeightProps = {
  value: number;
  /** Dim the number — a past lift rather than the current PR. */
  muted?: boolean;
};

/** A weight + its unit, rendered one way everywhere: `<n> lbs`. */
export default function Weight({ value, muted }: WeightProps) {
  return (
    <>
      <span className={muted ? "text-fg/90" : "text-accent"}>{value}</span>
      <span className="text-sm text-dim"> lbs</span>
    </>
  );
}
