import Link from 'next/link';
import { logout } from '@/app/hesap/actions';
import type { CurrentUser } from '@/lib/currentUser';
import { buttonClasses } from './Button';
import { BellIcon, HeartIcon, UserIcon } from './icons';

/**
 * Navbar hesap alanı (masaüstü). Oturum yoksa "Giriş yap" linki; varsa native
 * <details> açılır menü (JS gerektirmez — mobil menü ve mega menüyle aynı desen).
 */
export default function AccountMenu({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      <Link href="/giris" className={buttonClasses('secondary', 'sm', 'shrink-0')}>
        <UserIcon className="h-4 w-4" />
        Giriş yap
      </Link>
    );
  }

  return (
    <details className="group relative shrink-0">
      <summary
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-body-sm font-medium text-text hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden"
        aria-label="Hesap menüsü"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-caption font-bold uppercase text-primary">
          {user.email[0]}
        </span>
        <span className="hidden max-w-[140px] truncate xl:inline">{user.email}</span>
      </summary>
      <nav className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-border bg-surface py-2 shadow-lg">
        <p className="truncate px-4 pb-2 pt-1 text-caption text-muted">{user.email}</p>
        <span aria-hidden className="mx-4 mb-1 block h-px bg-border" />
        <Link href="/favorilerim" className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm font-medium text-text hover:bg-primary-soft hover:text-primary">
          <HeartIcon className="h-4 w-4" /> Favorilerim
        </Link>
        <Link href="/alarmlarim" className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm font-medium text-text hover:bg-primary-soft hover:text-primary">
          <BellIcon className="h-4 w-4" /> Fiyat alarmlarım
        </Link>
        <span aria-hidden className="mx-4 my-1 block h-px bg-border" />
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-body-sm font-medium text-muted hover:bg-surface-alt hover:text-danger">
            Çıkış yap
          </button>
        </form>
      </nav>
    </details>
  );
}
