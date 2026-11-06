import React from "react";
import "./Icon.less";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_PATHS: Record<string, React.ReactNode> = {
  // ── transport ─────────────────────────────────────────
  rewind: <path d="M2 2v10h2V7l5 4V3L4 7V2z" fill="currentColor" />,
  prevMarker: (
    <>
      <path d="M3 7l6-5v10z" fill="currentColor" />
      <rect x="1" y="2" width="2" height="10" rx="0.5" fill="currentColor" />
    </>
  ),
  play: <polygon points="4,2 14,8 4,14" fill="currentColor" />,
  stop: <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />,
  nextMarker: (
    <>
      <path d="M11 7L5 2v10z" fill="currentColor" />
      <rect x="11" y="2" width="2" height="10" rx="0.5" fill="currentColor" />
    </>
  ),
  fastForward: <path d="M12 2v10h-2V7L5 11V3l5 4V2z" fill="currentColor" />,

  // ── nav ───────────────────────────────────────────────
  logo: (
    <>
      <path
        d="M6 2v14a3 3 0 1 1-2-2.83V4.83A3 3 0 1 0 9 2V2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="14"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    </>
  ),
  workspace: (
    <>
      <rect
        x="2"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <rect
        x="11"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <rect
        x="2"
        y="11"
        width="14"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </>
  ),
  aiGenerate: (
    <>
      <path
        d="M9 2l1.8 4.2L15 8l-4.2 1.8L9 14l-1.8-4.2L3 8l4.2-1.8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="15"
        y1="15"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  scoreEditor: (
    <>
      <line
        x1="3"
        y1="4"
        x2="3"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="4"
        x2="6"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="4"
        x2="9"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="4"
        x2="15"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="3"
        cy="13"
        rx="2"
        ry="1.2"
        fill="currentColor"
        opacity="0.7"
      />
      <ellipse
        cx="6"
        cy="11"
        rx="2"
        ry="1.2"
        fill="currentColor"
        opacity="0.7"
      />
      <ellipse
        cx="9"
        cy="9"
        rx="2"
        ry="1.2"
        fill="currentColor"
        opacity="0.7"
      />
    </>
  ),
  instruments: (
    <>
      <rect
        x="2"
        y="5"
        width="14"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <line
        x1="5.5"
        y1="5"
        x2="5.5"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="8"
        y1="5"
        x2="8"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="10.5"
        y1="5"
        x2="10.5"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="13"
        y1="5"
        x2="13"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </>
  ),

  // ── track ─────────────────────────────────────────────
  waveform: (
    <polyline
      points="1,7 4,7 5,3 7,11 8,5 9,7 13,7"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // ── transport-right ───────────────────────────────────
  zoom: (
    <>
      <line
        x1="6"
        y1="2"
        x2="6"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="6"
        x2="12"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="6"
        cy="6"
        r="5"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    </>
  ),
  snap: (
    <>
      <rect
        x="1.5"
        y="1.5"
        width="11"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <line
        x1="5.5"
        y1="1.5"
        x2="5.5"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="9.5"
        y1="1.5"
        x2="9.5"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="1.5"
        y1="5.5"
        x2="12.5"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="1.5"
        y1="9.5"
        x2="12.5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </>
  ),
  undo: (
    <>
      <path
        d="M3 7h6a3 3 0 1 0 0 6H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="5 4 3 7 5 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  redo: (
    <>
      <path
        d="M11 7H5a3 3 0 1 1 0-6h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="9 4 11 7 9 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  metronome: (
    <>
      <polygon
        points="7.5,1 13,12 2,12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="7.5"
        y1="5"
        x2="7.5"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="5.5"
        y1="12"
        x2="9.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </>
  ),

  // ── score ─────────────────────────────────────────────
  whole: (
    <ellipse
      cx="8"
      cy="8"
      rx="4"
      ry="2.5"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
  ),
  half: (
    <>
      <ellipse
        cx="5"
        cy="11"
        rx="2.5"
        ry="1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <line
        x1="7.5"
        y1="11"
        x2="7.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  quarter: (
    <>
      <ellipse cx="5" cy="11" rx="2.5" ry="1.8" fill="currentColor" />
      <line
        x1="7.5"
        y1="11"
        x2="7.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  eighth: (
    <>
      <ellipse cx="5" cy="11" rx="2.5" ry="1.8" fill="currentColor" />
      <line
        x1="7.5"
        y1="11"
        x2="7.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7.5 3 Q12 5 11 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  sixteenth: (
    <>
      <ellipse cx="5" cy="11" rx="2.5" ry="1.8" fill="currentColor" />
      <line
        x1="7.5"
        y1="11"
        x2="7.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7.5 3 Q12 5 11 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M7.5 6 Q12 8 11 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  dotted: (
    <>
      <ellipse cx="5" cy="11" rx="2.5" ry="1.8" fill="currentColor" />
      <line
        x1="7.5"
        y1="11"
        x2="7.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="11" cy="11" r="1" fill="currentColor" />
    </>
  ),
  sharp: (
    <>
      <line
        x1="4"
        y1="3"
        x2="4"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="11"
        y1="3"
        x2="11"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="6"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="10"
        x2="12"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  flat: (
    <>
      <line
        x1="5"
        y1="2"
        x2="5"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5 4 Q11 5 11 9 Q11 12 5 11 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </>
  ),
  natural: (
    <>
      <line
        x1="4"
        y1="3"
        x2="4"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="3"
        x2="10"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="7"
        x2="10"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="11"
        x2="10"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  select: (
    <>
      <path
        d="M3 2 L13 8 L8 9.5 L6 13 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  eraser: (
    <>
      <path
        d="M3 11 L8 6 L13 11 L11 13 L5 13 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  slur: (
    <>
      <path
        d="M3 11 Q8 5 13 11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  dynamics: (
    <>
      <text
        x="3"
        y="12"
        fontSize="10"
        fontFamily="serif"
        fontWeight="bold"
        fill="currentColor"
      >
        f
      </text>
      <text
        x="8"
        y="12"
        fontSize="8"
        fontFamily="serif"
        fontWeight="bold"
        fill="currentColor"
      >
        p
      </text>
    </>
  ),
  rest: (
    <path
      d="M5 2 Q9 4 6 7 Q3 10 7 12 Q10 13 9 10 Q8 8 11 6 Q13 4 10 2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // ── ai ────────────────────────────────────────────────
  sparkles: (
    <>
      <path
        d="M9 2l1.8 4.2L15 8l-4.2 1.8L9 14l-1.8-4.2L3 8l4.2-1.8z"
        fill="currentColor"
        opacity="0.8"
      />
      <circle cx="14" cy="14" r="1" fill="currentColor" />
    </>
  ),
  download: (
    <>
      <path
        d="M8 2v8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <polyline
        points="5 7 8 10 11 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="3"
        y1="13"
        x2="13"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  trash: (
    <>
      <path
        d="M3 4h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5 4 L6 2 L10 2 L11 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 4v9h6V4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  plus: (
    <>
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="8"
        x2="14"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  playSmall: <polygon points="5,3 13,8 5,13" fill="currentColor" />,

  // ── common ────────────────────────────────────────────
  close: (
    <>
      <line
        x1="3"
        y1="3"
        x2="13"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1="3"
        x2="3"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  edit: (
    <>
      <path
        d="M2 12 L2 14 L4 14 L12 6 L10 4 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="9"
        y1="5"
        x2="11"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </>
  ),
  delete: (
    <>
      <path
        d="M3 5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5 5v9h6V5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="7"
        y1="7"
        x2="7"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="7"
        x2="9"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  back: (
    <>
      <polyline
        points="9 3 3 8 9 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="3"
        y1="8"
        x2="13"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  retry: (
    <>
      <path
        d="M3 8a5 5 0 1 1 1.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="1 5 3 8 6 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  folder: (
    <path
      d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  save: (
    <>
      <path
        d="M3 2h8l2 2v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 2v3h5V2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="5"
        y="9"
        width="6"
        height="4"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </>
  ),
};

const Icon: React.FC<IconProps> = ({ name, size = 14, className }) => {
  const inner = ICON_PATHS[name];
  return (
    <span
      className={`icon${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={name}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {inner || null}
      </svg>
    </span>
  );
};

export default Icon;
