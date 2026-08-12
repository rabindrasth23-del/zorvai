/**
 * Section dividers — SVG shapes placed between landing page sections
 * to break flat horizontal color transitions.
 *
 * Each variant is a Server Component (no interactivity).
 * Uses negative margin to overlap adjacent sections and prevent
 * any gap/line artifacts between the divider and its neighbors.
 */

type DividerProps = {
  /** Color of the shape (matches the section BELOW the divider) */
  fillColor: string;
  /** Background color behind the shape (matches the section ABOVE) */
  bgColor?: string;
  /** Flip vertically */
  flip?: boolean;
  className?: string;
};

/**
 * Gentle wave — organic single curve.
 * Best for: same-family color transitions (bg → surface, surface → bg)
 */
export function WaveDivider({
  fillColor,
  bgColor = "transparent",
  flip = false,
  className,
}: DividerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: "100%",
        lineHeight: 0,
        overflow: "hidden",
        background: bgColor,
        transform: flip ? "scaleY(-1)" : undefined,
        marginTop: "-1px",
        marginBottom: "-1px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "clamp(40px, 5vw, 80px)", display: "block" }}
      >
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}

/**
 * Angled divider — diagonal cut with a subtle curve at the apex.
 * Best for: high-contrast transitions (bg → teal, teal → dark)
 */
export function AngledDivider({
  fillColor,
  bgColor = "transparent",
  flip = false,
  className,
}: DividerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: "100%",
        lineHeight: 0,
        overflow: "hidden",
        background: bgColor,
        transform: flip ? "scaleY(-1)" : undefined,
        marginTop: "-1px",
        marginBottom: "-1px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "clamp(30px, 4vw, 60px)", display: "block" }}
      >
        <path
          d="M0,60 L0,20 Q360,0 720,15 Q1080,30 1440,0 L1440,60 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}

/**
 * Soft curve — very gentle arc, almost flat.
 * Best for: subtle same-shade transitions
 */
export function SoftCurveDivider({
  fillColor,
  bgColor = "transparent",
  flip = false,
  className,
}: DividerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: "100%",
        lineHeight: 0,
        overflow: "hidden",
        background: bgColor,
        transform: flip ? "scaleY(-1)" : undefined,
        marginTop: "-1px",
        marginBottom: "-1px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "clamp(24px, 3vw, 48px)", display: "block" }}
      >
        <path
          d="M0,48 L0,24 Q720,0 1440,24 L1440,48 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}
