"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

const QUICK_REPLIES = ["Quiero una consulta", "Tengo dudas", "¿Cuánto sale?"];

export function ChatWidget({ name }: { name: string }) {
  const [message, setMessage] = useState("");

  return (
    <div id="chat-widget" className="max-w-2xl mx-auto px-4 mt-6 mb-28">
      <div className="bg-brand-bg border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-violet text-white text-sm">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-brand-dark text-sm font-medium">{name}</p>
            <p className="text-brand-gray text-xs">En línea · responde en ~10 min</p>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="bg-white border border-gray-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%]">
            <p className="text-xs text-brand-violet font-medium mb-0.5">{name}</p>
            <p className="text-sm text-brand-dark">
              ¿Tenés dudas sobre qué tratamiento es ideal para vos? ¡Escribime y te asesoro sin cargo! 😊
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => setMessage(reply)}
                className="text-xs bg-white border border-gray-200 text-brand-dark px-3 py-1.5 rounded-full hover:bg-brand-bg transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-200">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí tu consulta..."
            className="flex-1 bg-brand-bg text-brand-dark placeholder:text-brand-gray text-sm rounded-full px-4 py-2 outline-none focus:bg-gray-100"
          />
          <button
            type="button"
            aria-label="Enviar mensaje"
            className="h-9 w-9 rounded-full bg-brand-green flex items-center justify-center shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
