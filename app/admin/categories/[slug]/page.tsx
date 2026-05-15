import AdminGate from "../../AdminGate";
import CategoryDetailClient from "./CategoryDetailClient";
import { getManifest } from "../../../../lib/data";
import { Suspense } from "react";

export async function generateStaticParams() {
  try {
    const manifest = await getManifest();
    return manifest.categorySlugs.map((slug) => ({ slug }));
  } catch {
    return [{ slug: "sample" }];
  }
}

export default function AdminCategoryDetailPage({ params }: { params: { slug: string } }) {
  return (
    <AdminGate>
      <Suspense fallback={<p className="text-textMuted">Dang tai danh muc...</p>}>
        <CategoryDetailClient slug={params.slug} />
      </Suspense>
    </AdminGate>
  );
}
