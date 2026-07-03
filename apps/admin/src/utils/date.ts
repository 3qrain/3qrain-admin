export function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${h}:${m}`;
}

// 2026年 7月3日 周五
export function formatDateWithWeek(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年 ${String(d.getMonth() + 1)}月${String(d.getDate())}日 周${week[d.getDay()]}`;
}
