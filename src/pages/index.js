import React from "react";
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.homepageTitle}>ui-automata</h1>
        <p className={styles.homepageSubtitle}>
          Delegate Windows desktop tasks to your AI agent
        </p>
        <p>
          A declarative workflow engine that gives AI agents structured,
          observable, recoverable control over any Windows UI.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/blog/introducing-ui-automata">
            Learn More
          </Link>
          &nbsp;&nbsp;
          <Link
            className="button button--primary button--lg"
            to="/blog/getting-started">
            Getting Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
