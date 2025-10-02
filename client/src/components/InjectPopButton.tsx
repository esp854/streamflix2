import React, { useState } from "react";

interface InjectPopButtonProps {
  src: string;
  label?: string;
  className?: string;
}

export function InjectPopButton({ 
  src, 
  label = "Voir l'offre (ouvrir)",
  className = "px-4 py-2 bg-blue-600 text-white rounded"
}: InjectPopButtonProps) {
  const [done, setDone] = useState(false);

  const inject = () => {
    if (done) return;
    const d = document;
    const s = d.createElement("script");
    s.async = true;
    s.referrerPolicy = "no-referrer";
    s.src = src.startsWith("//") ? `https:${src}` : src;
    s.onload = () => console.log("[Popunder] script chargé via bouton");
    s.onerror = (err) => console.warn("[Popunder] erreur chargement script via bouton", err);
    d.head.appendChild(s);
    setDone(true);
  };

  return (
    <button 
      onClick={inject} 
      className={className}
      disabled={done}
    >
      {done ? "Offre ouverte !" : label}
    </button>
  );
}