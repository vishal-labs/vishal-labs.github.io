import { ArrowUpRight } from "./Icons";
import type { LedgerItem } from "@/lib/content";

// Projects as woven rows: title, what it does, what it's made of, and where to read the source.
export default function Ledger({ items }: { items: LedgerItem[] }) {
  return (
    <ol className="ledger">
      {items.map((item) => (
        <li key={item.title} className="ledger-row">
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <div className="ledger-meta">
            <ul className="tags" aria-label="Built with">
              {item.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {item.href && (
              <a className="link" href={item.href} target="_blank" rel="noreferrer">
                {item.href.includes("linkedin.com") ? "The post" : "Source"} <ArrowUpRight />
                <span className="sr-only"> for {item.title}</span>
              </a>
            )}
          </div>
          <span className="weft" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}
