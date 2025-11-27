import React from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface Event {
    id: string;
    title: string;
    date: Date;
    status: string;
    color?: string;
}

interface CalendarViewProps {
    events: Event[];
    onEventClick?: (event: Event) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    const getStatusColor = (status: string) => {
        if (['approved', 'ready', 'Aprovado', 'Pronto para Entrega'].includes(status)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (['pending', 'production', 'Em Produção'].includes(status)) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (['delivered', 'Entregue', 'Em Entrega'].includes(status)) return 'bg-slate-100 text-slate-700 border-slate-200';
        if (['rejected', 'Cancelado'].includes(status)) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Calendar Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200 flex-none">
                <h2 className="text-lg font-semibold text-slate-900 capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={today}>Hoje</Button>
                    <div className="flex items-center rounded-md border border-slate-200">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none border-r" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 flex-none">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px flex-1 overflow-y-auto">
                {days.map((day) => {
                    const dayEvents = events.filter(evt => isSameDay(evt.date, day));

                    return (
                        <div
                            key={day.toString()}
                            className={`min-h-[100px] bg-white p-2 transition-colors hover:bg-slate-50 flex flex-col ${!isSameMonth(day, monthStart) ? 'bg-slate-50/50 text-slate-400' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`
                  text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday(day) ? 'bg-rose-500 text-white' : 'text-slate-700'}
                `}>
                                    {format(day, 'd')}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="text-[10px] font-medium text-slate-400">{dayEvents.length}</span>
                                )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[120px]">
                                {dayEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => onEventClick && onEventClick(event)}
                                        className={`w-full text-left text-[10px] truncate px-1.5 py-0.5 rounded border ${getStatusColor(event.status)}`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
