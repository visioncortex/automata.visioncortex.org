import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';
import { MdDescription, MdVisibility, MdSmartToy } from "react-icons/md";

const FeatureList = [
  {
    title: 'Declarative',
    icon: <MdDescription size={26} />,
    description: (
      <>
        Declarative YAML workflows that are robust by design: expected outcomes on every step,
        automatic recovery from bad states, and no fragile sleep timers.
      </>
    ),
    video: '/video/notepad-demo.mp4',
  },
  {
    title: 'Universal Coverage',
    icon: <MdVisibility size={26} />,
    description: (
      <>
        Across all UI surfaces — Win32, MFC, WPF, UWP, WinUI 3, terminal window, and web browser.
        All access modes supported: UIA, DOM, and pure vision.
      </>
    ),
    video: '/video/control-panel.mp4',
  },
  {
    title: 'Agent-Native',
    icon: <MdSmartToy size={26} />,
    description: (
      <>
        Explore live UI element trees interactively, author workflows with schema guidance and linting,
        and drive everything through rich MCP tools designed for AI agents.
      </>
    ),
    video: '/video/windows-version.mp4',
  },
  {
    title: 'Industrial-Grade Apps',
    icon: <MdSmartToy size={26} />,
    description: (
      <>
        Automate complex, professional-grade applications with deep, dense UI hierarchies.
        Reliable automation for the apps that matter in real workflows.
      </>
    ),
    video: '/video/mastercam-demo.mp4',
  },
];

function FeatureRow({ icon, title, description, image, video, reverse }) {
  const textCol = (
    <div className={styles.featureText}>
      <div className={styles.featureHeading}>
        <span className={styles.featureIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
    </div>
  );

  const imageCol = (
    <div className={styles.featureImage}>
      {video
        ? <video src={video} autoPlay muted loop playsInline className={styles.featureVideo} />
        : image
          ? <img src={image} alt={title} />
          : <div className={styles.featurePlaceholder} />
      }
    </div>
  );

  return (
    <div className={clsx(styles.featureRow, reverse && styles.featureRowReverse)}>
      {textCol}
      {imageCol}
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={clsx('home-section', 'home-section-alt', styles.features)}>
      <div className="container">
        {FeatureList.map((props, idx) => (
          <FeatureRow key={idx} {...props} reverse={idx % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
