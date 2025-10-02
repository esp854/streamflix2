import { useEffect, useRef } from "react";

/**
 * usePopunder
 * - injecte le script popunder après la première interaction utilisateur (click / touch / key)
 * - évite injections multiples via injectedRef
 * - option pour n'injecter qu'une fois par session via sessionStorage
 *
 * Usage:
 *   const enablePopunder = usePopunder({ src: "https://selfishzone.com/..." });
 */
type Options = {
  src: string;
  oncePerSession?: boolean; // default true
  referrerPolicy?: string; // default 'no-referrer'
  sessionKey?: string; // default 'popunder_injected'
};

export default function usePopunder({
  src,
  oncePerSession = true,
  referrerPolicy = "no-referrer",
  sessionKey = "popunder_injected",
}: Options) {
  const injectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!src) return;

    // Si on veut injecter une seule fois par session
    if (oncePerSession && typeof window !== "undefined") {
      try {
        const already = sessionStorage.getItem(sessionKey);
        if (already === "1") {
          injectedRef.current = true;
          return;
        }
      } catch (e) {
        // sessionStorage inaccessbile (privé) -> on continue
      }
    }

    // injection réelle
    const injectScript = () => {
      if (injectedRef.current) return;
      injectedRef.current = true;

      const d = document;
      const s = d.createElement("script");
      s.async = true;
      s.referrerPolicy = referrerPolicy;
      // Utiliser https explicite (meilleur pour les pages HTTPS)
      s.src = src.startsWith("//") ? `https:${src}` : src;
      s.onload = () => console.log("[Popunder] script chargé");
      s.onerror = (err) => console.warn("[Popunder] erreur chargement script", err);
      const firstScript = d.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(s, firstScript);
      } else {
        d.head.appendChild(s);
      }

      if (oncePerSession) {
        try {
          sessionStorage.setItem(sessionKey, "1");
        } catch (e) {
          // ignore
        }
      }

      // cleanup: retirer les listeners
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("touchstart", onFirstInteraction);
      document.removeEventListener("keydown", onFirstInteraction);
    };

    // gestion des événements: n'injecte qu'après la 1ère interaction
    const onFirstInteraction = (e: Event) => {
      // pour keydown, n'accepter que Enter / Space pour éviter injections accidentelles
      if (e.type === "keydown") {
        const ev = e as KeyboardEvent;
        if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
      }
      injectScript();
    };

    document.addEventListener("click", onFirstInteraction, { passive: true });
    document.addEventListener("touchstart", onFirstInteraction, { passive: true });
    document.addEventListener("keydown", onFirstInteraction, { passive: true });

    // fallback : si la page est déjà interactive (rare), injecte après un petit délai
    const fallbackTimer = setTimeout(() => {
      if (!injectedRef.current) {
        // pas d'interaction -> on laisse tranquille (préférence pour interaction)
        // Si tu veux obliger injection après N secondes, décommente injectScript()
        // injectScript();
      }
    }, 15000);

    return () => {
      clearTimeout(fallbackTimer);
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("touchstart", onFirstInteraction);
      document.removeEventListener("keydown", onFirstInteraction);
    };
  }, [src, oncePerSession, referrerPolicy, sessionKey]);
}