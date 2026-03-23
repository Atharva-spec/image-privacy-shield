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

export default function BrandShield({ size = "lg", className, alt = "" }: Props) {
  const decorative = alt === "";
  return (
    <img
      src="/shield-icon.png"
      alt={alt}
      width={128}
      height={128}
      decoding="async"
      draggable={false}
      aria-hidden={decorative ? true : undefined}
      className={cn(sizeClass[size], "shrink-0 select-none object-contain dark:brightness-100 brightness-0", className)}
    />
  );
}
