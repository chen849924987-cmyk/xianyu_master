# UI 组件规范

## 组件库结构

基于 shadcn/ui 风格的分层结构：

```
components/
├── ui/              # 基础 UI 组件（原子）
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── separator.tsx
│   └── table.tsx
├── hooks/           # Hooks 相关组件
│   └── HookUsageCharts.tsx
└── {domain}/        # 业务组件
    └── ComponentName.tsx
```

## 基础组件使用

```typescript
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

## cva 变体定义

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

## 组件 Props 模式

```typescript
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function Button(
  { className, variant, size, asChild = false, ...props }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
}
```

## 组件文件模板

```typescript
// @/components/ui/my-component.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

// 类型定义
export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

// 组件实现
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card p-4", className)}
        {...props}
      >
        {title && <h3 className="font-semibold">{title}</h3>}
        {children}
      </div>
    );
  }
);

MyComponent.displayName = "MyComponent";

export { MyComponent };
```
