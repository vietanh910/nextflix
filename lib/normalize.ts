const VIETNAMESE_MAP: Record<string, string> = {
  đ: "d",
  Đ: "d",
};

export function normalizeVietnamese(input: string): string {
  const replaced = input
    .split("")
    .map((char) => VIETNAMESE_MAP[char] ?? char)
    .join("");

  return replaced
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildGlobalTitle(name?: string, originName?: string): string {
  const keyBase = originName?.trim() || name?.trim() || "unknown";
  return normalizeVietnamese(keyBase);
}

export function buildGlobalKey(name?: string, originName?: string, year?: number): string {
  const title = buildGlobalTitle(name, originName);
  return year ? `${title}-${year}` : title;
}

export function safeSlug(input: string): string {
  const normalized = normalizeVietnamese(input);
  return normalized || "movie";
}
