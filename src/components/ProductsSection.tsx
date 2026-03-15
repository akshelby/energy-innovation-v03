import { Flame, DoorOpen, Droplets, Wind, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { megaMenuCategories } from "@/data/megaMenuData";

const categoryIcons = [Flame, DoorOpen, Droplets, Wind, Package];

const ProductsSection = () => {
  const { t } = useLanguage();

  return (
    <section id="products" className="py-24 px-6 md:px-16 lg:px-24 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("products")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Comprehensive industrial solutions engineered for performance, safety, and sustainability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {megaMenuCategories.map((cat, idx) => {
            const Icon = categoryIcons[idx];
            return (
              <div
                key={cat.titleKey}
                className="group p-6 rounded-xl bg-card border border-border hover:border-eco/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-eco flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {t(cat.titleKey)}
                </h3>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item.titleKey} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-eco mt-2 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground/90">
                          {t(item.titleKey)}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {t(item.descKey)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
