import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const countries = [
  { code: "+971", iso: "ae", name: "UAE" },
  { code: "+966", iso: "sa", name: "Saudi Arabia" },
  { code: "+974", iso: "qa", name: "Qatar" },
  { code: "+973", iso: "bh", name: "Bahrain" },
  { code: "+968", iso: "om", name: "Oman" },
  { code: "+965", iso: "kw", name: "Kuwait" },
  { code: "+962", iso: "jo", name: "Jordan" },
  { code: "+961", iso: "lb", name: "Lebanon" },
  { code: "+964", iso: "iq", name: "Iraq" },
  { code: "+963", iso: "sy", name: "Syria" },
  { code: "+970", iso: "ps", name: "Palestine" },
  { code: "+967", iso: "ye", name: "Yemen" },
  { code: "+20", iso: "eg", name: "Egypt" },
  { code: "+212", iso: "ma", name: "Morocco" },
  { code: "+216", iso: "tn", name: "Tunisia" },
  { code: "+213", iso: "dz", name: "Algeria" },
  { code: "+218", iso: "ly", name: "Libya" },
  { code: "+249", iso: "sd", name: "Sudan" },
  { code: "+211", iso: "ss", name: "South Sudan" },
  { code: "+252", iso: "so", name: "Somalia" },
  { code: "+253", iso: "dj", name: "Djibouti" },
  { code: "+269", iso: "km", name: "Comoros" },
  { code: "+222", iso: "mr", name: "Mauritania" },
  { code: "+91", iso: "in", name: "India" },
  { code: "+92", iso: "pk", name: "Pakistan" },
  { code: "+93", iso: "af", name: "Afghanistan" },
  { code: "+94", iso: "lk", name: "Sri Lanka" },
  { code: "+95", iso: "mm", name: "Myanmar" },
  { code: "+98", iso: "ir", name: "Iran" },
  { code: "+90", iso: "tr", name: "Turkey" },
  { code: "+86", iso: "cn", name: "China" },
  { code: "+81", iso: "jp", name: "Japan" },
  { code: "+82", iso: "kr", name: "South Korea" },
  { code: "+850", iso: "kp", name: "North Korea" },
  { code: "+852", iso: "hk", name: "Hong Kong" },
  { code: "+853", iso: "mo", name: "Macau" },
  { code: "+886", iso: "tw", name: "Taiwan" },
  { code: "+65", iso: "sg", name: "Singapore" },
  { code: "+60", iso: "my", name: "Malaysia" },
  { code: "+62", iso: "id", name: "Indonesia" },
  { code: "+63", iso: "ph", name: "Philippines" },
  { code: "+66", iso: "th", name: "Thailand" },
  { code: "+84", iso: "vn", name: "Vietnam" },
  { code: "+855", iso: "kh", name: "Cambodia" },
  { code: "+856", iso: "la", name: "Laos" },
  { code: "+880", iso: "bd", name: "Bangladesh" },
  { code: "+977", iso: "np", name: "Nepal" },
  { code: "+975", iso: "bt", name: "Bhutan" },
  { code: "+960", iso: "mv", name: "Maldives" },
  { code: "+976", iso: "mn", name: "Mongolia" },
  { code: "+996", iso: "kg", name: "Kyrgyzstan" },
  { code: "+992", iso: "tj", name: "Tajikistan" },
  { code: "+993", iso: "tm", name: "Turkmenistan" },
  { code: "+998", iso: "uz", name: "Uzbekistan" },
  { code: "+7", iso: "kz", name: "Kazakhstan" },
  { code: "+995", iso: "ge", name: "Georgia" },
  { code: "+994", iso: "az", name: "Azerbaijan" },
  { code: "+374", iso: "am", name: "Armenia" },
  { code: "+972", iso: "il", name: "Israel" },
  { code: "+357", iso: "cy", name: "Cyprus" },
  { code: "+44", iso: "gb", name: "United Kingdom" },
  { code: "+1", iso: "us", name: "United States" },
  { code: "+49", iso: "de", name: "Germany" },
  { code: "+33", iso: "fr", name: "France" },
  { code: "+39", iso: "it", name: "Italy" },
  { code: "+34", iso: "es", name: "Spain" },
  { code: "+351", iso: "pt", name: "Portugal" },
  { code: "+31", iso: "nl", name: "Netherlands" },
  { code: "+32", iso: "be", name: "Belgium" },
  { code: "+41", iso: "ch", name: "Switzerland" },
  { code: "+43", iso: "at", name: "Austria" },
  { code: "+46", iso: "se", name: "Sweden" },
  { code: "+47", iso: "no", name: "Norway" },
  { code: "+45", iso: "dk", name: "Denmark" },
  { code: "+358", iso: "fi", name: "Finland" },
  { code: "+354", iso: "is", name: "Iceland" },
  { code: "+353", iso: "ie", name: "Ireland" },
  { code: "+48", iso: "pl", name: "Poland" },
  { code: "+420", iso: "cz", name: "Czech Republic" },
  { code: "+421", iso: "sk", name: "Slovakia" },
  { code: "+36", iso: "hu", name: "Hungary" },
  { code: "+40", iso: "ro", name: "Romania" },
  { code: "+359", iso: "bg", name: "Bulgaria" },
  { code: "+30", iso: "gr", name: "Greece" },
  { code: "+385", iso: "hr", name: "Croatia" },
  { code: "+386", iso: "si", name: "Slovenia" },
  { code: "+381", iso: "rs", name: "Serbia" },
  { code: "+387", iso: "ba", name: "Bosnia" },
  { code: "+382", iso: "me", name: "Montenegro" },
  { code: "+389", iso: "mk", name: "North Macedonia" },
  { code: "+355", iso: "al", name: "Albania" },
  { code: "+370", iso: "lt", name: "Lithuania" },
  { code: "+371", iso: "lv", name: "Latvia" },
  { code: "+372", iso: "ee", name: "Estonia" },
  { code: "+380", iso: "ua", name: "Ukraine" },
  { code: "+375", iso: "by", name: "Belarus" },
  { code: "+373", iso: "md", name: "Moldova" },
  { code: "+7", iso: "ru", name: "Russia" },
  { code: "+352", iso: "lu", name: "Luxembourg" },
  { code: "+356", iso: "mt", name: "Malta" },
  { code: "+377", iso: "mc", name: "Monaco" },
  { code: "+376", iso: "ad", name: "Andorra" },
  { code: "+423", iso: "li", name: "Liechtenstein" },
  { code: "+378", iso: "sm", name: "San Marino" },
  { code: "+234", iso: "ng", name: "Nigeria" },
  { code: "+27", iso: "za", name: "South Africa" },
  { code: "+254", iso: "ke", name: "Kenya" },
  { code: "+255", iso: "tz", name: "Tanzania" },
  { code: "+256", iso: "ug", name: "Uganda" },
  { code: "+251", iso: "et", name: "Ethiopia" },
  { code: "+233", iso: "gh", name: "Ghana" },
  { code: "+225", iso: "ci", name: "Ivory Coast" },
  { code: "+221", iso: "sn", name: "Senegal" },
  { code: "+237", iso: "cm", name: "Cameroon" },
  { code: "+243", iso: "cd", name: "DR Congo" },
  { code: "+242", iso: "cg", name: "Congo" },
  { code: "+250", iso: "rw", name: "Rwanda" },
  { code: "+257", iso: "bi", name: "Burundi" },
  { code: "+258", iso: "mz", name: "Mozambique" },
  { code: "+260", iso: "zm", name: "Zambia" },
  { code: "+263", iso: "zw", name: "Zimbabwe" },
  { code: "+265", iso: "mw", name: "Malawi" },
  { code: "+261", iso: "mg", name: "Madagascar" },
  { code: "+230", iso: "mu", name: "Mauritius" },
  { code: "+267", iso: "bw", name: "Botswana" },
  { code: "+264", iso: "na", name: "Namibia" },
  { code: "+244", iso: "ao", name: "Angola" },
  { code: "+231", iso: "lr", name: "Liberia" },
  { code: "+232", iso: "sl", name: "Sierra Leone" },
  { code: "+220", iso: "gm", name: "Gambia" },
  { code: "+224", iso: "gn", name: "Guinea" },
  { code: "+245", iso: "gw", name: "Guinea-Bissau" },
  { code: "+238", iso: "cv", name: "Cape Verde" },
  { code: "+239", iso: "st", name: "São Tomé" },
  { code: "+240", iso: "gq", name: "Equatorial Guinea" },
  { code: "+241", iso: "ga", name: "Gabon" },
  { code: "+235", iso: "td", name: "Chad" },
  { code: "+236", iso: "cf", name: "Central African Republic" },
  { code: "+226", iso: "bf", name: "Burkina Faso" },
  { code: "+227", iso: "ne", name: "Niger" },
  { code: "+228", iso: "tg", name: "Togo" },
  { code: "+229", iso: "bj", name: "Benin" },
  { code: "+223", iso: "ml", name: "Mali" },
  { code: "+248", iso: "sc", name: "Seychelles" },
  { code: "+268", iso: "sz", name: "Eswatini" },
  { code: "+266", iso: "ls", name: "Lesotho" },
  { code: "+291", iso: "er", name: "Eritrea" },
  { code: "+55", iso: "br", name: "Brazil" },
  { code: "+52", iso: "mx", name: "Mexico" },
  { code: "+54", iso: "ar", name: "Argentina" },
  { code: "+56", iso: "cl", name: "Chile" },
  { code: "+57", iso: "co", name: "Colombia" },
  { code: "+58", iso: "ve", name: "Venezuela" },
  { code: "+51", iso: "pe", name: "Peru" },
  { code: "+593", iso: "ec", name: "Ecuador" },
  { code: "+591", iso: "bo", name: "Bolivia" },
  { code: "+595", iso: "py", name: "Paraguay" },
  { code: "+598", iso: "uy", name: "Uruguay" },
  { code: "+592", iso: "gy", name: "Guyana" },
  { code: "+597", iso: "sr", name: "Suriname" },
  { code: "+506", iso: "cr", name: "Costa Rica" },
  { code: "+507", iso: "pa", name: "Panama" },
  { code: "+502", iso: "gt", name: "Guatemala" },
  { code: "+503", iso: "sv", name: "El Salvador" },
  { code: "+504", iso: "hn", name: "Honduras" },
  { code: "+505", iso: "ni", name: "Nicaragua" },
  { code: "+501", iso: "bz", name: "Belize" },
  { code: "+53", iso: "cu", name: "Cuba" },
  { code: "+509", iso: "ht", name: "Haiti" },
  { code: "+876", iso: "jm", name: "Jamaica" },
  { code: "+868", iso: "tt", name: "Trinidad and Tobago" },
  { code: "+61", iso: "au", name: "Australia" },
  { code: "+64", iso: "nz", name: "New Zealand" },
  { code: "+679", iso: "fj", name: "Fiji" },
  { code: "+675", iso: "pg", name: "Papua New Guinea" },
  { code: "+676", iso: "to", name: "Tonga" },
  { code: "+685", iso: "ws", name: "Samoa" },
];

function stripCountryCode(val: string, country: typeof countries[0]): string {
  const cleaned = val.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith(country.code)) {
    return cleaned.slice(country.code.length).trim();
  }
  return cleaned.replace(/^\+\d+\s?/, "").trim();
}

const FlagImg = ({ iso, className = "" }: { iso: string; className?: string }) => (
  <img
    src={`https://flagcdn.com/w40/${iso}.png`}
    alt={iso}
    className={`inline-block rounded-sm object-cover ${className}`}
    style={{ width: 20, height: 15 }}
  />
);

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const [selected, setSelected] = useState(countries[0]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect country code from initial value
  useEffect(() => {
    if (initialized || !value) return;
    // Sort by code length descending to match longest first (e.g. +971 before +97)
    const sorted = [...countries].sort((a, b) => b.code.length - a.code.length);
    const cleaned = value.replace(/[^0-9+]/g, "");
    for (const c of sorted) {
      if (cleaned.startsWith(c.code)) {
        setSelected(c);
        break;
      }
    }
    setInitialized(true);
  }, [value, initialized]);

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
    const phoneNumber = stripCountryCode(value, selected);
    onChange(`${country.code}${phoneNumber}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${selected.code}${e.target.value}`);
  };

  const phoneNumber = stripCountryCode(value, selected);

  return (
    <div className="relative flex" ref={ref}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 rounded-l-xl border border-r-0 border-input bg-secondary/50 hover:bg-secondary transition-colors shrink-0"
      >
        <FlagImg iso={selected.iso} />
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
                <FlagImg iso={country.iso} />
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
