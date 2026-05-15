import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewUnitForm from './NewUnitForm';

export const dynamic = 'force-dynamic';

export default async function NewUnitPage({
  searchParams
}: {
  searchParams: { world?: string };
}) {
  const admin = createServiceRoleClient();
  const { data: worlds } = await admin
    .from('worlds')
    .select('id, title_ka, title_en')
    .order('display_order');

  return (
    <div>
      <Link href="/admin/units" className="text-sm text-secondary">
        ← All units
      </Link>
      <h1 className="text-xl font-extrabold mt-1 mb-4">+ New unit</h1>
      {(!worlds || worlds.length === 0) ? (
        <div className="card text-center text-sm">
          You need to create a world first.{' '}
          <Link className="text-secondary font-bold" href="/admin/worlds/new">
            Create one →
          </Link>
        </div>
      ) : (
        <NewUnitForm worlds={worlds} defaultWorldId={searchParams.world} />
      )}
    </div>
  );
}
