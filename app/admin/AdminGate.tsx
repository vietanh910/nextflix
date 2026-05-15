"use client";

import { useMemo, useState } from "react";

type Props = {
  children: React.ReactNode;
};

const SESSION_KEY = "nextflix:admin-auth";

export default function AdminGate({ children }: Props) {
  const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const enabled = Boolean(expectedPassword);

  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(() => {
    if (!enabled || typeof window === "undefined") return true;
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  });

  const message = useMemo(() => {
    if (!enabled) return "Soft gate tắt. Truy cập admin mở.";
    return "Nhập mật khẩu admin (soft gate client-side).";
  }, [enabled]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!enabled) return;
    if (input === expectedPassword) {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      window.alert("Mật khẩu không đúng");
    }
  };

  if (!authed) {
    return (
      <section className="mx-auto max-w-md rounded-xl border border-white/10 bg-panel p-5">
        <h1 className="text-xl font-bold">Admin Access</h1>
        <p className="mt-2 text-sm text-textMuted">{message}</p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            type="password"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="w-full rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm outline-none ring-accent focus:ring"
            placeholder="Nhập mật khẩu"
          />
          <button type="submit" className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">
            Đăng nhập
          </button>
        </form>
      </section>
    );
  }

  return <>{children}</>;
}

