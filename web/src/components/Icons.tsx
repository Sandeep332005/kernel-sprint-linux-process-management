import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

const base = "24";
const wrap = (children: ReactNode, className?: string) => (
  <svg
    viewBox={`0 0 ${base} ${base}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export function HomeIcon({ className }: IconProps) {
  return wrap(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-6h4v6" />
    </>,
    className
  );
}

export function FeaturesIcon({ className }: IconProps) {
  return wrap(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </>,
    className
  );
}

export function OrchestrateIcon({ className }: IconProps) {
  return wrap(
    <>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M12 6.5v6M12 12.5 5 16M12 12.5l7 3.5" />
    </>,
    className
  );
}

export function WorkflowIcon({ className }: IconProps) {
  return wrap(
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 7v10M8 5h4a4 4 0 0 1 4 4M8 19h4a4 4 0 0 0 4-4" />
    </>,
    className
  );
}

export function SetupIcon({ className }: IconProps) {
  return wrap(
    <>
      <path d="M14.7 6.3 17.7 3.3l3 3-3 3" />
      <path d="M13 8 4 17v3h3l9-9" />
      <path d="M11 6l7 7" />
    </>,
    className
  );
}

export function LabIcon({ className }: IconProps) {
  return wrap(
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M6.5 9.5 9.5 12l-3 2.5" />
      <path d="M12.5 14.5h5" />
    </>,
    className
  );
}

export function BenchmarkIcon({ className }: IconProps) {
  return wrap(
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
    </>,
    className
  );
}

export function PatchIcon({ className }: IconProps) {
  return wrap(
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="9" r="2.2" />
      <path d="M6 8.2V15.8" />
      <path d="M6 8.2C6 12 9 11 12 11s6 -1 6 2.2" />
    </>,
    className
  );
}

export function ExperimentsIcon({ className }: IconProps) {
  return wrap(
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6.2L4.8 18a1.6 1.6 0 0 0 1.4 2.4h11.6a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3" />
      <path d="M7.5 15h9" />
    </>,
    className
  );
}

export function ChaosIcon({ className }: IconProps) {
  return wrap(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />, className);
}

export function ResultsIcon({ className }: IconProps) {
  return wrap(
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M9 3.5V2h6v1.5" />
      <path d="M8.5 11l2 2 4-4.5" />
      <path d="M8.5 16.5h7" />
    </>,
    className
  );
}

export function DocsIcon({ className }: IconProps) {
  return wrap(
    <>
      <path d="M6 3.5h9l3 3v14H6z" />
      <path d="M15 3.5V7h3" />
      <path d="M9 12h6M9 15.5h6" />
    </>,
    className
  );
}
