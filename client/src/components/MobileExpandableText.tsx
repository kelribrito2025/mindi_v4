import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type MobileExpandableTextProps = {
  children: ReactNode;
  collapsedText?: ReactNode;
  desktopContent?: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  collapsedClassName?: string;
  expandedClassName?: string;
  expandButtonClassName?: string;
  collapseButtonClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
};

export function MobileExpandableText({
  children,
  collapsedText,
  desktopContent,
  className,
  mobileClassName,
  desktopClassName,
  collapsedClassName,
  expandedClassName,
  expandButtonClassName,
  collapseButtonClassName,
  expandLabel = "Ver mais...",
  collapseLabel = "Ver menos",
}: MobileExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className={cn("hidden sm:block", className, desktopClassName)}>
        {desktopContent ?? children}
      </div>

      <div className={cn("sm:hidden", className, mobileClassName)}>
        {isExpanded ? (
          <div className={cn(expandedClassName)}>
            {children}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={cn(
                "inline-flex mt-1 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-sm",
                collapseButtonClassName ?? expandButtonClassName
              )}
            >
              {collapseLabel}
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className={cn("line-clamp-2 pr-20", collapsedClassName)}>
              {collapsedText ?? children}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={cn(
                "absolute bottom-0 right-0 pl-2 font-semibold leading-tight hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-sm",
                expandButtonClassName
              )}
            >
              {expandLabel}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
