import type { Scan } from "../lib/types";

export function scanTitle(s: Scan) {
  const t = [s.specs.year?.value, s.specs.make?.value, s.specs.model?.value].filter(Boolean).join(" ");
  return t || (s.vin ? s.vin : "Untitled truck");
}

export function SavedSection(props: {
  saved: Scan[];
  currentId: string;
  onOpen: (s: Scan) => void;
  onDelete: (id: string) => void;
}) {
  if (props.saved.length === 0) return null;
  return (
    <section aria-labelledby="saved-h" className="saved">
      <h2 id="saved-h">Saved trucks</h2>
      <ul>
        {props.saved.map((s) => (
          <li key={s.id}>
            <button type="button" className="link" onClick={() => props.onOpen(s)} aria-current={s.id === props.currentId}>
              {scanTitle(s)}
              {s.vin ? <span className="hint mono"> {s.vin.slice(-6)}</span> : null}
            </button>
            <button
              type="button"
              className="link danger"
              aria-label={`Delete ${scanTitle(s)}`}
              onClick={() => {
                if (confirm(`Delete ${scanTitle(s)} from this phone?`)) props.onDelete(s.id);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
