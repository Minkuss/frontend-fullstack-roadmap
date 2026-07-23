import {
  forwardRef,
  type ButtonHTMLAttributes,
} from 'react'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className = '', type = 'button', variant = 'primary', ...props },
    ref,
  ) {
    const classes = ['button', `button--${variant}`, className]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        {...props}
        className={classes}
        ref={ref}
        type={type}
      />
    )
  },
)
