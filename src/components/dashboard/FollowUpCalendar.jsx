import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfDay, isSameDay, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MessageSquare, ChevronLeft, ChevronRight, Zap, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  pending: "bg-amber-500/15 border-amber-500/25 text-amber-300",
  sent: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
  cancelled: "bg-white/8 border-white/10 text-muted-foreground",
  failed: "bg-red-500/15 border-red-500/25 text-red-300",
};

function FollowUpItem({ followUp, index, leadMap }) {
  const lead = leadMap[followUp.lead_id];
  const isPastDue = isPast(new Date(followUp.scheduled_time)) && followUp.status === "pending";

  return (
    <Draggable draggableId={followUp.id} index={index} isDragDisabled={followUp.status !== "pending"}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            group rounded-xl border px-3 py-2 mb-1.5 cursor-grab active:cursor-grabbing text-xs
            transition-all duration-150 select-none
            ${STATUS_COLORS[followUp.status] || STATUS_COLORS.pending}
            ${snapshot.isDragging ? "shadow-xl shadow-primary/20 scale-105 rotate-1 z-50" : ""}
            ${isPastDue ? "ring-1 ring-red-500/30" : ""}
            ${followUp.status !== "pending" ? "opacity-60 cursor-default" : "hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"}
          `}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-semibold truncate">{lead?.name || "Lead inconnu"}</span>
            {isPastDue && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full flex-shrink-0">En retard</span>}
          </div>
          <div className="flex items-center gap-1 text-[10px] opacity-70">
            <Clock className="w-2.5 h-2.5" />
            {format(new Date(followUp.scheduled_time), "HH:mm", { locale: fr })}
            <span className="ml-1 truncate">{followUp.message_content?.slice(0, 30)}…</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function FollowUpCalendar() {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [toast, setToast] = useState(null);

  const today = startOfDay(new Date());
  const weekStart = addDays(today, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const leadMap = leads.reduce((acc, l) => { acc[l.id] = l; return acc; }, {});

  useEffect(() => {
    const load = async () => {
      const [fups, leds] = await Promise.all([
        base44.entities.FollowUp.list("scheduled_time", 200),
        base44.entities.Lead.list("-created_date", 200),
      ]);
      setFollowUps(fups);
      setLeads(leds);
      setLoading(false);
    };
    load();
  }, []);

  const getFollowUpsForDay = (day) =>
    followUps
      .filter(f => isSameDay(new Date(f.scheduled_time), day))
      .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const targetDayIndex = parseInt(destination.droppableId.replace("day-", ""));
    const targetDay = days[targetDayIndex];
    const followUp = followUps.find(f => f.id === draggableId);
    if (!followUp) return;

    const oldDate = new Date(followUp.scheduled_time);
    const newDate = new Date(targetDay);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    if (isSameDay(oldDate, newDate)) return;

    // Optimistic update
    setFollowUps(prev =>
      prev.map(f =>
        f.id === draggableId
          ? { ...f, scheduled_time: newDate.toISOString() }
          : f
      )
    );

    try {
      await base44.entities.FollowUp.update(draggableId, {
        scheduled_time: newDate.toISOString(),
      });
      const lead = leadMap[followUp.lead_id];
      showToast(`Relance de ${lead?.name || "lead"} déplacée au ${format(newDate, "EEEE d MMM", { locale: fr })}`);
    } catch {
      // Rollback
      setFollowUps(prev =>
        prev.map(f =>
          f.id === draggableId
            ? { ...f, scheduled_time: followUp.scheduled_time }
            : f
        )
      );
      showToast("Erreur lors du déplacement", "error");
    }
  };

  const pendingTotal = followUps.filter(f => f.status === "pending").length;

  return (
    <div className="card-surface p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Calendrier des relances</h3>
            {pendingTotal > 0 && (
              <p className="text-[11px] text-muted-foreground">{pendingTotal} relance{pendingTotal > 1 ? "s" : ""} en attente · glisser pour reprogrammer</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${weekOffset === 0 ? "bg-primary/15 text-primary" : "hover:bg-white/8 text-muted-foreground hover:text-foreground"}`}
          >
            Auj.
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, dayIndex) => {
              const dayFollowUps = getFollowUpsForDay(day);
              const isToday = isSameDay(day, today);
              const isPastDay = day < today && !isToday;

              return (
                <div key={dayIndex} className="flex flex-col min-h-[140px]">
                  {/* Day header */}
                  <div className={`text-center mb-2 py-1.5 rounded-lg ${isToday ? "bg-primary/15" : "bg-transparent"}`}>
                    <p className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day, "EEE", { locale: fr })}
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday ? "text-primary" : isPastDay ? "text-muted-foreground/50" : "text-foreground"}`}>
                      {format(day, "d")}
                    </p>
                    {dayFollowUps.length > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block ${
                        isToday ? "bg-primary/25 text-primary" : "bg-white/10 text-muted-foreground"
                      }`}>
                        {dayFollowUps.length}
                      </span>
                    )}
                  </div>

                  {/* Droppable area */}
                  <Droppable droppableId={`day-${dayIndex}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-xl p-1.5 transition-all duration-150 min-h-[100px] ${
                          snapshot.isDraggingOver
                            ? "bg-primary/10 border border-primary/30 shadow-inner shadow-primary/5"
                            : isPastDay
                            ? "bg-white/2 border border-dashed border-white/5"
                            : "bg-white/3 border border-dashed border-white/8 hover:border-white/12"
                        }`}
                      >
                        {dayFollowUps.map((f, index) => (
                          <FollowUpItem
                            key={f.id}
                            followUp={f}
                            index={index}
                            leadMap={leadMap}
                          />
                        ))}
                        {provided.placeholder}
                        {dayFollowUps.length === 0 && snapshot.isDraggingOver && (
                          <div className="h-8 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center">
                            <span className="text-[10px] text-primary/70">Déposer ici</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        {[
          { color: "bg-amber-500/50", label: "En attente" },
          { color: "bg-emerald-500/50", label: "Envoyé" },
          { color: "bg-white/20", label: "Annulé" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Zap className="w-3 h-3 text-primary/60" />
          Glisser pour reprogrammer
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl whitespace-nowrap z-50 ${
              toast.type === "error"
                ? "bg-red-500/90 text-white"
                : "bg-emerald-500/90 text-white"
            }`}
          >
            {toast.msg}
            <button onClick={() => setToast(null)}><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}