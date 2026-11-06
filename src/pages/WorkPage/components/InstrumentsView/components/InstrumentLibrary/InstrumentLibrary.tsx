import React, { useState } from "react";
import { INSTRUMENT_CATEGORIES, INSTRUMENT_LIBRARY, type InstrumentCategory } from "enums";
import { useI18n } from "hooks";
import InstrumentCard from "../InstrumentCard/InstrumentCard";
import styles from "./InstrumentLibrary.less";

const InstrumentLibrary: React.FC = () => {
  const { text } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory>("all");

  const filtered = selectedCategory === "all"
    ? INSTRUMENT_LIBRARY
    : INSTRUMENT_LIBRARY.filter((i) => i.category === selectedCategory);

  return (
    <div className={styles.panel}>
      <div className={styles.categories}>
        {INSTRUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.catChip}${selectedCategory === cat ? ` ${styles.catActive}` : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {text(`audio.category.${cat}`)}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {filtered.map((inst) => (
          <InstrumentCard key={inst.id} inst={inst} />
        ))}
      </div>
    </div>
  );
};

export default InstrumentLibrary;
