import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Flame, DoorOpen, Droplets, Wind, Truck, Shield } from "lucide-react";

import productFire from "@/assets/product-fire.jpg";
import productRoller from "@/assets/product-roller.jpg";
import productOil from "@/assets/product-oil.jpg";
import productHvac from "@/assets/product-hvac.jpg";
import productLoading from "@/assets/product-loading.jpg";
import productLouvers from "@/assets/product-louvers.jpg";

const products = [
  { key: "products.fire", descKey: "products.fire.desc", icon: Flame, image: productFire },
  { key: "products.roller", descKey: "products.roller.desc", icon: DoorOpen, image: productRoller },
  { key: "products.oil", descKey: "products.oil.desc", icon: Droplets, image: productOil },
  { key: "products.hvac", descKey: "products.hvac.desc", icon: Wind, image: productHvac },
  { key: "products.loading", descKey: "products.loading.desc", icon: Truck, image: productLoading },
  { key: "products.louvers", descKey: "products.louvers.desc", icon: Shield, image: productLouvers },
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
                className="scroll-reveal group rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={t(product.key)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">{t(product.key)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(product.descKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
