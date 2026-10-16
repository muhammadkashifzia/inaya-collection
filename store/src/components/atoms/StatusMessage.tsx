import { cn } from "@/lib/utils";

const toneStyles = {
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-green-50 text-green-700 border-green-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

interface StatusMessageProps {
  tone: keyof typeof toneStyles;
  children?: React.ReactNode;
}

export function StatusMessage({ tone, children }: StatusMessageProps) {
  if (!children) return null;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border px-4 py-2.5 text-sm",
        toneStyles[tone],
      )}
    >
      {children}
    </p>
  );
}
