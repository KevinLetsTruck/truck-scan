import type { Answer, Equipment, EquipmentKey, IdleSetup, Scan } from "../lib/types";
import { Segmented, YES_NO_UNSURE } from "./Controls";

export function ChecklistSection(props: { scan: Scan; onChange: (s: Scan) => void }) {
  const { scan, onChange } = props;
  const e = scan.equipment;
  const set = (patch: Partial<Equipment>) => onChange({ ...scan, equipment: { ...e, ...patch } });
  const yn = (key: EquipmentKey, label: string, hint?: string) => (
    <Segmented<Answer>
      key={key}
      label={label}
      hint={hint}
      value={e[key]}
      options={YES_NO_UNSURE}
      onChange={(v) => set({ [key]: v })}
    />
  );

  return (
    <section aria-labelledby="equip-h">
      <h2 id="equip-h">
        <span className="step">2</span> What is on the truck
      </h2>
      <p className="lede">Walk around the truck. Tap what you see. Anything already on the truck drops off the list.</p>
      <div className="card">
        <Segmented<Answer>
          label="Do you own the trailer you pull?"
          hint="Trailer changes only pay if the trailer is yours."
          value={e.ownTrailer === "unsure" ? undefined : e.ownTrailer}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          onChange={(v) => set({ ownTrailer: v })}
        />
        {e.ownTrailer !== "no" ? (
          <>
            {yn("trailerSkirts", "Trailer side skirts?", "Panels under the trailer between the landing gear and the tandems.")}
            {yn("trailerTail", "Trailer tail?", "Folding panels on the back doors.")}
          </>
        ) : null}
        {yn("chassisFairings", "Chassis fairings on the tractor?", "Panels covering the fuel tanks and frame between the steer and drive axles.")}
        {yn("cabExtenders", "Cab extenders?", "Panels off the back of the cab that close the gap to the trailer.")}
        {yn("lrrTires", "Low rolling resistance tires on all 18?", "SmartWay-verified. The sidewall or the tire invoice says so.")}
        {scan.cab.value !== "day" ? (
          <Segmented<IdleSetup>
            label="What runs the sleeper when you park?"
            value={e.idle}
            options={[
              { value: "idles", label: "Truck idles" },
              { value: "diesel-apu", label: "Diesel APU" },
              { value: "battery-apu", label: "Battery APU" },
              { value: "unsure", label: "Not sure" },
            ]}
            onChange={(v) => set({ idle: v })}
          />
        ) : null}
      </div>
    </section>
  );
}
