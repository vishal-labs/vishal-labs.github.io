"use client";

import { useState } from "react";
import SonarStage from "./SonarStage";
import Ledger from "./Ledger";
import { MODEL_QUADRANTS, type DOMAINS } from "@/lib/content";

// The models section: the copy column follows whichever quadrant of the matrix is active.
export default function ModelsSection({ d }: { d: (typeof DOMAINS)[number] }) {
  const [active, setActive] = useState(-1);
  const q = active >= 0 ? MODEL_QUADRANTS[active] : null;
  const lede = q ? q.lede : d.lede;
  const body = q ? q.body : d.body;

  return (
    <section id={d.id} className={`domain d-${d.domain}`} aria-labelledby={`${d.id}-title`}>
      <div className="split">
        <div className="copy">
          <h2 id={`${d.id}-title`}>{d.title}</h2>
          <div className="copy-swap" key={active}>
            <p className="takeaway">{lede}</p>
            {body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="bridge">
            {d.bridge.before}
            <a className={d.bridge.tone === "zari" ? "t-zari" : `t-${d.bridge.tone}`} href={d.bridge.to}>{d.bridge.link}</a>
            {d.bridge.after}
          </p>
        </div>
        <SonarStage note={d.stageNote} onActive={setActive} />
      </div>
      <Ledger items={d.ledger} />
    </section>
  );
}
