import * as React from "react";

import { cn } from "@core/utils/cn.js";
import type { LucideIcon } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
  action?: {
    icon: LucideIcon;
    onClick: () => void;
  };
}

const FileInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, action, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input type="file" name="image" ref={ref} {...props} />
      </div>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
