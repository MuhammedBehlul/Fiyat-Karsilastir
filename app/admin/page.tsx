import { getLastScrapeRuns, getPendingMatchReviews } from '@/lib/queries';
import { logout } from './login/actions';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Yönetici paneli' };

export default async function AdminPage() {
  const runs = await getLastScrapeRuns().catch(() => []);
  const reviews = await getPendingMatchReviews().catch(() => []);

  return (
    <AdminDashboardClient
      initialRuns={runs}
      initialReviews={reviews}
      logoutAction={logout}
    />
  );
}
