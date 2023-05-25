import Items from '@/app/admin/widgets/items';
import { getWidgets } from '@/app/admin/widgets/op';
import { authenticateGuard } from '@/src/auth';

export default async function Page () {
  await authenticateGuard('/admin/widgets');

  return (
    <div className="container m-auto py-4">
      <h1 className="text-xl">Widgets list</h1>
      <Items items={await getWidgets()} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
