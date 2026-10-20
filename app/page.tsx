import Hero from "@/components/Hero";
import Converge from "@/components/Converge";
import Agents from "@/components/Agents";
import ProgressThread from "@/components/ProgressThread";
import { Close, DomainSections, Home, Nav, Philosophy, Timeline } from "@/components/Sections";

export default function Page() {
  return (
    <>
      <a className="skip" href="#home">Skip to content</a>
      <Nav />
      <ProgressThread />
      <main>
        <Hero />
        <Philosophy />
        <Home />
        <DomainSections only={["reliability", "chains"]} />
        <Agents />
        <DomainSections only={["models"]} />
        <Timeline />
        <Converge />
        <Close />
      </main>
    </>
  );
}
