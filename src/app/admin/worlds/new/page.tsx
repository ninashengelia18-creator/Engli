import Link from 'next/link';
import NewWorldForm from './NewWorldForm';

export default function NewWorldPage() {
  return (
    <div>
      <Link href="/admin/worlds" className="text-sm text-secondary">
        ← All worlds
      </Link>
      <h1 className="text-xl font-extrabold mt-1 mb-4">+ New world</h1>
      <NewWorldForm />
    </div>
  );
}
