import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { SearchIcon } from './icons';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Solda gösterilecek ikon (renk/mizanpaj bileşen tarafından yönetilir). */
  leadingIcon?: ReactNode;
}

export default function Input({ leadingIcon, className, ...rest }: InputProps) {
  return (
    <div className={cx('relative', className)}>
      {leadingIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          {leadingIcon}
        </span>
      )}
      <input
        className={cx(
          'h-11 w-full rounded-xl border border-border bg-surface text-body-sm text-text transition-all duration-200',
          'placeholder:text-muted/70',
          'focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none shadow-sm',
          leadingIcon ? 'pl-11 pr-4' : 'px-4',
        )}
        {...rest}
      />
    </div>
  );
}

/**
 * Arama çubuğu: GET formu olarak /ara'ya gider, JS gerektirmez.
 * Navbar'da ve ana sayfa hero'sunda aynı bileşen kullanılır.
 */
export function SearchInput({
  className,
  ...rest
}: Omit<InputProps, 'leadingIcon' | 'type' | 'name'>) {
  return (
    <form action="/ara" role="search" className={className}>
      <Input
        type="search"
        name="q"
        leadingIcon={<SearchIcon className="h-4.5 w-4.5" />}
        autoComplete="off"
        {...rest}
      />
    </form>
  );
}
