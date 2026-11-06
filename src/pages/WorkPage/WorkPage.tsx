import React from "react";
import { InitSdk } from "components";
import { useI18n } from "hooks";
import type { FatNotesPluginSDK } from "fat-notes-sdk";
import AppShell from "./components/AppShell/AppShell";
import "../../styles/ams-tokens.less";
import styles from "./WorkPage.less";

interface WorkPageProps {
  sdk: FatNotesPluginSDK;
}

const WorkPage: React.FC<WorkPageProps> = ({ sdk }) => {
  useI18n();
  return (
    <InitSdk sdk={sdk}>
      <div className={styles.container}>
        <AppShell />
      </div>
    </InitSdk>
  );
};

export default WorkPage;
