import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import type { ContentPlanDeliverable } from '@/src/types/campaign';
import {
  addDaysIso,
  getEffectiveProductionDate,
  getEffectivePublicationDate,
  getMonthGridDays,
  getStartOfWeekIso,
  isValidIsoDate,
  parseIsoDateParts,
  type ScheduleConflict,
} from '@/src/utils/scheduleConflicts';

interface ContentCalendarProps {
  deliverables: ContentPlanDeliverable[];
  campaignStartDate: string;
  campaignEndDate: string;
  conflicts: ScheduleConflict[];
  isPlanApproved: boolean;
  onSelectDeliverable: (deliverable: ContentPlanDeliverable) => void;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function ContentCalendar({
  deliverables,
  campaignStartDate,
  campaignEndDate,
  conflicts,
  isPlanApproved,
  onSelectDeliverable,
}: ContentCalendarProps) {
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  const initialAnchor = useMemo(() => {
    if (isValidIsoDate(campaignStartDate)) return campaignStartDate;
    const firstPub = deliverables[0]
      ? getEffectivePublicationDate(deliverables[0])
      : '';
    if (isValidIsoDate(firstPub)) return firstPub;
    return new Date().toISOString().slice(0, 10);
  }, [campaignStartDate, deliverables]);

  const [cursorIso, setCursorIso] = useState<string>(initialAnchor);

  useEffect(() => {
    if (isValidIsoDate(campaignStartDate)) {
      setCursorIso(campaignStartDate);
    }
  }, [campaignStartDate]);

  const conflictDeliverableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      for (const id of c.affectedDeliverableIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [conflicts]);

  const pubMap = useMemo(() => {
    const map = new Map<string, ContentPlanDeliverable[]>();
    for (const d of deliverables) {
      const date = getEffectivePublicationDate(d);
      if (!isValidIsoDate(date)) continue;
      const arr = map.get(date) ?? [];
      arr.push(d);
      map.set(date, arr);
    }
    return map;
  }, [deliverables]);

  const prodMap = useMemo(() => {
    const map = new Map<string, ContentPlanDeliverable[]>();
    for (const d of deliverables) {
      const prod = getEffectiveProductionDate(d);
      const pub = getEffectivePublicationDate(d);
      if (!isValidIsoDate(prod) || prod === pub) continue;
      const arr = map.get(prod) ?? [];
      arr.push(d);
      map.set(prod, arr);
    }
    return map;
  }, [deliverables]);

  const { year, month } = parseIsoDateParts(cursorIso);
  const monthDays = useMemo(() => getMonthGridDays(year, month), [year, month]);

  const weekStartIso = getStartOfWeekIso(cursorIso);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));
  }, [weekStartIso]);

  const handlePrev = () => {
    if (calendarMode === 'week') {
      setCursorIso(addDaysIso(cursorIso, -7));
      return;
    }
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setCursorIso(
      `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    );
  };

  const handleNext = () => {
    if (calendarMode === 'week') {
      setCursorIso(addDaysIso(cursorIso, 7));
      return;
    }
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setCursorIso(
      `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
    );
  };

  const periodHeading =
    calendarMode === 'month'
      ? `${MONTH_NAMES[month - 1]} ${year}`
      : `${weekDays[0]} — ${weekDays[6]}`;

  const hasWindow =
    isValidIsoDate(campaignStartDate) && isValidIsoDate(campaignEndDate);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Content Calendar
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            {isPlanApproved
              ? 'Confirmed publication schedule and production deadlines. Click any card to inspect or adjust.'
              : 'Suggested publication dates and production deadlines. All cards remain editable until plan approval.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Week / Month Toggle */}
          <div
            role="tablist"
            aria-label="Calendar view mode"
            className="flex items-center gap-1 rounded-md border border-zinc-800 bg-[#09090B] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={calendarMode === 'week'}
              onClick={() => setCalendarMode('week')}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                calendarMode === 'week'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={calendarMode === 'month'}
              onClick={() => setCalendarMode('month')}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                calendarMode === 'month'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-1.5">
            {hasWindow && (
              <button
                type="button"
                onClick={() => setCursorIso(campaignStartDate)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-zinc-800 bg-[#09090B] px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
                <span>Campaign Start</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrev}
              aria-label={
                calendarMode === 'week' ? 'Previous week' : 'Previous month'
              }
              className="rounded-md border border-zinc-800 bg-[#09090B] p-1.5 text-zinc-300 hover:border-zinc-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center font-mono text-xs font-medium text-zinc-200 tabular-nums">
              {periodHeading}
            </span>
            <button
              type="button"
              onClick={handleNext}
              aria-label={
                calendarMode === 'week' ? 'Next week' : 'Next month'
              }
              className="rounded-md border border-zinc-800 bg-[#09090B] p-1.5 text-zinc-300 hover:border-zinc-700 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {calendarMode === 'month' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[840px]">
            <div className="grid grid-cols-7 border-b border-zinc-800/80 bg-[#0D0E12]">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="px-3 py-2 text-xs font-medium text-zinc-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/70">
              {monthDays.map((dayIso) => {
                const { month: cellMonth, day: cellDay } =
                  parseIsoDateParts(dayIso);
                const isCurrentMonth = cellMonth === month;
                const isInCampaignWindow =
                  hasWindow &&
                  dayIso >= campaignStartDate &&
                  dayIso <= campaignEndDate;
                const isToday = dayIso === todayIso;
                const pubs = pubMap.get(dayIso) ?? [];
                const prods = prodMap.get(dayIso) ?? [];

                return (
                  <div
                    key={dayIso}
                    className={`min-h-[124px] p-2 transition-colors ${
                      isInCampaignWindow
                        ? 'bg-[#111216]'
                        : 'bg-[#0B0C0F]/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          isToday
                            ? 'font-semibold text-violet-400'
                            : isCurrentMonth
                              ? 'text-zinc-300'
                              : 'text-zinc-600'
                        }`}
                      >
                        {cellDay}
                      </span>
                      {dayIso === campaignStartDate && (
                        <span className="font-mono text-[10px] font-medium text-emerald-400">
                          Start
                        </span>
                      )}
                      {dayIso === campaignEndDate && (
                        <span className="font-mono text-[10px] font-medium text-violet-400">
                          End
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1.5">
                      {pubs.map((item) => {
                        const hasConflict = conflictDeliverableIds.has(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectDeliverable(item)}
                            className={`w-full rounded border p-1.5 text-left transition-colors ${
                              hasConflict
                                ? 'border-amber-500/45 bg-amber-950/20 hover:border-amber-400'
                                : 'border-zinc-800 bg-[#09090B] hover:border-violet-500/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="truncate text-[11px] font-medium text-zinc-100">
                                {item.title}
                              </span>
                              {hasConflict && (
                                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] text-zinc-400">
                              {item.channel} ·{' '}
                              {item.format === 'Other' && item.customFormat
                                ? item.customFormat
                                : item.format}
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <StatusIndicator status={item.approvalStatus} />
                              {!isPlanApproved && (
                                <span className="text-[10px] text-zinc-500">
                                  Sugg.
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {prods.map((item) => (
                        <button
                          key={`prod_${item.id}`}
                          type="button"
                          onClick={() => onSelectDeliverable(item)}
                          className="w-full rounded border border-dashed border-zinc-800 bg-transparent px-1.5 py-1 text-left text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        >
                          <span className="truncate block">
                            Prod due: {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Weekly View */
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 divide-x divide-zinc-800/80">
            {weekDays.map((dayIso, idx) => {
              const isInCampaignWindow =
                hasWindow &&
                dayIso >= campaignStartDate &&
                dayIso <= campaignEndDate;
              const pubs = pubMap.get(dayIso) ?? [];
              const prods = prodMap.get(dayIso) ?? [];

              return (
                <div
                  key={dayIso}
                  className={`min-h-[320px] p-3 ${
                    isInCampaignWindow ? 'bg-[#111216]' : 'bg-[#0B0C0F]'
                  }`}
                >
                  <div className="border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        {WEEKDAY_LABELS[idx]}
                      </span>
                      {dayIso === campaignStartDate && (
                        <span className="font-mono text-[10px] text-emerald-400">
                          Start
                        </span>
                      )}
                      {dayIso === campaignEndDate && (
                        <span className="font-mono text-[10px] text-violet-400">
                          End
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-xs font-semibold text-zinc-200 tabular-nums">
                      {dayIso}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {pubs.map((item) => {
                      const hasConflict = conflictDeliverableIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectDeliverable(item)}
                          className={`w-full rounded-md border p-2.5 text-left transition-colors ${
                            hasConflict
                              ? 'border-amber-500/45 bg-amber-950/20 hover:border-amber-400'
                              : 'border-zinc-800 bg-[#09090B] hover:border-violet-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-medium text-zinc-100 leading-snug">
                              {item.title}
                            </span>
                            {hasConflict && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-400">
                            {item.channel} ·{' '}
                            {item.format === 'Other' && item.customFormat
                              ? item.customFormat
                              : item.format}
                          </div>
                          {item.phase && (
                            <div className="mt-1 truncate text-[10px] text-zinc-500">
                              {item.phase}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-zinc-800/70 pt-1.5">
                            <StatusIndicator status={item.approvalStatus} />
                            <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                              {isPlanApproved ? 'Pub' : 'Sugg. Pub'}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {prods.map((item) => (
                      <button
                        key={`wprod_${item.id}`}
                        type="button"
                        onClick={() => onSelectDeliverable(item)}
                        className="w-full rounded border border-dashed border-zinc-800 bg-[#0D0E12] p-2 text-left text-[11px] text-zinc-300 hover:border-zinc-600"
                      >
                        <div className="font-medium text-zinc-200">
                          Production Due
                        </div>
                        <div className="mt-0.5 truncate text-zinc-400">
                          {item.title}
                        </div>
                      </button>
                    ))}

                    {pubs.length === 0 && prods.length === 0 && (
                      <div className="py-6 text-center text-[11px] text-zinc-600">
                        No scheduled deliverables
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
