import type { Metadata } from "next";
import PrintButton from "@/components/PrintButton";
import { AGENTS, DOMAINS, LINKS, TIMELINE, type Domain, type LedgerItem } from "@/lib/content";

export const metadata: Metadata = {
  title: "Vishal Dodda · Résumé",
  description: "Printable résumé of Vishal Dodda: SRE for blockchain infrastructure, building where reliability, AI and web3 cross.",
  alternates: { canonical: "/resume/" },
  openGraph: { title: "Vishal Dodda · Résumé", url: "/resume/", images: [{ url: "/og-resume.png", width: 1200, height: 630, alt: "Vishal Dodda's résumé, set like a loom card" }] },
};

// The same facts as the site, set as a loom card: ink on bone, ready for paper.
// Nothing here is new; every line comes from lib/content.ts.
const bare = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
// a post link reads as what it is; repos and profiles read as their address
const label = (u: string) => (u.includes("linkedin.com/posts/") ? "the post on LinkedIn" : bare(u));
const work = TIMELINE.filter((t) => !t.role.startsWith("B.Tech"));
const study = TIMELINE.filter((t) => t.role.startsWith("B.Tech"));
const groups: { name: string; domain: Domain; items: LedgerItem[] }[] = [
  ...DOMAINS.map((d) => ({ name: d.title, domain: d.domain, items: d.ledger })),
  { name: AGENTS.title, domain: "ai", items: AGENTS.ledger },
];
// the toolbox is only what the projects themselves are tagged with
const tools = [...new Set(groups.flatMap((g) => g.items.flatMap((i) => i.tags)))];

export default function Resume() {
  return (
    <main className="resume">
      <div className="resume-bar">
        <a className="link" href="/">← Back to the cloth</a>
        <PrintButton />
      </div>
      <article className="sheet">
        <header className="sheet-head">
          <h1>Vishal Dodda</h1>
          <p className="sheet-role">SRE for blockchain infrastructure</p>
          <p className="sheet-line">Building where reliability, AI and web3 cross, all of it tried first on a homelab I run.</p>
          <ul className="sheet-contact">
            <li><a href={LINKS.linkedin}>{bare(LINKS.linkedin)}</a></li>
            <li><a href={LINKS.hashnode}>{bare(LINKS.hashnode)}</a></li>
            <li><a href="https://www.vishaldodda.me/">vishaldodda.me</a></li>
          </ul>
        </header>

        <section aria-labelledby="r-work">
          <h2 id="r-work">Experience</h2>
          {work.map((t) => (
            <div className={`sheet-row d-${t.domain}`} key={t.role}>
              <time>{t.when}</time>
              <div>
                <h3>{t.role}</h3>
                <p className="where">{t.where}</p>
                <p>{t.detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="r-projects">
          <h2 id="r-projects">Projects</h2>
          {groups.map((g) => (
            <div className={`sheet-group d-${g.domain}`} key={g.name}>
              <h3 className="group-name">{g.name}</h3>
              {g.items.map((i) => (
                <div className="sheet-item" key={i.title}>
                  <h4>
                    {i.title}
                    {i.href && <a href={i.href}>{label(i.href)}</a>}
                  </h4>
                  <p>{i.summary}</p>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section aria-labelledby="r-tools">
          <h2 id="r-tools">Toolbox</h2>
          <p className="sheet-tools">{tools.join(" · ")}</p>
        </section>

        <section aria-labelledby="r-study">
          <h2 id="r-study">Education</h2>
          {study.map((t) => (
            <div className="sheet-row" key={t.role}>
              <time>{t.when}</time>
              <div>
                <h3>{t.role}</h3>
                <p className="where">{t.where}</p>
              </div>
            </div>
          ))}
        </section>
      </article>
    </main>
  );
}
