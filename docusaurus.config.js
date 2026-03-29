/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'ui-automata',
  tagline: 'Windows UI automation for AI agents',
  url: 'https://ui-automata.visioncortex.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'favicon.ico',
  organizationName: 'visioncortex',
  projectName: 'ui-automata',
  trailingSlash: true,
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ui-automata',
      logo: {
        alt: 'ui-automata logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'doc',
          docId: '01-introduction/01-what-is-ui-automata',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          href: 'https://github.com/visioncortex/ui-automata',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/blog/getting-started',
            },
            {
              label: 'Core Concepts',
              to: '/docs/03-core-concepts/01-workflow-structure',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/visioncortex/ui-automata',
            },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/visioncortex/ui-automata/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} visioncortex`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/vsLight'),
      darkTheme: require('prism-react-renderer/themes/vsDark'),
      additionalLanguages: [
        'rust',
        'toml',
        'yaml',
        'bash',
      ],
    },
    imageZoom: {
      selector: '.markdown img',
      options: {
        margin: 12,
        scrollOffset: 80,
        background: '#AABBCC00',
      },
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/visioncortex/ui-automata.visioncortex.org/edit/main/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          routeBasePath: '/blog',
          showReadingTime: true,
          editUrl: 'https://github.com/visioncortex/ui-automata.visioncortex.org/edit/main/blog',
          blogSidebarTitle: 'All Posts',
          blogSidebarCount: 'ALL',
          postsPerPage: 'ALL',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'daily',
          priority: 0.8,
        },
      },
    ],
  ],
  plugins: [
    'plugin-image-zoom',
  ],
};
