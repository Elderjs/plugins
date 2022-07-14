import url from 'url';
import fs from 'fs-extra';

import plugin, { ElderjsMarkdownPluginInternal, bootstrap } from '../src/index.js';
import gettingStartedOutput from './fixtures/getting-started-output.js';
import { SettingsOptions } from '@elderjs/elderjs';
import { describe, it, expect, afterEach } from 'vitest';
import { EventEmitter } from 'stream';
import path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const settings: SettingsOptions = {
  context: 'server',
  origin: 'https://example.com',
  lang: 'en',
  srcDir: process.cwd() + '/test/fixtures',
  distDir: process.cwd() + '/public',
  rootDir: process.cwd() + '',

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /// @ts-ignore
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /// @ts-ignore
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
    files: {
      client: ['string'],
      server: ['string'],
      routes: ['string'],
      hooks: 'string',
      all: ['string'],
      shortcodes: 'string',
      publicCssFile: '/_elderjs/assets/svelte-5029f7ac4396c102400e3ff4538301dc.css',
    },
    watcher: new EventEmitter(),
    production: true,
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

  it('plugin.init() with markdown without frontmatter', async () => {
    pluginPayload.config.routes = ['no-frontmatter'];
    const pluginOutput = await pluginPayloadDefault.init({ ...pluginPayload });

    const helpers = {};
    await bootstrap({ helpers, plugin: pluginOutput, settings });

    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;
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
    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;

    const helpers = {};
    await bootstrap({ helpers, plugin: pluginOutput, settings });

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
    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;

    const helpers = {};
    await bootstrap({ helpers, plugin: pluginOutput, settings });

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
    const pluginOutput = await plugin.init({
      ...pluginPayload,
      config: { ...pluginPayload.config, contents: { blog: 'thisfolderdoesnotexist' } },
    });

    const helpers = {};

    await expect(bootstrap({ helpers, plugin: pluginOutput, settings })).rejects.toThrow(Error);
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
    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;

    const helpers = {};
    await bootstrap({ helpers, plugin: pluginOutput, settings });

    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(markdownOutput.slug).toEqual('getting-started-nick-reese');
  });

  it('config.slugFormatter allows empty slug (index)', async () => {
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayload,
      config: {
        ...pluginPayload.config,
        slugFormatter: (file, frontmatter) => '',
      },
    });
    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;

    const helpers = {};
    await bootstrap({ helpers, plugin: pluginOutput, settings });

    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(markdownOutput.slug).toEqual('');
  });

  it('Parses markdown on the bootstrap hook as expected', async () => {
    const pluginOutput = await pluginPayloadDefault.init(pluginPayload);

    const helpers = {};
    const output = await bootstrap({ helpers, plugin: pluginOutput, settings });

    const internal = pluginOutput.internal as ElderjsMarkdownPluginInternal;

    const markdownOutput = internal.markdown[pluginPayload.config.routes[0]][0];
    expect(internal.markdown[pluginPayload.config.routes[0]]).toHaveLength(1);
    expect(markdownOutput.slug).toEqual(gettingStartedOutput.slug);
    expect(markdownOutput.frontmatter).toEqual(gettingStartedOutput.frontmatter);
    await markdownOutput.compileHtml();
    expect(markdownOutput.html).toEqual(gettingStartedOutput.html);
    expect(markdownOutput.data).toEqual({});

    expect(output.helpers).toBeDefined();
    expect(output.helpers.markdownParser).toBeDefined();
    expect(output.helpers.markdownParser.process).toBeTypeOf('function');
  });

  it('Parses with just the markdown parser helper', async () => {
    const md = `
    ## Putting It All Together

    Now that we’ve summarized all of the options, we wanted to put it all together to paint a full picture of the continuum of care in senior living. The first option many seniors look into may be a traditional retirement community. We really don’t consider these communities to be senior living because the level of services are too low and selection of these communities is based more on the amenities. Below is an overview of the full continuum of care:

    *   *Independent Living*: Independent living is much like staying at home, but residents get the convenience of 3 meals a day and having a maintenance free lifestyle.CCRC’s are the senior living industry’s attempt to allow a senior to enjoy the full continuum of care in a single community. A CCRC’s residents begin their stay in the independent living section and progress as necessary through higher levels of care that follow below.
    *   *Assisted Living*: Assisted living is often very similar to independent living, only these communities provide more supervision and are better suited to assisting residents with activities of daily living and medication management.Home healthcare services are typically an alternative to assisted living for seniors who would prefer to remain in their homes. 
    *   *Nursing Homes*: Nursing homes are the first level of care on the continuum where the decision is likely being driven more by healthcare needs than personal needs.These facilities look more like hospitals and are staffed by licensed nurses. Within nursing homes, they typically have more specialized units such as skilled nursing facilities for rehabilitation and memory care units for caring for residents with Alzheimer’s or dementia.
  `;

    const pluginOutput = await pluginPayloadDefault.init(pluginPayload);

    const helpers = {};
    const output = await bootstrap({ helpers, plugin: pluginOutput, settings });

    expect(await output.helpers.markdownParser.process(md)).toMatchSnapshot();
  });

  it('Parses and includes ToC', async () => {
    const md = fs.readFileSync(path.resolve('./test/fixtures/contents/getting-started.md'), { encoding: 'utf-8' });
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayload,
      config: {
        ...pluginPayload.config,
        useTableOfContents: true,
      },
    });

    const helpers = {};
    const output = await bootstrap({ helpers, plugin: pluginOutput, settings });

    expect(await output.helpers.markdownParser.process(md)).toMatchSnapshot();
  });

  it('Parses with Shiki', async () => {
    const md = fs.readFileSync(path.resolve('./test/fixtures/contents/getting-started.md'), { encoding: 'utf-8' });
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayload,
      config: {
        ...pluginPayload.config,
        useSyntaxHighlighting: {
          theme: 'github-dark-dimmed', // available themes: https://github.com/shikijs/shiki/blob/master/packages/themes/README.md#literal-values
        },
      },
    });

    const helpers = {};
    const output = await bootstrap({ helpers, plugin: pluginOutput, settings });

    expect(await output.helpers.markdownParser.process(md)).toMatchSnapshot();
  });

  it('Parses like on ElderGuide', async () => {
    const md = fs.readFileSync(path.resolve('./test/fixtures/problem-markdown.md'), { encoding: 'utf-8' });
    const pluginOutput = await pluginPayloadDefault.init({
      ...pluginPayload,
      config: {
        ...pluginPayload.config,
        useTableOfContnets: true,
        useSyntaxHighlighting: {
          theme: 'github-dark-dimmed', // available themes: https://github.com/shikijs/shiki/blob/master/packages/themes/README.md#literal-values
        },
      },
    });

    const helpers = {};
    const output = await bootstrap({ helpers, plugin: pluginOutput, settings });

    const result = await output.helpers.markdownParser.process(md);
    console.log(result.value);
    expect(result.data.tocTree).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });
});
