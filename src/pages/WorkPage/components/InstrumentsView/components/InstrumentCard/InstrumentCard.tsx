import React from "react";
import { editorStore, useEditorStore } from "reducers";
import { useI18n } from "hooks";
import { Icon } from "components";
import type { InstrumentDef } from "enums";
import styles from "./InstrumentCard.less";

interface InstrumentCardProps {
  inst: InstrumentDef;
}

const InstrumentCard: React.FC<InstrumentCardProps> = ({ inst }) => {
  const { selectedInstrumentId } = useEditorStore();
  const { text } = useI18n();
  const selected = selectedInstrumentId === inst.id;

  const handleClick = () => {
    editorStore.selectInstrument(inst.id);
  };

  return (
    <div
      className={`${styles.card}${selected ? ` ${styles.selected}` : ""}`}
      onClick={handleClick}
    >
      <div className={styles.dot} style={{ background: inst.colorVar }} />
      <div className={styles.info}>
        <span className={styles.name}>{text(inst.nameKey)}</span>
        <span className={styles.category}>
          {text(`audio.category.${inst.category}`)}
        </span>
      </div>
      <button
        className={styles.addBtn}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
};

export default InstrumentCard;
