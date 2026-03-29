import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';
import { MdDescription, MdVisibility, MdAutorenew, MdSmartToy } from "react-icons/md";

const FeatureList = [
  {
    title: 'Declarative',
    icon: <MdDescription size={26} />,
    description: (
      <>
        Describe what should happen in YAML — the action, the expected outcome, and what to do if it fails.
        No imperative scripting, no fragile sleep timers.
      </>
    ),
  },
  {
    title: 'Observable',
    icon: <MdVisibility size={26} />,
    description: (
      <>
        Every step carries an intent and an expected state. The engine polls for the outcome and
        produces a full structured trace — no silent failures.
      </>
    ),
  },
  {
    title: 'Recoverable',
    icon: <MdAutorenew size={26} />,
    description: (
      <>
        Recovery handlers detect known bad states — a popup, a disabled button, a stale dialog —
        and correct them automatically before retrying.
      </>
    ),
  },
  {
    title: 'Agent-Native',
    icon: <MdSmartToy size={26} />,
    description: (
      <>
        Built for AI agents from day one: semantic element trees, inline action scripting via MCP,
        and structured traces an agent can read and reason about.
      </>
    ),
  },
];

function Feature({ icon, title, description }) {
  return (
    <div className={clsx('col col--6')}>
      <div style={{ paddingBottom: '20px', paddingTop: '20px' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ paddingRight: '22px' }}>{icon}</div>
          <h3 style={{ fontSize: '20px' }}>{title}</h3>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={clsx('home-section', 'home-section-alt', styles.features)}>
      <div className="container">
        <div className="row">
          <div className="col col--11 col--offset-1">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
