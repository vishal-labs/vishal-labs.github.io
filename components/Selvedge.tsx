"use client";

import { useEffect, useState } from "react";
import { SELVEDGE } from "@/lib/content";

// The cloth's finished edge: one fact at a time, updated in place.
export default function Selvedge() {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    if (r) return;
    const id = setInterval(() => setI((v) => (v + 1) % SELVEDGE.length), 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="selvedge">
      <span className="selvedge-mark" aria-hidden="true" />
      {reduced ? (
        <span>{SELVEDGE.join(" · ")}</span>
      ) : (
        <span key={i} className="selvedge-fact">{SELVEDGE[i]}</span>
      )}
    </div>
  );
}
