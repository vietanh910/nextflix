import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getManifest, getMovieById } from "../../../lib/data";
import WatchClient from "./WatchClient";

type Params = {
  id: string;
};

export async function generateStaticParams() {
  try {
    const manifest = await getManifest();
    return manifest.movieIds.map((id) => ({ id }));
  } catch {
    return [{ id: "sample-movie-1" }];
  }
}

export default async function WatchPage({ params }: { params: Params }) {
  try {
    const movie = await getMovieById(params.id);
    return (
      <Suspense fallback={<p className="text-textMuted">Dang tai player...</p>}>
        <WatchClient movie={movie} />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
