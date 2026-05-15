import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-6 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy nội dung</h1>
      <p className="mt-2 text-sm text-textMuted">Route hoặc dữ liệu có thể chưa được sync.</p>
      <Link href="/" className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">
        Về trang chủ
      </Link>
    </div>
  );
}

