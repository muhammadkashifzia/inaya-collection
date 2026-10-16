import { Heading } from "@/components/atoms";

interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <Heading level={2} align="center">
        {title}
      </Heading>
      <span className="h-0.5 w-14 bg-brand" aria-hidden />
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
