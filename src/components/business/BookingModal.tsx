"use client";

import { ArrowLeft, CalendarPlus, Check, Clock, Loader2, UserRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { availabilityAction, createBookingAction, type BookingResult, type Slot } from "@/server/actions/booking";
import { DAY_SHORT, addDays, formatDateLong, formatMnt, parseHm, ubDate, ubParts, weekdayOf } from "@/lib/format";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import type { OpeningHours } from "@/db/schema";
import { Modal } from "../ui/Modal";
import { useDiscovery } from "../shell/DiscoveryProvider";

export type BookService = { id: string; name: string; priceMnt: number; durationMin: number; bookable: boolean; description: string };
export type BookStaff = { id: string; name: string; title: string };

const STEPS = ["Үйлчилгээ", "Огноо, цаг", "Баталгаажуулах"];

function icsFor(args: { title: string; date: string; time: string; durationMin: number; location: string; code: string }) {
  const start = ubDate(args.date, parseHm(args.time));
  const end = new Date(start.getTime() + args.durationMin * 60_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NOMAD BUSINESS//MN",
    "BEGIN:VEVENT",
    `UID:${args.code}@nomad-business`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${args.title}`,
    `LOCATION:${args.location}`,
    `DESCRIPTION:Захиалгын код ${args.code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function BookingModal({
  open, onClose, business, services, staff, initialServiceId, hours,
}: {
  open: boolean;
  onClose: () => void;
  business: { id: string; name: string; address: string };
  services: BookService[];
  staff: BookStaff[];
  initialServiceId?: string | null;
  hours: OpeningHours;
}) {
  const d = useDiscovery();
  const bookable = services.filter((s) => s.bookable);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string>(initialServiceId ?? "");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, startLoad] = useTransition();
  const [rawState, onSubmit, pending] = useFormAction(createBookingAction, initialState);
  const state = rawState as BookingResult;

  const service = bookable.find((s) => s.id === (serviceId || initialServiceId)) ?? null;
  const today = ubParts(d.now).ymd;
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);

  const loadSlots = (nextDate: string, nextService: string, nextStaff: string) => {
    if (!nextDate || !nextService) return;
    setSlots(null);
    startLoad(async () => {
      const res = await availabilityAction({ businessId: business.id, serviceId: nextService, staffId: nextStaff || null, date: nextDate });
      setSlots(res.slots);
    });
  };

  const pickService = (id: string) => {
    setServiceId(id);
    setTime("");
    loadSlots(date, id, staffId);
  };
  const pickStaff = (id: string) => {
    setStaffId(id);
    setTime("");
    loadSlots(date, serviceId, id);
  };
  const pickDate = (ymd: string) => {
    setDate(ymd);
    setTime("");
    loadSlots(ymd, serviceId, staffId);
  };

  const success = state.ok && state.data;
  const fe = state.fieldErrors ?? {};
  const staffName = staff.find((s) => s.id === staffId)?.name ?? "Аль ч мастер";

  const reset = () => {
    setStep(1);
    setTime("");
    setSlots(null);
  };
  const close = () => {
    onClose();
    window.setTimeout(reset, 300);
  };

  const download = () => {
    if (!state.data || !service) return;
    const blob = new Blob([icsFor({ title: `${service.name}: ${business.name}`, date, time, durationMin: service.durationMin, location: business.address, code: state.data.code })], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.data.code}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal open={open} onClose={close} title="Цаг захиалах" size="lg">
      {success && state.data ? (
        <div className="py-2 text-center" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok text-white">
            <Check size={28} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Захиалга амжилттай баталгаажлаа.</h3>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">
            {state.data.businessName} таны захиалгыг хүлээн авлаа. Төлөв: хүлээгдэж байна.
          </p>
          <dl className="card mx-auto mt-6 grid max-w-sm gap-3 p-5 text-left text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-3">Захиалгын код</dt><dd className="font-mono font-bold">{state.data.code}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-3">Үйлчилгээ</dt><dd className="text-right font-semibold">{state.data.serviceName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-3">Огноо, цаг</dt><dd className="text-right font-semibold">{formatDateLong(date)}, {time}</dd></div>
            {state.data.staffName && <div className="flex justify-between gap-4"><dt className="text-ink-3">Мастер</dt><dd className="font-semibold">{state.data.staffName}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-ink-3">Үнэ</dt><dd className="font-semibold">{formatMnt(state.data.price)}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <button type="button" onClick={download} className="btn btn-ghost"><CalendarPlus size={17} aria-hidden="true" /> Календарьт нэмэх</button>
            <button type="button" onClick={close} className="btn btn-primary">Болсон</button>
          </div>
        </div>
      ) : bookable.length === 0 ? (
        <p className="py-6 text-ink-2">Энэ бизнес одоогоор онлайн захиалга авахгүй байна. Утсаар холбогдоно уу.</p>
      ) : (
        <form onSubmit={onSubmit} className="pb-1" noValidate>
          <input type="hidden" name="businessId" value={business.id} />
          <input type="hidden" name="serviceId" value={service?.id ?? ""} />
          <input type="hidden" name="staffId" value={staffId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />

          <ol className="mb-5 flex items-center gap-2" aria-label="Алхам">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2" aria-current={step === i + 1 ? "step" : undefined}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${step > i + 1 ? "bg-ok text-white" : step === i + 1 ? "bg-ink text-bg" : "bg-surface-2 text-ink-3"}`}>
                  {step > i + 1 ? <Check size={13} /> : i + 1}
                </span>
                <span className={`hidden text-[13px] font-semibold sm:inline ${step === i + 1 ? "text-ink" : "text-ink-3"}`}>{label}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
              </li>
            ))}
          </ol>

          {step === 1 && (
            <div>
              <fieldset>
                <legend className="label">Үйлчилгээ сонгох</legend>
                <div className="grid gap-2">
                  {bookable.map((s) => (
                    <label key={s.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-3.5 transition-colors ${service?.id === s.id ? "border-ink bg-surface-2" : "border-line hover:border-stone"}`}>
                      <span className="flex items-center gap-3">
                        <input type="radio" name="service-pick" checked={service?.id === s.id} onChange={() => pickService(s.id)} className="h-4 w-4 accent-[var(--color-accent)]" />
                        <span>
                          <span className="block text-[15px] font-semibold">{s.name}</span>
                          <span className="flex items-center gap-1 text-[13px] text-ink-3"><Clock size={12} aria-hidden="true" /> {s.durationMin} мин</span>
                        </span>
                      </span>
                      <span className="font-mono text-sm font-bold">{formatMnt(s.priceMnt)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {staff.length > 0 && (
                <fieldset className="mt-5">
                  <legend className="label">Мастер, ажилтан</legend>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="chip" aria-pressed={staffId === ""} onClick={() => pickStaff("")}>Аль ч мастер</button>
                    {staff.map((s) => (
                      <button key={s.id} type="button" className="chip" aria-pressed={staffId === s.id} onClick={() => pickStaff(s.id)}>
                        <UserRound size={14} aria-hidden="true" /> {s.name}
                        {s.title && <span className="text-xs opacity-70">{s.title}</span>}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="mt-6 flex justify-end">
                <button type="button" className="btn btn-primary" disabled={!service} onClick={() => { setStep(2); loadSlots(date, service!.id, staffId); }}>
                  Үргэлжлүүлэх
                </button>
              </div>
            </div>
          )}

          {step === 2 && service && (
            <div>
              <p className="label">Огноо сонгох</p>
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Огноо">
                {days.map((ymd) => {
                  const wd = weekdayOf(ymd);
                  const closed = !hours[wd];
                  const active = ymd === date;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={closed}
                      onClick={() => pickDate(ymd)}
                      className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-ink bg-ink text-bg" : "border-line hover:border-stone"}`}
                    >
                      <span className="text-[11px] font-semibold uppercase">{ymd === today ? "Өнөөдөр" : DAY_SHORT[wd]}</span>
                      <span className="text-xl font-extrabold leading-tight">{Number(ymd.slice(8))}</span>
                      <span className="text-[10px] opacity-70">{closed ? "Амарна" : `${Number(ymd.slice(5, 7))}-р сар`}</span>
                    </button>
                  );
                })}
              </div>
              {fe.date && <p className="field-error">{fe.date}</p>}

              <p className="label mt-4">Цаг сонгох</p>
              {!date ? (
                <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-2">Эхлээд огноогоо сонгоно уу.</p>
              ) : loading || slots === null ? (
                <div className="flex items-center gap-2 py-4 text-sm text-ink-2"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Сул цагийг шалгаж байна...</div>
              ) : slots.length === 0 ? (
                <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-2">Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" role="listbox" aria-label="Цаг">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      role="option"
                      aria-selected={time === s.time}
                      disabled={!s.available}
                      onClick={() => setTime(s.time)}
                      className={`rounded-xl border py-2.5 font-mono text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 ${time === s.time ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"}`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
              {fe.time && <p className="field-error">{fe.time}</p>}

              <div className="mt-6 flex items-center justify-between">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" /> Буцах</button>
                <button type="button" className="btn btn-primary" disabled={!date || !time} onClick={() => setStep(3)}>Үргэлжлүүлэх</button>
              </div>
            </div>
          )}

          {step === 3 && service && (
            <div>
              <div className="card mb-5 grid gap-1.5 p-4 text-sm">
                <p className="font-bold">{service.name}</p>
                <p className="text-ink-2">{formatDateLong(date)}, {time} · {service.durationMin} мин</p>
                <p className="text-ink-2">{staffName} · <span className="font-mono font-semibold text-ink">{formatMnt(service.priceMnt)}</span></p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="bk-name">Нэр</label>
                  <input id="bk-name" name="name" className="field" defaultValue={d.viewer?.name ?? ""} autoComplete="name" aria-invalid={!!fe.name} aria-describedby={fe.name ? "bk-name-e" : undefined} />
                  {fe.name && <p id="bk-name-e" className="field-error">{fe.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="bk-phone">Утасны дугаар</label>
                  <input id="bk-phone" name="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="99112233" aria-invalid={!!fe.phone} aria-describedby={fe.phone ? "bk-phone-e" : undefined} />
                  {fe.phone && <p id="bk-phone-e" className="field-error">{fe.phone}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="label" htmlFor="bk-note">Нэмэлт тэмдэглэл (заавал биш)</label>
                <textarea id="bk-note" name="note" className="field" rows={3} maxLength={300} />
                {fe.note && <p className="field-error">{fe.note}</p>}
              </div>
              {state.message && !state.ok && <p className="field-error mt-3" role="alert">{state.message}</p>}
              <p className="mt-4 text-xs text-ink-3">Энэ нь жишээ платформ тул захиалга бодит бизнест очихгүй. Төлбөр авахгүй.</p>
              <div className="mt-5 flex items-center justify-between">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16} aria-hidden="true" /> Буцах</button>
                <button type="submit" className="btn btn-accent" disabled={pending}>
                  {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Илгээж байна</> : "Захиалах"}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
