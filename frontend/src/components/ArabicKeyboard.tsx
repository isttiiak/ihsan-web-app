// A small on-screen Arabic keyboard for typing custom dhikr text without an
// OS-level Arabic layout installed. Inserts/deletes at the END of the value —
// simple append semantics, no cursor tracking (fine for short dhikr phrases).
const ROWS: string[][] = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'د'],
  ['ٌ', 'ً', 'ٍ', 'ّ', 'ْ', 'ُ', 'ِ', 'َ'],
];

export default function ArabicKeyboard({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 p-2 rounded-xl border border-brand-border bg-brand-deep space-y-1">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 justify-center flex-wrap" dir="rtl">
          {row.map((ch, j) => (
            <button
              key={`${i}-${j}`}
              type="button"
              onClick={() => onChange(value + ch)}
              className="w-8 h-8 shrink-0 rounded-lg bg-white/10 hover:bg-brand-emerald/30 text-white text-base flex items-center justify-center"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1.5 justify-center pt-1">
        <button
          type="button"
          onClick={() => onChange(value + ' ')}
          className="btn btn-xs flex-1 max-w-[120px] bg-white/10 border-0 text-white/70 hover:bg-white/20"
        >
          space
        </button>
        <button
          type="button"
          onClick={() => onChange(value.slice(0, -1))}
          className="btn btn-xs bg-white/10 border-0 text-white/70 hover:bg-white/20 px-3"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-xs bg-brand-emerald/20 border-0 text-brand-emerald hover:bg-brand-emerald/30 px-3"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
