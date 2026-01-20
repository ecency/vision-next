import { setProxyBase } from '@ecency/render-helper';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import { InstanceConfigManager } from './core';
import { routeTree } from './routeTree.gen';

// Get config once and extract all needed values
const config = InstanceConfigManager.getConfig();
const { general, instanceConfiguration } = config.configuration;

// Set up image proxy base URL
// This must be done before any content rendering
const imageProxyBase = general.imageProxy || 'https://images.ecency.com';
setProxyBase(imageProxyBase);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Apply background styles
const backgroundClasses = general.styles.background;
if (backgroundClasses) {
  backgroundClasses.split(' ').forEach((className) => {
    if (className) document.body.classList.add(className);
  });
}

// Apply theme
const applyTheme = (theme: string) => {
  if (theme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    document.documentElement.setAttribute(
      'data-theme',
      prefersDark ? 'dark' : 'light',
    );
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

const configuredTheme = general.theme;
applyTheme(configuredTheme);

// Apply style template
const styleTemplate = general.styleTemplate ?? 'medium';
document.documentElement.setAttribute('data-style-template', styleTemplate);

// Apply sidebar placement
const sidebarConfig = instanceConfiguration.layout.sidebar;
const sidebarPlacement = sidebarConfig.placement ?? 'right';
document.documentElement.setAttribute(
  'data-sidebar-placement',
  sidebarPlacement,
);

// Apply list type
const listType = instanceConfiguration.layout.listType ?? 'grid';
document.documentElement.setAttribute('data-list-type', listType);

// Apply instance type
const instanceType = instanceConfiguration.type ?? 'blog';
document.documentElement.setAttribute('data-instance-type', instanceType);

// Apply sidebar section visibility
document.documentElement.setAttribute(
  'data-show-followers',
  sidebarConfig.followers?.enabled !== false ? 'true' : 'false',
);
document.documentElement.setAttribute(
  'data-show-following',
  sidebarConfig.following?.enabled !== false ? 'true' : 'false',
);
document.documentElement.setAttribute(
  'data-show-hive-info',
  sidebarConfig.hiveInformation?.enabled !== false ? 'true' : 'false',
);

// Listen for system theme changes when theme is set to "system"
if (configuredTheme === 'system') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      document.documentElement.setAttribute(
        'data-theme',
        e.matches ? 'dark' : 'light',
      );
    });
}

// Apply SEO meta tags
const meta = instanceConfiguration.meta;

// Set document title
if (meta.title) {
  document.title = meta.title;
}

// Set meta description
if (meta.description) {
  let descriptionMeta = document.querySelector('meta[name="description"]');
  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta');
    descriptionMeta.setAttribute('name', 'description');
    document.head.appendChild(descriptionMeta);
  }
  descriptionMeta.setAttribute('content', meta.description);
}

// Set meta keywords
if (meta.keywords) {
  let keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (!keywordsMeta) {
    keywordsMeta = document.createElement('meta');
    keywordsMeta.setAttribute('name', 'keywords');
    document.head.appendChild(keywordsMeta);
  }
  keywordsMeta.setAttribute('content', meta.keywords);
}

// Set favicon
if (meta.favicon) {
  let faviconLink = document.querySelector(
    'link[rel="icon"]',
  ) as HTMLLinkElement;
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.setAttribute('rel', 'icon');
    document.head.appendChild(faviconLink);
  }
  faviconLink.setAttribute('href', meta.favicon);
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
