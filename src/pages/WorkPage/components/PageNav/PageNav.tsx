import React from "react";
import { useI18n } from "hooks";
import { editorStore, useEditorStore, useAudioStore } from "reducers";
import { Icon } from "components";
import { NAV_KEYS, type NavKey } from "enums";
import styles from "./PageNav.less";

const NAV_ITEMS: { key: NavKey; icon: string; labelKey: string }[] = [
  { key: NAV_KEYS.WORKSPACE, icon: "workspace", labelKey: "audio.nav.workspace" },
  { key: NAV_KEYS.AI_GENERATE, icon: "aiGenerate", labelKey: "audio.nav.aiGenerate" },
  { key: NAV_KEYS.SCORE_EDITOR, icon: "scoreEditor", labelKey: "audio.nav.scoreEditor" },
  { key: NAV_KEYS.INSTRUMENTS, icon: "instruments", labelKey: "audio.nav.instruments" },
];

const PageNav: React.FC = () => {
  const { text } = useI18n();
  const { currentView } = useEditorStore();
  const { selectedAudioId } = useAudioStore();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = currentView === item.key;
        const disabled = !selectedAudioId;
        return (
          <button
            key={item.key}
            className={`${styles.tab} ${active ? styles.active : ""} ${
              disabled ? styles.disabled : ""
            }`}
            disabled={disabled}
            title={text(item.labelKey)}
            onClick={() => !disabled && editorStore.setView(item.key)}
          >
            <Icon name={item.icon} size={14} />
            <span className={styles.label}>{text(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default PageNav;
