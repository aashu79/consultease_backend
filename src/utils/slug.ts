const sanitizeBaseSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const buildBaseConsultancySlug = (name: string): string => {
  const base = sanitizeBaseSlug(name);
  return base || "consultancy";
};
