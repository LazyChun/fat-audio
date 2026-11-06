import React from "react";
import { useI18n } from "hooks";
import { Icon } from "components";
import styles from "./EmptyState.less";

interface EmptyStateProps {
  onCreate?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => {
  const { text } = useI18n();

  return (
    <div className={styles.container}>
      <div className={styles.stageGlow}></div>

      <div className={styles.scene}>
        {/* 跳动音波 */}
        <div className={styles.waves}>
          <span className={`${styles.wave} ${styles.wave1}`}></span>
          <span className={`${styles.wave} ${styles.wave2}`}></span>
          <span className={`${styles.wave} ${styles.wave3}`}></span>
          <span className={`${styles.wave} ${styles.wave4}`}></span>
          <span className={`${styles.wave} ${styles.wave5}`}></span>
        </div>

        {/* DJ 卡通人物 */}
        <div className={styles.dj}>
          {/* 唱片机（打碟机） */}
          <div className={styles.turntable}>
            <div className={styles.record}></div>
            <div className={styles.toneArm}></div>
          </div>

          {/* 头部 */}
          <div className={styles.head}>
            <div className={styles.hair}></div>
            <div className={styles.face}>
              <div className={styles.eye}></div>
              <div className={`${styles.eye} ${styles.eyeRight}`}></div>
              <div className={styles.mouth}></div>
            </div>
            {/* 大耳机 */}
            <div className={`${styles.headphone} ${styles.headphoneLeft}`}>
              <div className={styles.band}></div>
            </div>
            <div className={`${styles.headphone} ${styles.headphoneRight}`}>
              <div className={styles.band}></div>
            </div>
            <div className={styles.headband}></div>
          </div>

          {/* 身体 */}
          <div className={styles.torso}>
            <div className={styles.jacket}></div>
            <div className={styles.chain}></div>
          </div>

          {/* 手臂 */}
          <div className={`${styles.arm} ${styles.armLeft}`}>
            <div className={styles.sleeve}></div>
            <div className={styles.hand}></div>
          </div>
          <div className={`${styles.arm} ${styles.armRight}`}>
            <div className={styles.sleeve}></div>
            <div className={styles.hand}></div>
          </div>

          {/* 腿部 */}
          <div className={styles.legs}>
            <div className={`${styles.leg} ${styles.legLeft}`}>
              <div className={styles.shoe}></div>
            </div>
            <div className={`${styles.leg} ${styles.legRight}`}>
              <div className={styles.shoe}></div>
            </div>
          </div>
        </div>

        <div className={styles.shadow}></div>
      </div>

      <div className={styles.title}>{text("audio.project.emptyTitle")}</div>
      <div className={styles.subtitle}>{text("audio.project.emptyDesc")}</div>

      {onCreate && (
        <button className={styles.createBtn} onClick={onCreate}>
          <Icon name="plus" size={12} />
          <span>{text("audio.project.new")}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
