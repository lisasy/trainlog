/**
 * A full-width horizontal rule drawn with actual box-drawing characters
 * rather than a CSS border.
 *
 * The run is longer than any viewport and simply clipped, which is how it
 * stays character-accurate at every width without measuring anything.
 */
export default function Rule() {
  return (
    <div
      aria-hidden
      className="select-none overflow-hidden leading-none whitespace-nowrap text-border"
    >
      {"─".repeat(600)}
    </div>
  );
}
