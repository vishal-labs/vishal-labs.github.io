import LoomCanvas from "./LoomCanvas";
import ModelsSection from "./ModelsSection";
import ReliabilitySection from "./ReliabilitySection";
import Ledger from "./Ledger";
import { ArrowUpRight } from "./Icons";
import HomeOrbit from "./HomeOrbit";
import { DOMAINS, HOME, LINKS, PATH, PHILOSOPHY, TIMELINE, type Bridge, type Domain } from "@/lib/content";

export function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top">vishal-labs</a>
      <nav aria-label="Sections">
        <a href="#reliability">Work</a>
        <a href="#path">Path</a>
        <a href="#close">Contact</a>
      </nav>
    </header>
  );
}

const TONE_CLASS = { sre: "t-sre", ai: "t-ai", web3: "t-web3", zari: "t-zari" } as const;

// the last line of every section: it hands the reader to the next thread
function BridgeLine({ bridge }: { bridge: Bridge }) {
  return (
    <p className="bridge">
      {bridge.before}
      <a className={TONE_CLASS[bridge.tone]} href={bridge.to}>{bridge.link}</a>
      {bridge.after}
    </p>
  );
}

// the one idea everything else hangs on; it sits right under the hero so nobody misses it
export function Philosophy() {
  return (
    <section className="philosophy zari" id="philosophy" aria-label="How I work">
      <blockquote className="philosophy-inner">
        <p className="philosophy-lead">{PHILOSOPHY.lead}</p>
        <p className="philosophy-rest">{PHILOSOPHY.rest}</p>
      </blockquote>
    </section>
  );
}

export function Home() {
  return (
    <section className="home" id="home" aria-labelledby="home-title">
      <div className="split">
        <div className="copy">
          <h2 id="home-title">Woven at home</h2>
          <p className="takeaway">{HOME.lede}</p>
          {HOME.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <BridgeLine bridge={HOME.bridge} />
        </div>
        <HomeOrbit />
      </div>
    </section>
  );
}

const SCENE_FOR: Record<Domain, "reliability" | "models" | "chains"> = {
  sre: "reliability",
  ai: "models",
  web3: "chains",
};

export function DomainSections({ only }: { only: string[] }) {
  return (
    <>
      {DOMAINS.filter((d) => only.includes(d.id)).map((d) =>
        d.id === "models" ? (
          <ModelsSection key={d.id} d={d} />
        ) : d.id === "reliability" ? (
          <ReliabilitySection key={d.id} d={d} />
        ) : (
          <section key={d.id} id={d.id} className={`domain d-${d.domain}`} aria-labelledby={`${d.id}-title`}>
            <div className="split">
              <div className="copy">
                <h2 id={`${d.id}-title`}>{d.title}</h2>
                <p className="takeaway">{d.lede}</p>
                {d.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <BridgeLine bridge={d.bridge} />
              </div>
              <figure className="stage">
                <div className="stage-box">
                  <LoomCanvas scene={SCENE_FOR[d.domain]} className="stage-canvas" />
                </div>
                <figcaption>{d.stageNote}</figcaption>
              </figure>
            </div>
            <Ledger items={d.ledger} />
          </section>
        ),
      )}
    </>
  );
}

export function Timeline() {
  return (
    <section className="path" id="path" aria-labelledby="path-title">
      <div className="path-head">
        <h2 id="path-title">The cloth so far</h2>
        <p className="takeaway">{PATH.lede}</p>
      </div>
      <ol className="ledger timeline">
        {TIMELINE.map((row) => (
          <li key={row.role} className={`ledger-row d-${row.domain}`}>
            <time>{row.when}</time>
            <div>
              <h3>{row.role}</h3>
              <p className="where">{row.where}</p>
            </div>
            <p>{row.detail}</p>
            <span className="weft" aria-hidden="true" />
          </li>
        ))}
      </ol>
      <div className="path-foot">
        <BridgeLine bridge={PATH.bridge} />
      </div>
    </section>
  );
}

export function Close() {
  return (
    <section className="close" id="close" aria-labelledby="close-title">
      <div className="close-inner">
        <h2 id="close-title">Pull a thread</h2>
        <p className="takeaway">
          That&rsquo;s the whole cloth: an SRE who keeps chains running, brings models into the work, and builds
          it all at home first.
        </p>
        <p>
          If any thread caught your eye, pull it. I&rsquo;m quickest to reply on LinkedIn, and I write now and
          then on Hashnode.
        </p>
        <div className="actions">
          <a className="btn" href={LINKS.linkedin} target="_blank" rel="noreferrer">
            Message me on LinkedIn <ArrowUpRight />
          </a>
          <a className="link" href={LINKS.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
          <a className="link" href={LINKS.hashnode} target="_blank" rel="noreferrer">Hashnode <ArrowUpRight /></a>
          <a className="link" href={LINKS.x} target="_blank" rel="noreferrer">X <ArrowUpRight /></a>
        </div>
      </div>
      <footer className="footer zari">
        <div className="selvedge">
          <span className="selvedge-mark" aria-hidden="true" />
          <span>Woven and self-hosted at home · © {new Date().getFullYear()} Vishal Dodda</span>
        </div>
      </footer>
    </section>
  );
}
