export const BOOKING_LABEL: Record<string, string> = {
  PENDING: "Хүлээгдэж байна",
  CONFIRMED: "Баталгаажсан",
  CANCELLED: "Цуцлагдсан",
  COMPLETED: "Дууссан",
};
export const BOOKING_TONE: Record<string, string> = {
  PENDING: "bg-[#f3e4c3] text-warn",
  CONFIRMED: "bg-[#d6e8dc] text-ok",
  CANCELLED: "bg-[#efd6d2] text-danger",
  COMPLETED: "bg-surface-2 text-ink-2",
};
export const BUSINESS_STATUS_LABEL: Record<string, string> = { PENDING: "Хүлээгдэж байна", ACTIVE: "Нийтлэгдсэн", SUSPENDED: "Түр хаасан" };
export const REVIEW_STATUS_LABEL: Record<string, string> = { VISIBLE: "Харагдаж байна", HIDDEN: "Нуугдсан" };
export const ROLE_LABEL: Record<string, string> = { USER: "Хэрэглэгч", OWNER: "Бизнес эзэмшигч", ADMIN: "Админ" };
export const USER_STATUS_LABEL: Record<string, string> = { ACTIVE: "Идэвхтэй", BANNED: "Хориглосон" };
export const REPORT_STATUS_LABEL: Record<string, string> = { OPEN: "Нээлттэй", RESOLVED: "Шийдвэрлэсэн", DISMISSED: "Хэрэгсэхгүй болгосон" };
