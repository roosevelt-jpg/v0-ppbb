import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-[11px] font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'bg-black !text-white hover:bg-neutral-800 [a]:hover:bg-neutral-800',
        outline:
          'border-neutral-300 bg-white !text-neutral-900 hover:bg-neutral-50 aria-expanded:bg-neutral-50',
        secondary:
          'bg-black !text-white hover:bg-neutral-800 aria-expanded:bg-neutral-800',
        ghost:
          'bg-transparent !text-neutral-900 hover:bg-neutral-100 border-transparent',
        destructive:
          'bg-black !text-white hover:bg-neutral-800 focus-visible:border-black focus-visible:ring-neutral-400/30',
        link: 'bg-transparent !text-neutral-900 underline-offset-4 hover:underline border-transparent',
      },
      size: {
        default:
          'h-7 min-h-0 gap-1 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: 'h-6 min-h-0 gap-1 rounded-md px-2 text-[11px] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        sm: 'h-7 min-h-0 gap-1 rounded-md px-2.5 text-[11px] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        lg: 'h-8 min-h-0 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-7',
        'icon-xs':
          'size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm':
          'size-7 rounded-md in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
