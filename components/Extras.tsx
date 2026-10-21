"use client";

import { useEffect, useRef, useState } from "react";
import { Speaker } from "./Icons";
import { sound } from "@/lib/sound";
import { LINKS, SECTIONS } from "@/lib/content";

export function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const off = sound.subscribe(setOn);
    sound.init();
    return off;
  }, []);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      aria-label="Loom sound"
      title={on ? "Sound on (s)" : "Sound off (s)"}
      onClick={() => sound.toggle()}
    >
      <Speaker on={on} />
    </button>
  );
}

// for whoever opens the devtools: the people this site was really woven for
function consoleNote() {
  const zari = "color:#dcc27e;font:900 20px/1.2 sans-serif;letter-spacing:.04em";
  const mono = "color:#cbc4e4;font:12px/1.5 ui-monospace,monospace";
  const loom = [
    " ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║",
    " ╫─╫─╫─╫─╫─╫─╫─╫─╫─╫─╫─╫   ← every request, a pick of weft",
    " ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║",
    " ╫─╫─╫─╫─◆─╫─╫─╫─╫─╫─╫─╫   ← the homelab is the warp",
    " ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║",
  ].join("\n");
  console.log("%cVISHAL-LABS", zari);
  console.log(`%c${loom}`, mono);
  console.log(
    "%cYou opened the devtools, so you're who this was woven for.\n\n" +
      "Every stage is drawn by a small WebGL2 renderer of instanced, rotated rectangles, with a 2D-canvas fallback.\n" +
      "No word is ever painted onto a canvas: every label is a real DOM chip, placed by the same geometry the scene uses.\n\n" +
      "Press ? on the page for keyboard shortcuts.\n" +
      `Say hello: ${LINKS.linkedin}`,
    mono,
  );
}

export default function Extras() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    consoleNote();

    const navH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 56;
    const els = () => SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const go = (el: HTMLElement | undefined) => el?.scrollIntoView({ block: "start" });
    // the section the reader is in: the last one whose top has passed under the nav
    const current = () => {
      const list = els();
      let i = 0;
      list.forEach((el, k) => { if (el.getBoundingClientRect().top <= navH() + 24) i = k; });
      return { list, i };
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const d = dialog.current;
      if (e.key === "?") {
        e.preventDefault();
        if (d?.open) d.close();
        else d?.showModal();
        return;
      }
      if (d?.open) return; // the dialog handles its own Escape
      const { list, i } = current();
      if (e.key === "j") go(list[Math.min(list.length - 1, i + 1)]);
      else if (e.key === "k") {
        // inside a section, k first goes back to its top
        const top = list[i]?.getBoundingClientRect().top ?? 0;
        go(top < navH() - 8 ? list[i] : list[Math.max(0, i - 1)]);
      } else if (/^[0-9]$/.test(e.key)) go(list[(Number(e.key) + 9) % 10]);
      else if (e.key === "s") sound.toggle();
      else if (e.key === "r") window.location.href = "/resume/";
      else return;
      e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <dialog
      className="keys zari"
      ref={dialog}
      aria-labelledby="keys-title"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
    >
      <div className="keys-inner">
        <h2 id="keys-title">Keyboard</h2>
        <dl>
          <div><dt><kbd>j</kbd> <kbd>k</kbd></dt><dd>next and previous section</dd></div>
          <div><dt><kbd>1</kbd>–<kbd>0</kbd></dt><dd>jump to a section</dd></div>
          <div><dt><kbd>s</kbd></dt><dd>loom sound on or off</dd></div>
          <div><dt><kbd>r</kbd></dt><dd>printable résumé</dd></div>
          <div><dt><kbd>?</kbd></dt><dd>this panel</dd></div>
        </dl>
        <ol className="keys-sections">
          {SECTIONS.map((s, i) => (
            <li key={s.id}><kbd>{(i + 1) % 10}</kbd>{s.name}</li>
          ))}
        </ol>
        <form method="dialog">
          <button className="link" type="submit">Close <kbd>esc</kbd></button>
        </form>
      </div>
    </dialog>
  );
}
