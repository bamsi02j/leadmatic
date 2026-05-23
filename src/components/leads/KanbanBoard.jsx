import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Clock, MoreHorizontal, Bell, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const COLUMNS = [
  { key: "nouveau",   label: "Nouveau",   color: "text-blue-400",    bg: "bg-blue-500/8",   border: "border-blue-500/20",  dot: "bg-blue-400",   headerBg: "bg-blue-500/10" },
  { key: "contacté",  label: "Contacté",  color: "text-amber-400",   bg: "bg-amber-500/8",  border: "border-amber-500/20", dot: "bg-amber-400",  headerBg: "bg-amber-500/10" },
  { key: "converti",  label: "Converti",  color: "text-emerald-400", bg: "bg-emerald-500/8",border: "border-emerald-500/20",dot: "bg-emerald-400",headerBg: "bg-emerald-500/10" },
  { key: "perdu",     label: "Perdu",     color: "text-red-400",     bg: "bg-red-500/8",    border: "border-red-500/20",   dot: "bg-red-400",    headerBg: "bg-red-500/10" },
];

const IMPORTANT_TRANSITIONS = {
  "nouveau→converti": "🎉 Lead converti directement !",
  "contacté→converti": "✅ Lead converti avec succès !",
  "converti→perdu": "⚠️ Lead converti marqué perdu",
  "nouveau→perdu": "⚠️ Lead perdu sans contact",
};

function KanbanCard({ lead, index, col, onEdit, onOpenConversation }) {
  const initials = lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const age = lead.created_date
    ? formatDistanceToNow(new Date(lead.created_date), { addSuffix: true, locale: fr })
    : "";

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            group rounded-xl border bg-card/80 p-3 mb-2 cursor-grab active:cursor-grabbing select-none
            transition-all duration-150
            ${snapshot.isDragging
              ? "shadow-2xl shadow-primary/20 scale-105 rotate-1 border-primary/40 bg-card z-50"
              : "border-white/8 hover:border-white/16 hover:bg-card"
            }
          `}
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${col.headerBg} ${col.color} flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{lead.name}</p>
                {lead.source && (
                  <span className="text-[10px] text-muted-foreground/60 capitalize">{lead.source}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenConversation?.(lead); }}
                className="p-1 rounded-lg hover:bg-primary/15 text-primary/70 hover:text-primary transition-all"
                title="Ouvrir la conversation"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground transition-all"
                title="Modifier"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
          </div>

          {lead.notes && (
            <p className="mt-2 text-[11px] text-muted-foreground/70 line-clamp-2 italic border-t border-white/5 pt-2">
              {lead.notes}
            </p>
          )}

          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
            <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50">{age}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function NotificationToast({ notif, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className="fixed top-6 right-6 z-[100] flex items-start gap-3 card-surface border border-primary/20 p-4 rounded-xl shadow-2xl shadow-black/40 max-w-sm"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground mb-0.5">Notification équipe</p>
        <p className="text-xs text-muted-foreground">{notif.message}</p>
        <p className="text-[11px] text-primary mt-1 font-medium">{notif.leadName}</p>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none mt-0.5">×</button>
    </motion.div>
  );
}

export default function KanbanBoard({ leads, onLeadUpdate, onEdit, onOpenConversation }) {
  const [notifications, setNotifications] = useState([]);

  const fireNotification = (leadName, fromStatus, toStatus) => {
    const key = `${fromStatus}→${toStatus}`;
    const message = IMPORTANT_TRANSITIONS[key];
    if (!message) return;
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, leadName }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    if (fromStatus === toStatus) return;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;
    onLeadUpdate(draggableId, toStatus);
    fireNotification(lead.name, fromStatus, toStatus);
  };

  const getLeadsForCol = (colKey) => leads.filter(l => l.status === colKey);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          {COLUMNS.map(col => {
            const colLeads = getLeadsForCol(col.key);
            return (
              <div key={col.key} className="flex flex-col">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 ${col.bg} border ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                    {colLeads.length}
                  </span>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        flex-1 min-h-[200px] rounded-xl p-2 transition-all duration-150
                        ${snapshot.isDraggingOver
                          ? `${col.bg} border-2 ${col.border} shadow-inner`
                          : "bg-white/2 border border-dashed border-white/8"
                        }
                      `}
                    >
                      <AnimatePresence>
                        {colLeads.map((lead, index) => (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <KanbanCard
                              lead={lead}
                              index={index}
                              col={col}
                              onEdit={onEdit}
                              onOpenConversation={onOpenConversation}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                      {colLeads.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center h-24 text-center">
                          <span className="text-2xl opacity-20">○</span>
                          <p className="text-[11px] text-muted-foreground/40 mt-1">Glisser ici</p>
                        </div>
                      )}
                      {snapshot.isDraggingOver && colLeads.length === 0 && (
                        <div className={`h-16 rounded-lg border-2 border-dashed ${col.border} flex items-center justify-center`}>
                          <span className={`text-[11px] ${col.color} opacity-70`}>Déposer ici</span>
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

      <AnimatePresence>
        {notifications.map(notif => (
          <NotificationToast
            key={notif.id}
            notif={notif}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
      </AnimatePresence>
    </>
  );
}