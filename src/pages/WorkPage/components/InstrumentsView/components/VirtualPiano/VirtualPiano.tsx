import React, { useState } from "react";
import { useEditorStore } from "reducers";
import { audioEngine, noteToMidi } from "utils";
import styles from "./VirtualPiano.less";

const WHITE_NOTES = [
  { name: "C", octave: 3 },
  { name: "D", octave: 3 },
  { name: "E", octave: 3 },
  { name: "F", octave: 3 },
  { name: "G", octave: 3 },
  { name: "A", octave: 3 },
  { name: "B", octave: 3 },
  { name: "C", octave: 4 },
  { name: "D", octave: 4 },
  { name: "E", octave: 4 },
  { name: "F", octave: 4 },
  { name: "G", octave: 4 },
  { name: "A", octave: 4 },
  { name: "B", octave: 4 },
];

// 黑键：依附于前一个白键（C#在C右侧，D#在D右侧，F#在F右侧，G#在G右侧，A#在A右侧）
// whiteIndex 指明该黑键挂在哪一个白键的右侧
const BLACK_NOTES = [
  { name: "C#", octave: 3, whiteIndex: 0 },
  { name: "D#", octave: 3, whiteIndex: 1 },
  { name: "F#", octave: 3, whiteIndex: 3 },
  { name: "G#", octave: 3, whiteIndex: 4 },
  { name: "A#", octave: 3, whiteIndex: 5 },
  { name: "C#", octave: 4, whiteIndex: 7 },
  { name: "D#", octave: 4, whiteIndex: 8 },
  { name: "F#", octave: 4, whiteIndex: 10 },
  { name: "G#", octave: 4, whiteIndex: 11 },
  { name: "A#", octave: 4, whiteIndex: 12 },
];

const WHITE_COUNT = WHITE_NOTES.length;

const VirtualPiano: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const { toneParams, selectedInstrumentId } = useEditorStore();

  const handlePress = (key: string) => {
    setActiveKey(key);
    window.setTimeout(() => {
      setActiveKey((prev) => (prev === key ? null : prev));
    }, 500);
    const midi = noteToMidi(key);
    void audioEngine.resume().then(() => {
      audioEngine.playNote(midi, 0.8, 90, toneParams, selectedInstrumentId);
    });
  };

  return (
    <div className={styles.pianoWrap}>
      <div className={styles.label}>C3 - B4</div>
      <div className={styles.piano}>
        {WHITE_NOTES.map((n) => {
          const key = `${n.name}${n.octave}`;
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.whiteKey}${isActive ? ` ${styles.whiteKeyActive}` : ""}`}
              onClick={() => handlePress(key)}
            >
              <span className={styles.keyName}>
                {n.name}
                {n.octave}
              </span>
            </button>
          );
        })}
        {BLACK_NOTES.map((n) => {
          const key = `${n.name}${n.octave}`;
          const isActive = activeKey === key;
          // 黑键 left：白键宽度的 (whiteIndex + 1) 倍，再减去半个黑键宽度（12px）
          const left = `calc((100% / ${WHITE_COUNT}) * ${n.whiteIndex + 1} - 12px)`;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.blackKey}${isActive ? ` ${styles.blackKeyActive}` : ""}`}
              style={{ left }}
              onClick={() => handlePress(key)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VirtualPiano;
