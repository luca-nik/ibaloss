/**
 * AccentBar.tsx — One-tap French accents.
 *
 * Italian phone/PC keyboards don't have ç, ê, â and friends, and the quiz
 * requires exact accents. This bar shows the French special letters; tapping
 * one inserts it into the input that currently has focus, exactly where the
 * cursor is — like a tiny extra keyboard row.
 */

/** The French letters missing from an Italian keyboard. */
const ACCENTS = ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û'];

/**
 * Insert a character into the focused input, keeping React in sync.
 * (React inputs manage their own value, so we set the value through the
 * native setter and then fire an "input" event — that is the standard trick
 * to make React notice a programmatic change.)
 */
function insertIntoActiveInput(char: string) {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const newVal = el.value.slice(0, start) + char + el.value.slice(end);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, newVal);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  // Put the cursor back right after the inserted character.
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + 1, start + 1);
  });
}

export default function AccentBar() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ACCENTS.map((a) => (
        <button
          key={a}
          type="button"
          tabIndex={-1}
          // preventDefault on mousedown keeps the focus inside the text input,
          // so the character lands where the user was typing.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertIntoActiveInput(a)}
          className="h-9 w-9 rounded-full border-[1.5px] border-tropical-charcoal/20 bg-secondary text-base font-semibold text-secondary-foreground transition-transform duration-150 hover:bg-tropical-yellow/60 active:scale-90"
        >
          {a}
        </button>
      ))}
    </div>
  );
}
