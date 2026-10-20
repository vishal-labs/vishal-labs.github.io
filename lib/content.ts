// All site copy lives here. Facts come from PRODUCT.md; nothing here may be invented.

// TODO(vishal): replace the remaining placeholder handles (hashnode, x) with your real profiles.
export const LINKS = {
  linkedin: "https://www.linkedin.com/in/vishaldodda",
  github: "https://github.com/vishal-labs",
  hashnode: "https://your-blog.hashnode.dev",
  x: "https://x.com/your-handle",
} as const;

export type Domain = "sre" | "ai" | "web3";

// Warp threads in the hero, tagged at the harness. Host names are fine to show;
// addresses, domains and port maps never are.
export const SERVICES: { name: string; role: string; host: string }[] = [
  { name: "krishna-cp", role: "kubernetes control plane", host: "optiplex" },
  { name: "arjuna-1", role: "kubernetes worker", host: "optiplex" },
  { name: "arjuna-2", role: "kubernetes worker", host: "h610m" },
  { name: "monitoring", role: "ingests every metric and log", host: "optiplex" },
  { name: "grafana", role: "dashboards, in-cluster", host: "kubernetes" },
  { name: "prometheus", role: "metrics via remote_write", host: "monitoring" },
  { name: "loki", role: "logs, pushed by alloy", host: "monitoring" },
  { name: "alloy", role: "agent on every vm", host: "everywhere" },
  { name: "hermes", role: "general-purpose vm", host: "optiplex" },
  { name: "immich", role: "photo backup with ml tagging", host: "h610m" },
  { name: "calorie-vision", role: "my ai calorie tracker", host: "h610m" },
  { name: "splitwise", role: "my self-hosted splitwise", host: "h610m" },
  { name: "vaultwarden", role: "passwords", host: "h610m" },
  { name: "seafile", role: "file sync", host: "h610m" },
  { name: "jellyfin", role: "media server", host: "h610m" },
  { name: "navidrome", role: "music streaming", host: "h610m" },
  { name: "audiobookshelf", role: "audiobooks", host: "h610m" },
  { name: "silverbullet", role: "notes, with an mcp server", host: "h610m" },
  { name: "karakeep", role: "bookmarks", host: "h610m" },
  { name: "tt-rss", role: "rss reader", host: "h610m" },
  { name: "postgres", role: "databases underneath", host: "h610m" },
  { name: "valkey", role: "cache", host: "h610m" },
  { name: "proxy manager", role: "routes every subdomain", host: "h610m" },
  { name: "tailscale", role: "the mesh between hosts", host: "everywhere" },
];

export const MOBILE_SERVICES = [
  "krishna-cp", "arjuna-1", "arjuna-2", "monitoring", "grafana",
  "immich", "calorie-vision", "splitwise", "vaultwarden", "tailscale",
];

// Facts printed into the selvedge, one at a time. Facts, not fake live status.
export const SELVEDGE = [
  "krishna-cp drives three nodes",
  "monitoring ingests every metric and log",
  "two proxmox hosts, one tailnet",
  "zero ports open at home",
  "around 25 self-hosted services",
];

export const PHILOSOPHY = {
  lead: "I never treat a technology on its own.",
  rest: "The wonders happen where two of them meet, so that's where I build.",
};

// A sentence that hands the reader to the next section, with its link inline.
export type Bridge = { before: string; link: string; to: string; tone: Domain | "zari"; after?: string };

export const HOME = {
  lede: "My data lives on machines I own.",
  body: [
    "My photos, passwords, files, notes and media run on two Proxmox machines at home: around 25 self-hosted services, including the tools I write for myself and my own AI assistant. A four-node Kubernetes cluster and a Tailscale mesh tie them together.",
    "Privacy is the point. Nothing reaches them except through a Cloudflare Tunnel, so not one port is open at home, and the most personal parts, like my assistant's memory, never leave the network. It's also where I break things before anyone pays me to fix them.",
  ],
  bridge: { before: "Running it every day taught me my trade: ", link: "keeping things up", to: "#reliability", tone: "sre", after: "." } as Bridge,
  stageNote: "Every cube is a VM I run, circling me, its only client. Each time one comes round, it shows another service it hosts.",
  // each orbiting VM and the services it cycles through as it passes behind me
  orbit: [
    { vm: "selfhosted-trixie", services: ["immich", "vaultwarden", "seafile", "jellyfin"] },
    { vm: "hermes", services: ["hermes agent", "honcho"] },
    { vm: "selfhosted-trixie", services: ["silverbullet", "karakeep", "tt-rss", "navidrome"] },
    { vm: "monitoring", services: ["prometheus", "loki"] },
    { vm: "built by me", services: ["calorie-vision", "splitwise"] },
    { vm: "krishna-cp", services: ["kubernetes", "grafana"] },
  ],
};

export type LedgerItem = {
  title: string;
  summary: string;
  tags: string[];
  href?: string;
};

export const DOMAINS: {
  id: string;
  domain: Domain;
  title: string;
  lede: string;
  body: string[];
  bridge: Bridge;
  stageNote: string;
  ledger: LedgerItem[];
}[] = [
  {
    id: "reliability",
    domain: "sre",
    title: "Reliability",
    lede: "Keeping systems up is my craft.",
    body: [
      "Metrics, logs and the patient work of knowing why something broke. I practise on a four-node Kubernetes cluster I built by hand with kubeadm, where every node pushes its metrics and logs to one monitoring node.",
      "When the dashboards aren't enough, I go down to the packets themselves, in the kernel.",
    ],
    bridge: { before: "Today I practise that craft on ", link: "blockchains", to: "#chains", tone: "web3", after: "." },
    stageNote: "My XDP filter as a live sketch: synthetic traffic, real design. The sketch sends far more packets up than the real 1 in 403, so you can see them go. Pick a stage of the path to read about it.",
    ledger: [
      {
        title: "XDP attack filter",
        summary: "An eBPF program at the network interface that screens HTTP for XSS, SQL injection and traversal, backed by an ML ensemble. It sends 403× fewer packets up to userspace.",
        tags: ["ebpf", "xdp", "c", "ml", "prometheus", "otel"],
        href: "https://github.com/vishal-labs/http-attack-filtering",
      },
      {
        title: "Kubernetes, by hand",
        summary: "A four-node kubeadm cluster with Flannel, spread across two Proxmox hosts over Tailscale: krishna-cp drives arjuna-1, arjuna-2 and a monitoring node. Grafana runs inside it.",
        tags: ["kubernetes", "kubeadm", "flannel", "proxmox", "tailscale"],
      },
      {
        title: "Simple Search",
        summary: "A 3-tier search app on the Perplexity API, with frontend, backend and database each containerised and deployed on Kubernetes, logging every search.",
        tags: ["kubernetes", "docker", "python", "react", "mysql"],
        href: "https://github.com/vishal-labs/perplexity-search",
      },
      {
        title: "Homelab observability",
        summary: "Alloy agents push to Prometheus and Loki on a dedicated monitoring node; Grafana runs inside the cluster. Push-based, so there is no up{} series to lean on: health checks query what each agent actually sends.",
        tags: ["alloy", "prometheus", "loki", "grafana", "kubernetes"],
      },
    ],
  },
  {
    id: "chains",
    domain: "web3",
    title: "Chains",
    lede: "By day, that craft runs blockchains.",
    body: [
      "I'm an SRE at a stealth, fast-paced web3 validator startup, working on Solana and EVM chains and the RPC infrastructure behind them.",
      "A Jacquard loom reads its punch cards strictly in order, each laced to the next; a chain works the same way.",
    ],
    bridge: { before: "What I add to that work is AI, starting with ", link: "the agents I live with", to: "#agents", tone: "ai", after: "." },
    stageNote: "Each card's holes are hashed from the card before it.",
    ledger: [
      {
        title: "RPC and chain operations",
        summary: "Day-to-day SRE work for Solana and EVM chains, including the RPC infrastructure applications talk to.",
        tags: ["solana", "evm", "rpc", "sre"],
      },
      {
        title: "Westend validator",
        summary: "A Substrate validator on the Westend testnet, with proxy-account staking, session-key rotation, and chill and unchill drills, run as a dedicated service user.",
        tags: ["substrate", "polkadot", "staking", "linux"],
        href: "https://github.com/vishal-labs/luganodes-SRE-task-vishal-23BAI0025",
      },
      {
        title: "ML credit-scored lending",
        summary: "A DeFi lending and insurance dApp where an off-chain ML credit score is attested on-chain with EIP-712 signatures and sets the borrower's risk tier.",
        tags: ["solidity", "eip-712", "hardhat", "python"],
      },
    ],
  },
  {
    id: "models",
    domain: "ai",
    title: "Models",
    lede: "And I build models that do a real job.",
    body: [
      "The one I'm proudest of lets you ask a Postgres database a question in plain English. An agent plans and validates the SQL over MCP, but it never executes a write and never sees the rows: results flow straight from the database to your screen.",
      "My favourite to watch is logSonar. Dashboards never gave me a feel for a node, so I turned logs into pixels: each log line is weighed down to three values from 0 to 255, one RGB pixel, and a batch of them becomes an image per service. KMeans names the mood, FFT finds the slowdown that keeps coming back, and anything 20% off the mean is flagged.",
      "I'm studying Computer Science with a specialisation in AI and ML, and I like models with a job like that: classifying a signal, filtering a message, answering a question about a database.",
      "As a research assistant in 2025 I balanced cloud, fog and edge, using multi-objective optimisation to move traffic off the cloud without costing the edge its latency.",
    ],
    bridge: { before: "Here's how those threads were laid, ", link: "one row at a time", to: "#path", tone: "zari", after: "." },
    stageNote: "Raw metrics pour in from three services and land as pixels, the way logSonar draws them. Synthetic logs, real method. Pick a quadrant to see another model.",
    ledger: [
      {
        title: "Agentic Postgres over MCP",
        summary: "Ask a database a question in plain English. The agent plans and validates SQL through MCP, but never executes a write and never sees the result rows; data flows straight from Postgres to the browser.",
        tags: ["mcp", "postgres", "agents", "node"],
        href: "https://github.com/vishal-labs/database-ops",
      },
      {
        title: "logSonar",
        summary: "Logs translated into pixels: each log line becomes an RGB value, so a service's health reads as an image. KMeans names the mood, FFT finds the repeating slowdown.",
        tags: ["python", "otel", "kmeans", "fft"],
        href: "https://github.com/vishal-labs/logSonar",
      },
      {
        title: "Radar signal classifier",
        summary: "An ML classifier separating radar signal from noise, built during a defence research internship and deployed into the tool its engineers already used.",
        tags: ["ensembles", "deep learning", "deployment"],
      },
      {
        title: "Hinglish spam detection",
        summary: "SMS spam filtering for code-mixed Hindi-English text, with its own transliteration and stopword pipeline. The SVM reaches 98.8% accuracy and 0.965 F1 on 606 held-out messages.",
        tags: ["nlp", "tf-idf", "svm", "scikit-learn"],
        href: "https://github.com/vishal-labs/SpamDetection",
      },
      {
        title: "calorie-vision",
        summary: "Snap a meal and a vision model estimates calories and macros per item; scan a barcode for a Nutri-Score. It runs on my homelab.",
        tags: ["vision llm", "fastapi", "postgres", "docker"],
        href: "https://github.com/vishal-labs/calorie-vision",
      },
    ],
  },
];

// The agents section: my own assistant stack, drawn as its privacy boundary.
export type AgentNode = { id: string; name: string; where: string; what: string; inside: boolean; lede: string; body: string[] };

export const AGENTS = {
  title: "Agents",
  lede: "Day to day, I live with the newest of AI, inside a privacy boundary I drew myself.",
  body: [
    "My assistant runs on Hermes, an open-source agent that writes and refines its own skills, runs cron jobs and spawns subagents for parallel work. Its long-term memory is Honcho, which builds a working model of me. Both run on one VM in my homelab, so the reasoning never leaves my network.",
    "My second brain lives in SilverBullet, which Hermes reads and writes over MCP; Obsidian stays isolated, mine alone. Local models come from Ollama, and when a job needs a bigger one, it goes out through OpenCode Go's zero-data-retention endpoint. Alongside it, Paperclip runs a small company of agents with an org chart, goals and budgets.",
  ],
  bridge: { before: "Beyond the agents I use, I build ", link: "models of my own", to: "#models", tone: "ai", after: "." } as Bridge,
  stageNote: "My assistant stack as I drew it. Pick a node to see what it does and where it runs.",
  nodes: [
    { id: "me", name: "me", where: "the centre", what: "The only one who talks to everything inside the boundary.", inside: true, lede: "Everything inside the boundary answers to me.", body: ["I'm the only one who talks to every part of the stack. I chat with Hermes, keep my own vault in Obsidian, and set the goals Paperclip's agents work toward."] },
    { id: "hermes", name: "hermes", where: "hermes VM", what: "Hermes Agent, by Nous Research: my assistant. It writes and refines its own skills, runs cron jobs and spawns subagents for parallel work.", inside: true, lede: "An assistant that teaches itself.", body: ["Hermes Agent, by Nous Research, turns a workflow it repeats into a reusable skill and refines it the next time. It runs cron jobs on its own and spawns subagents when the work can run in parallel.", "Mine uses personal skills and scheduled jobs to explain topics the way I learn them. It runs on the hermes VM in my homelab."] },
    { id: "honcho", name: "honcho", where: "hermes VM", what: "Honcho, by Plastic Labs: long-term memory that builds and reasons over a model of me. Self-hosted, so that reasoning never leaves the network.", inside: true, lede: "Memory that reasons about me, at home.", body: ["Honcho, by Plastic Labs, is Hermes's long-term memory: it builds and reasons over a profile of me from our conversations.", "I self-host it on the same VM, with local models from Ollama, so the reasoning about me never leaves my network."] },
    { id: "silverbullet", name: "silverbullet", where: "self-hosted VM", what: "SilverBullet: my second brain. Hermes reads and writes my notes through an MCP server.", inside: true, lede: "A second brain my agent can read.", body: ["My notes live in SilverBullet on my self-hosted VM. A separate SilverBullet instance sits behind an MCP server, so Hermes can read and write notes through MCP without touching the rest."] },
    { id: "obsidian", name: "obsidian", where: "isolated", what: "Obsidian: isolated on purpose. No agent reads it; only I do.", inside: true, lede: "Some notes are for me alone.", body: ["Obsidian sits inside the boundary but outside every agent's reach. Nothing reads it except me."] },
    { id: "paperclip", name: "paperclip", where: "self-hosted", what: "Paperclip: an open-source control plane for a team of agents. The squares around it are its agents, wired as an org chart: goals go down, heartbeats come back.", inside: true, lede: "A small company of agents.", body: ["Paperclip is an open-source control plane for teams of AI agents. I self-host it, and it arranges agents into an org chart with goals, per-agent budgets and heartbeat schedules, logging every action.", "Agents pause when they hit their budget, so the company can't run away with my tokens."] },
    { id: "ollama", name: "ollama", where: "inside, local models", what: "Ollama: serves the local models that Honcho reasons with.", inside: true, lede: "Local models, on my own hardware.", body: ["Ollama serves the local models, Gemma 4 among them, that Honcho reasons with, so the most personal part of the stack runs entirely at home."] },
    { id: "opencode", name: "opencode go", where: "ZDR endpoint", what: "OpenCode Go: bigger open models for when local isn't enough, reached through a zero-data-retention endpoint.", inside: false, lede: "Bigger models, nothing kept.", body: ["When a job needs more than a local model, Hermes goes out through OpenCode Go: a subscription to open models whose providers follow a zero-data-retention policy and don't train on my data."] },
  ] as AgentNode[],
  ledger: [
    {
      title: "Private AI assistant",
      summary: "Weeks of building an assistant around privacy: a self-hosted Hermes agent with Honcho memory, a local LLM, personal skills and cron jobs that explain things the way I learn them.",
      tags: ["hermes", "honcho", "ollama", "gemma", "mcp", "cron"],
      href: "https://www.linkedin.com/posts/vishaldodda_ai-privacy-selfhosting-share-7486764313664434177-ltuo/",
    },
    {
      title: "Paperclip agent company",
      summary: "Paperclip, self-hosted: agents arranged in an org chart, each with goals and a budget, and every action in an audit log.",
      tags: ["paperclip", "agents", "self-hosted"],
    },
    {
      title: "Daily DevOps agent",
      summary: "My first agent: every morning it gathers news from RSS feeds, picks ten DevOps questions and a quote, and emails me a digest, scheduled by cron.",
      tags: ["python", "rss", "docker", "github actions"],
      href: "https://github.com/vishal-labs/daily_agent",
    },
  ] as LedgerItem[],
};

export const PATH = {
  lede: "Each row is a stretch of work, newest on top.",
  bridge: { before: "Now watch ", link: "all three threads cross", to: "#converge", tone: "zari", after: "." } as Bridge,
};

// The packet path on the reliability stage: each zone swaps the section's copy.
export const RELIABILITY_ZONES: { id: string; title: string; lede: string; body: string[] }[] = [
  {
    id: "xdp", title: "XDP · eBPF",
    lede: "Drop the attack before it reaches the app.",
    body: [
      "An XDP program runs at the network interface, before the kernel's own network stack, and screens HTTP traffic against patterns for XSS, SQL injection, directory traversal and SSI.",
      "Malicious packets are dropped in place, with zero copies up to userspace, so the server never spends a cycle on them.",
    ],
  },
  {
    id: "ml", title: "ML ensemble",
    lede: "Only a sliver goes up to the slow path.",
    body: [
      "Screening in the kernel first sends 403× fewer packets up to userspace processing. What does go up meets an ensemble of a decision tree and a neural network that names the attack type with a confidence score.",
      "The models also have fixed-point versions, so the same logic fits inside eBPF's limits.",
    ],
  },
  {
    id: "tls", title: "app · TLS",
    lede: "Even encrypted traffic gets screened.",
    body: [
      "For HTTPS, eBPF uprobes hook OpenSSL and GnuTLS to read requests after decryption, and kTLS support keeps hardware offload in play.",
    ],
  },
  {
    id: "metrics", title: "prometheus",
    lede: "Every drop is a metric.",
    body: [
      "The filter exports Prometheus metrics and OpenTelemetry traces. Grafana shows attack patterns, latency and throughput as they happen, and an alert fires when an attack is detected.",
    ],
  },
];

export const MODEL_QUADRANTS: {
  id: string; title: string; line: string; href?: string; pattern: "wave" | "tokens" | "table" | "plate";
  lede: string; body: string[];
}[] = [
  {
    id: "mcp", title: "Agentic Postgres over MCP", line: "The agent plans the query; the rows never pass through it.", href: "https://github.com/vishal-labs/database-ops", pattern: "table",
    lede: "The agent never touches the data.",
    body: [
      "You ask Postgres a question in plain English. The agent reads the schema through an MCP server, then plans and validates the SQL, but it can't execute a write: every write waits for your confirmation, behind a SQL classifier and read-only transactions.",
      "Results never pass through the model. The server runs the validated query itself and streams the rows straight to the browser, which keeps tokens low and the data private. It runs on a Mac with Apple's container runtime and comes back after a reboot with two scripts.",
    ],
  },
  {
    id: "radar", title: "Radar signal classifier", line: "Signal pulled out of noise, for a defence research lab's own tool.", pattern: "wave",
    lede: "Signal or noise, decided automatically.",
    body: [
      "During a defence research internship I built an ML classifier that separates radar signal from noise, where there had been no automated classification before.",
      "It went into the tool the engineers already used, and the findings were published.",
    ],
  },
  {
    id: "hinglish", title: "Hinglish spam detection", line: "Code-mixed SMS, spam tokens lit. SVM at 98.8% accuracy.", href: "https://github.com/vishal-labs/SpamDetection", pattern: "tokens",
    lede: "A spam filter that understands Hinglish.",
    body: [
      "Most SMS spam filters are trained on English, so code-mixed Hindi-English messages slip past them. I built a preprocessing pipeline for Hinglish, with transliteration, Hindi stopwords and light stemming, and augmented the UCI dataset with synthetic code-mixed messages.",
      "On 606 held-out messages the SVM reaches 98.8% accuracy and 0.965 F1.",
    ],
  },
  {
    id: "calorie", title: "calorie-vision", line: "A photo of a meal becomes calories and macros, per item.", href: "https://github.com/vishal-labs/calorie-vision", pattern: "plate",
    lede: "A meal photo in, calories out.",
    body: [
      "Snap a meal and a vision model estimates calories and macros for each item. Scan a barcode and you get the nutrition with a Nutri-Score, computed with the 2023 algorithm when no official grade exists.",
      "It's phone-first and self-hosted on my homelab, with FastAPI and Postgres underneath.",
    ],
  },
];

export const TIMELINE: { when: string; role: string; where: string; detail: string; domain: Domain }[] = [
  {
    when: "Now",
    role: "Site reliability engineer",
    where: "A stealth, fast-paced web3 validator startup",
    detail: "Solana and EVM chains, RPC infrastructure.",
    domain: "web3",
  },
  {
    when: "2025",
    role: "Research assistant, AI",
    where: "VIT Vellore",
    detail: "July to December. Multi-objective optimisation that spreads outgoing traffic across fog nodes, easing cloud load while keeping edge latency low.",
    domain: "ai",
  },
  {
    when: "2025",
    role: "Intern",
    where: "DRDO",
    detail: "Machine learning for radar signal classification.",
    domain: "ai",
  },
  {
    when: "2024 – now",
    role: "Core committee and student coordinator",
    where: "IEEE-CS · graVITas & Riviera",
    detail: "Hackathons and cryptic hunts, and a fest team of 60 serving 1,000+ attendees.",
    domain: "sre",
  },
  {
    when: "2023 – now",
    role: "B.Tech, Computer Science (AI & ML)",
    where: "VIT Vellore",
    detail: "Where the threads started.",
    domain: "sre",
  },
];
