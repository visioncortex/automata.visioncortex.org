/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'UI Automata',
  tagline: 'Windows Desktop Automation for AI Agents',
  url: 'https://automata.visioncortex.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/icon.png',
  organizationName: 'visioncortex',
  projectName: 'ui-automata',
  trailingSlash: true,
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'UI Automata',
      logo: {
        alt: 'UI Automata logo',
        src: 'img/icon.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'introduction/what-is-ui-automata',
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
              label: 'Install',
              to: '/docs/installation/desktop-setup/',
            },
            {
              label: 'Concepts',
              to: '/docs/core-concepts/workflow-engine/',
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
      copyright: `Copyright © ${new Date().getFullYear()} visioncortex.org`,
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
  stylesheets: [
    '/cookieconsent/cookieconsent.css',
  ],
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'text/javascript' },
      innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w64nb62h2k");`,
    },
  ],
  scripts: [
    {
      type: 'module',
      src: '/cookieconsent/cookieconsent.js',
      async: true,
    },
  ],
};
