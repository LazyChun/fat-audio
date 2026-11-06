import React from "react";
import { Modal } from "antd";
import { useI18n } from "hooks";
import { useSdk } from "hooks";
import {
  audioStore,
  useAudioStore,
  editorStore,
  transportStore,
} from "reducers";
import { Icon } from "components";
import EmptyState from "../EmptyState/EmptyState";
import styles from "./ProjectList.less";

const ProjectList: React.FC = () => {
  const sdk = useSdk();
  const { text } = useI18n();
  const { audios, loadingStatus } = useAudioStore();

  const handleOpen = async (id: string) => {
    try {
      const proj = await audioStore.loadProject(sdk, id);
      editorStore.syncFromProject(proj);
      transportStore.syncFromProject(proj);
      transportStore.setDurationFromProject(proj);
    } catch (e) {
      sdk.ui.toast.error(
        text("audio.project.loadFailed") + ": " + (e as Error)?.message,
      );
    }
  };

  const handleEdit = (e: React.MouseEvent, item: Audio.Item) => {
    e.stopPropagation();
    audioStore.setEditingAudio(item);
    audioStore.setEditModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, item: Audio.Item) => {
    e.stopPropagation();
    Modal.confirm({
      title: text("audio.project.confirmDelete"),
      okText: text("common.ok"),
      cancelText: text("common.cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await audioStore.deleteAudio(sdk, item.id);
          sdk.ui.toast.success(text("audio.project.deleteSuccess"));
        } catch (err) {
          sdk.ui.toast.error((err as Error)?.message || "Delete failed");
        }
      },
    });
  };

  const handleNew = () => {
    audioStore.setEditingAudio(undefined);
    audioStore.setEditModalOpen(true);
  };

  const handleRetry = () => {
    audioStore.loadAudios(sdk).catch((e) => {
      sdk.ui.toast.error((e as Error)?.message);
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Icon name="logo" size={20} />
          <h1 className={styles.title}>{text("audio.title")}</h1>
        </div>
        <button className={styles.newBtn} onClick={handleNew}>
          <Icon name="plus" size={12} />
          <span>{text("audio.project.new")}</span>
        </button>
      </div>

      <div className={styles.body}>
        {loadingStatus === "failed" && (
          <div className={styles.empty}>
            <p>{text("audio.project.loadFailed")}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>
              <Icon name="retry" size={12} />
              <span>{text("audio.project.retry")}</span>
            </button>
          </div>
        )}

        {loadingStatus !== "failed" && audios.length === 0 && (
          <EmptyState onCreate={handleNew} />
        )}

        {loadingStatus !== "failed" && audios.length > 0 && (
          <div className={styles.list}>
            {audios.map((item) => (
              <div
                key={item.id}
                className={styles.row}
                onClick={() => handleOpen(item.id)}
              >
                <div className={styles.rowInfo}>
                  <div className={styles.rowName}>{item.name}</div>
                  {item.description && (
                    <div className={styles.rowDesc}>{item.description}</div>
                  )}
                  <div className={styles.rowMeta}>
                    {formatDate(item.updatedAt)}
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button
                    className={styles.iconBtn}
                    title={text("audio.project.editTitle")}
                    onClick={(e) => handleEdit(e, item)}
                  >
                    <Icon name="edit" size={13} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title={text("audio.ai.delete")}
                    onClick={(e) => handleDelete(e, item)}
                  >
                    <Icon name="delete" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
