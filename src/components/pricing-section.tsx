'use client';

import { PricingCard } from "@/components/pricing/pricing-card";
import { Zap, Download, ImageIcon } from "lucide-react";

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-32 relative">
      <div className="absolute inset-0 bg-muted/5 skew-y-3 transform origin-bottom-right pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-bold mb-6">Simple Pricing</h2>
          <p className="text-muted-foreground">Pay per shoot. No monthly commitments.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { credits: "50", price: "$5", costPerPhoto: "$0.10", label: "Starter" },
            { credits: "300", price: "$15", costPerPhoto: "$0.05", featured: true, label: "Professional" },
            { credits: "900", price: "$30", costPerPhoto: "$0.03", label: "Agency" },
          ].map((plan) => (
            <PricingCard
              key={plan.credits}
              title={plan.label}
              price={plan.price}
              description={`${plan.credits} Credits • ${plan.costPerPhoto}/photo`}
              onClick={() => {}}
              variant={plan.featured ? "featured" : "default"}
              buttonText="Get Credits"
              features={[
                { icon: <Zap className="w-4 h-4" />, text: "Commercial License" },
                { icon: <Download className="w-4 h-4" />, text: "Full Resolution" },
                { icon: <ImageIcon className="w-4 h-4" />, text: "30-day Storage" },
              ]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}