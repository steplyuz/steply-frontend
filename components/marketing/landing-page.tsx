"use client";

import { SiteHeader } from "@/components/layout/header";

import { Hero } from "./hero";
import { Footer } from "../layout/footer";
import { TiltResultCard } from "./tilt-result-card";
import { StatsStrip } from "./stats-strip";
import { FinalCta } from "./final-cta";
import { ProcessFlow } from "./process";
import { VerificationSection } from "./verification";
import { SkillsGrid } from "./skills";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader variant="public" />

      <main>
        <Hero>
          <TiltResultCard />
        </Hero>
        <StatsStrip />
        <SkillsGrid />
        <ProcessFlow />
        <VerificationSection />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}