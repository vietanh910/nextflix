"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Stats } from "../lib/types";

const navLinks = [
  { href: "/tim-kiem?type=single", label: "Phim Lẻ" },
  { href: "/tim-kiem?type=series", label: "Phim Bộ" },
  { href: "/tim-kiem", label: "Tìm kiếm" },
  { href: "/admin", label: "Admin" },
];

const defaultCategoryLinks = [
  { href: "/tim-kiem?category=hanh-dong", label: "Hành động" },
  { href: "/tim-kiem?category=tinh-cam", label: "Tình cảm" },
  { href: "/tim-kiem?category=hoat-hinh", label: "Hoạt hình" },
];

const countryLinks = [
  { href: "/tim-kiem?q=Viet%20Nam", label: "Việt Nam" },
  { href: "/tim-kiem?q=Han%20Quoc", label: "Hàn Quốc" },
  { href: "/tim-kiem?q=Au%20My", label: "Âu Mỹ" },
];

function Dropdown({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <details className="relative shrink-0">
      <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-[17px] text-white/90 hover:bg-white/10 hover:text-white">
        {title} <span className="text-xs">▼</span>
      </summary>
      <div className="absolute left-0 top-full z-30 mt-2 min-w-[220px] rounded-lg border border-white/10 bg-[#0b1020] p-2 shadow-2xl">
        {items.map((item) => (
          <Link key={item.href + item.label} href={item.href} className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export default function Header({ categories }: { categories?: Stats["byCategory"] }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const categoryLinks =
    categories && categories.length > 0
      ? categories.map((item) => ({
          href: `/tim-kiem?category=${item.slug}`,
          label: `${item.name} (${item.count})`,
        }))
      : defaultCategoryLinks;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/tim-kiem?q=${encodeURIComponent(q)}` : "/tim-kiem");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-[#070b17] via-[#070d20] to-[#060b18] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-wide text-accent">
          Nextflix
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={onSubmit} className="flex w-full max-w-[460px] items-center rounded-lg bg-white/10 px-4 py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-white/80" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm phim, diễn viên"
              className="ml-3 w-full bg-transparent text-lg text-white outline-none placeholder:text-white/70"
            />
          </form>

          <nav className="flex min-w-0 flex-1 items-center gap-1 whitespace-nowrap overflow-visible">
            <Dropdown title="Thể loại" items={categoryLinks} />
            {navLinks.map((item) => (
              <Link key={item.href + item.label} href={item.href} className="rounded-md px-3 py-2 text-[17px] text-white/90 hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ))}
            <Dropdown title="Quốc gia" items={countryLinks} />
          </nav>
        </div>
      </div>
    </header>
  );
}

