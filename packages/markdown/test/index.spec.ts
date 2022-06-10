import plugin, { ElderjsPluginInternal } from '../src/index.js';
import gettingStartedOutput from './fixtures/getting-started-output.js';
import { SettingsOptions } from '@elderjs/elderjs';
import { describe, it, expect, afterEach } from 'vitest';

const settings: SettingsOptions = {
  context: 'server',
  origin: 'https://example.com',
  lang: 'en',
  srcDir: process.cwd() + '/test/fixtures',
  distDir: process.cwd() + '/public',
  rootDir: process.cwd() + '',
  build: false,
  prefix: '',
  server: {
    allRequestsRoute: true,
    dataRoutes: false,
    cacheRequests: true,
    prefix: '',
  },
  props: {
    hydration: 'hybrid',
    compress: false,
    replacementChars: '$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  },
  debug: {
    stacks: false,
    hooks: false,
    performance: false,
    build: false,
    automagic: false,
    shortcodes: false,
    props: false,
  },
  hooks: { disable: [] },
  plugins: {
    '@elderjs/plugin-markdown': { routes: ['blog'] },
    '@elderjs/plugin-browser-reload': { reload: true },
  },
  shortcodes: { closePattern: '}}', openPattern: '{{' },
  css: 'file',
  version: '1.7.5',
  worker: false,
  $$internal: {
    ssrComponents: process.cwd() + '/___ELDER___/compiled',
    clientComponents: process.cwd() + '/public/_elderjs/svelte',
    distElder: '/Users/nickreese/repos/elderjs/template/public/_elderjs',
    logPrefix: '[Elder.js]:',
    serverPrefix: '',
    findComponent: () => ({
      ssr: '',
      client: '',
      iife: '',
    }),
    publicCssFile: '/_elderjs/assets/svelte-5029f7ac4396c102400e3ff4538301dc.css',
  },
};

const pluginPayloadDefault = {
  ...plugin,
  settings,
  config: { ...plugin.config, routes: ['blog'], useElderJsPluginImages: false, contents: {}, slugFormatter: undefined },
};

let pluginPayload: typeof pluginPayloadDefault = JSON.parse(JSON.stringify(pluginPayloadDefault));

afterEach(() => {
  // for test we need to define necessary plugin property manually
  pluginPayload = JSON.parse(JSON.stringify(pluginPayloadDefault)) as typeof pluginPayloadDefault;
});

describe(`index.init()`, () => {
  it('have defined property', () => {
    expect(pluginPayloadDefault.name).toBeDefined();
    expect(pluginPayloadDefault.description).toBeDefined();
    expect(pluginPayloadDefault.init).toBeDefined();
    expect(pluginPayloadDefault.hooks.length).toBeGreaterThan(0);
    expect(pluginPayloadDefault.config).toBeDefined();
    expect(pluginPayloadDefault.settings).toBeDefined();
    expect(pluginPayloadDefault.settings.srcDir).toBeDefined();
    expect(pluginPayloadDefault.settings.shortcodes).toBeDefined();
  });

  it('plugin.init() standard output formatting', async () => {
    const pluginOutput = await pluginPayloadDefault.init(pluginPayload);
    const internal = pluginOutput.internal as ElderjsPluginInternal;
    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(internal.markdown[pluginPayload.config.routes[0]]).toHaveLength(1);
    expect(markdownOutput.slug).toEqual(gettingStartedOutput.slug);
    expect(markdownOutput.frontmatter).toEqual(gettingStartedOutput.frontmatter);
    await markdownOutput.compileHtml();
    expect(markdownOutput.html).toEqual(gettingStartedOutput.html);
    expect(markdownOutput.data).toEqual({});
  });

  it('plugin.init() with markdown without frontmatter', async () => {
    pluginPayload.config.routes = ['no-frontmatter'];
    const pluginOutput = await pluginPayloadDefault.init({ ...pluginPayloadDefault });
    const internal = pluginOutput.internal as ElderjsPluginInternal;
    expect(internal).toMatchSnapshot();
  });

  it('@elderjs/plugin-images output', async () => {
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayloadDefault,
      settings: {
        ...pluginPayloadDefault.settings,
        plugins: { ...pluginPayloadDefault.settings.plugins, '@elderjs/plugin-images': {} },
      },
      config: { ...pluginPayloadDefault.config, useElderJsPluginImages: true },
    });
    const internal = pluginOutput.internal as ElderjsPluginInternal;
    const markdownOuput = internal.markdown[pluginPayloadDefault.config.routes[0]][0];
    await markdownOuput.compileHtml();
    expect(markdownOuput.html).toContain('<div class="md-img">');
  });

  it('config.contents test', async () => {
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayloadDefault,
      settings: { ...pluginPayloadDefault.settings, rootDir: process.cwd() },
      config: {
        ...pluginPayloadDefault.config,
        contents: {
          blog: './test/fixtures/contents',
        },
      },
    });
    const internal = pluginOutput.internal as ElderjsPluginInternal;

    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(pluginPayload.settings.srcDir).toBeDefined();
    expect(internal.markdown[pluginPayload.config.routes[0]]).toHaveLength(1);
    expect(markdownOutput.slug).toEqual(gettingStartedOutput.slug);
    expect(markdownOutput.frontmatter).toEqual(gettingStartedOutput.frontmatter);
    await markdownOutput.compileHtml();
    expect(markdownOutput.html).toEqual(gettingStartedOutput.html);
    expect(markdownOutput.data).toEqual({});
  });

  it('config.contents error', async () => {
    pluginPayload.settings.rootDir = __dirname;

    await expect(
      plugin.init({
        ...pluginPayload,
        config: { ...pluginPayload.config, contents: { blog: 'thisfolderdoesnotexist' } },
      }),
    ).rejects.toThrow(Error);
  });

  it('config.slugFormatter', async () => {
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayloadDefault,
      config: {
        ...pluginPayloadDefault.config,
        slugFormatter: (file, frontmatter) =>
          `${file.replace('.md', `-${frontmatter.author}`)}`.toLowerCase().replace(/\s/g, '-'),
      },
    });
    const internal = pluginOutput.internal as ElderjsPluginInternal;
    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(markdownOutput.slug).toEqual('getting-started-nick-reese');
  });

  it('config.slugFormatter allows empty slug (index)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plugin.config.slugFormatter = (_file, _frontmatter) => '';
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayload,
      config: {
        ...pluginPayload.config,
        slugFormatter: (file, frontmatter) => '',
      },
    });
    const internal = pluginOutput.internal as ElderjsPluginInternal;
    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(markdownOutput.slug).toEqual('');
  });
});
