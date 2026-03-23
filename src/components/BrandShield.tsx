import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
} as const;

export type BrandShieldSize = keyof typeof sizeClass;

interface Props {
  size?: BrandShieldSize;
  className?: string;
  alt?: string;
}

export default function BrandShield({ size = "lg", className }: Props) {
  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(sizeClass[size], "shrink-0 select-none", className)}
    >
      {/* Shield body */}
      <path
        d="M16 2L4 8v10c0 8.4 5.12 16.24 12 18 6.88-1.76 12-9.6 12-18V8L16 2Z"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <path
        d="M11 18l4 4 7-8"
        className="stroke-primary"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
