import { useId } from "react";

export function Segmented<T extends string>(props: {
  label: string;
  hint?: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="question" role="group" aria-labelledby={id}>
      <div id={id} className="question-label">
        {props.label}
      </div>
      {props.hint ? <div className="hint">{props.hint}</div> : null}
      <div className="segmented">
        {props.options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={props.value === o.value}
            onClick={() => props.onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NumberField(props: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <div className="input-wrap">
        {props.prefix ? <span className="affix">{props.prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={props.step ?? "any"}
          min={0}
          placeholder={props.placeholder}
          value={props.value === null || !Number.isFinite(props.value) ? "" : props.value}
          onChange={(e) => {
            const raw = e.target.value;
            props.onChange(raw === "" ? null : Number(raw));
          }}
        />
        {props.suffix ? <span className="affix">{props.suffix}</span> : null}
      </div>
      {props.hint ? <div className="hint">{props.hint}</div> : null}
    </div>
  );
}

export const YES_NO_UNSURE = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
  { value: "unsure" as const, label: "Not sure" },
];
