import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const countries = [
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const [selected, setSelected] = useState(countries[0]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const handleSelect = (country: typeof countries[0]) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    // Update the phone value with new country code
    const phoneNumber = value.replace(/^\+\d+\s?/, "");
    onChange(`${country.code} ${phoneNumber}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${selected.code} ${e.target.value}`);
  };

  const phoneNumber = value.replace(/^\+\d+\s?/, "");

  return (
    <div className="relative flex" ref={ref}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 rounded-l-xl border border-r-0 border-input bg-secondary/50 hover:bg-secondary transition-colors shrink-0"
      >
        <span className="text-lg">{selected.flag}</span>
        <span className="text-sm text-muted-foreground">{selected.code}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {/* Phone input */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder="5X XXX XXXX"
        maxLength={15}
        className="flex h-10 w-full rounded-r-xl border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2 text-sm bg-secondary/50 rounded-lg border-0 outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((country) => (
              <button
                key={country.code + country.name}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors ${
                  selected.code === country.code ? "bg-accent/10 text-accent" : "text-foreground"
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="flex-1 text-left">{country.name}</span>
                <span className="text-muted-foreground">{country.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
