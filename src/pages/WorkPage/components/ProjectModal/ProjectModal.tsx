import React, { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import { useI18n } from "hooks";
import { useSdk } from "hooks";
import {
  audioStore,
  useAudioStore,
  editorStore,
  transportStore,
} from "reducers";
import styles from "./ProjectModal.less";

const ProjectModal: React.FC = () => {
  const sdk = useSdk();
  const { text } = useI18n();
  const { isEditModalOpen, editingAudio } = useAudioStore();
  const [form] = Form.useForm<{ name: string; description?: string }>();

  const isEdit = !!editingAudio;

  useEffect(() => {
    if (isEditModalOpen) {
      form.setFieldsValue({
        name: editingAudio?.name || "",
        description: editingAudio?.description || "",
      });
    } else {
      form.resetFields();
    }
  }, [isEditModalOpen, editingAudio, form]);

  const handleClose = () => {
    audioStore.setEditModalOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && editingAudio) {
        await audioStore.updateAudioMeta(sdk, {
          id: editingAudio.id,
          name: values.name,
          description: values.description,
        });
      } else {
        const item = await audioStore.createAudio(sdk, {
          name: values.name,
          description: values.description,
        });
        const proj = audioStore.getState().currentProject;
        if (proj) {
          editorStore.syncFromProject(proj);
          transportStore.syncFromProject(proj);
          transportStore.setDurationFromProject(proj);
        }
        void item;
      }
      handleClose();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      sdk.ui.toast.error((e as Error)?.message || "Save failed");
    }
  };

  return (
    <Modal
      open={isEditModalOpen}
      title={text(isEdit ? "audio.project.editTitle" : "audio.project.createTitle")}
      okText={text("common.ok")}
      cancelText={text("common.cancel")}
      onOk={handleSubmit}
      onCancel={handleClose}
      destroyOnClose
      className={styles.modal}
    >
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          name="name"
          label={text("audio.project.form.name.label")}
          rules={[{ required: true, message: text("audio.project.form.name.placeholder") }]}
        >
          <Input
            placeholder={text("audio.project.form.name.placeholder")}
            maxLength={64}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={text("audio.project.form.description.label")}
        >
          <Input.TextArea
            placeholder={text("audio.project.form.description.placeholder")}
            rows={3}
            maxLength={256}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectModal;
