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
      <div className="container"><div className={styles.heroInner}>
        <div className={styles.heroText}>
          <h1 className={styles.homepageTitle}>UI Automata</h1>
          <h2 className={styles.homepageSubtitle}>
            Windows Desktop Control and Automation for AI Agents
          </h2>
          <p>
            A declarative workflow engine that gives AI agents structured,
            <br/>
            observable, repeatable control over any Windows GUI app.
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
        <div className={styles.heroVideo}>
          <video controls>
            <source src="/video/Automata Demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div></div>
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
