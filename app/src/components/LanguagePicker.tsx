/**
 * LanguagePicker.tsx — Choosing the language you're studying.
 *
 * A small button with the flag of the current language (🇫🇷). Tapping it
 * opens a list of the languages the app supports. Only French is available
 * for now; German and Spanish are shown greyed out with a "presto" badge,
 * so the structure is ready the day you start a new language.
 *
 * (Flags are emojis because you explicitly asked for flags here — the rest
 * of the interface sticks to the icon system, per the design rules.)
 */
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/state/StoreContext';
import { LANGUAGES } from '@/core/types';

export default function LanguagePicker() {
  const { state, setLang } = useStore();
  if (!state) return null;
  const current = LANGUAGES.find((l) => l.id === state.settings.lang) ?? LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-full border-2 border-tropical-charcoal/20 bg-card px-3 py-1.5 text-xl shadow-soft transition-transform hover:-translate-y-0.5"
          aria-label={`Lingua di studio: ${current.label}`}
        >
          <span aria-hidden>{current.flag}</span>
          <span className="text-xs font-semibold">{current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-t-sm p-2" align="end">
        <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Lingua di studio</p>
        {LANGUAGES.map((l) => {
          const active = l.id === current.id;
          return (
            <button
              key={l.id}
              disabled={!l.enabled}
              onClick={() => setLang(l.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
                active ? 'bg-secondary font-semibold' : l.enabled ? 'hover:bg-secondary/60' : 'opacity-45'
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {l.flag}
              </span>
              <span className="flex-1">{l.label}</span>
              {!l.enabled && <Badge variant="outline">presto</Badge>}
              {active && <span className="h-2 w-2 rounded-full bg-tropical-green" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
