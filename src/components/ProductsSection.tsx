import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Flame, DoorOpen, Droplets, Wind, Truck, Shield } from "lucide-react";

const products = [
  { key: "products.fire", descKey: "products.fire.desc", icon: Flame },
  { key: "products.roller", descKey: "products.roller.desc", icon: DoorOpen },
  { key: "products.oil", descKey: "products.oil.desc", icon: Droplets },
  { key: "products.hvac", descKey: "products.hvac.desc", icon: Wind },
  { key: "products.loading", descKey: "products.loading.desc", icon: Truck },
  { key: "products.louvers", descKey: "products.louvers.desc", icon: Shield },
];

export default function ProductsSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="products" className="py-24 px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("products.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("products.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("products.desc")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => {
            const Icon = product.icon;
            return (
              <div
                key={product.key}
                className="scroll-reveal group p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{t(product.key)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(product.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
