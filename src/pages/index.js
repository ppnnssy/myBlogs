import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import Heading from "@theme/Heading";
import styles from "./index.module.css";

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout description="阿喵的个人Blog，聊聊技术，记录生活">
      <main>
        <div className={styles.contanter}>
          <div className={styles.welcome}>Welcome</div>
        </div>
      </main>
    </Layout>
  );
}
