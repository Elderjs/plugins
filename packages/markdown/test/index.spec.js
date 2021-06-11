const plugin = require('../index');
const gettingStartedOutput = require('./fixtures/getting-started-output');

beforeEach(() => {
  // for test we need to define necessary plugin property manually
  plugin.settings = {};
  plugin.settings.srcDir = __dirname;
  plugin.settings.shortcodes = { closePattern: '}}', openPattern: '{{' };
  plugin.config.routes = ['blog']
  plugin.settings.plugins = {}
});

describe(`index.init()`,  () => {
  it('have defined property', () => {
    expect(plugin.name).toBeDefined();
    expect(plugin.description).toBeDefined();
    expect(plugin.init).toBeDefined();
    expect(plugin.hooks.length).toBeGreaterThan(0);
    expect(plugin.config).toBeDefined();
    expect(plugin.settings).toBeDefined();
    expect(plugin.settings.srcDir).toBeDefined();
    expect(plugin.settings.shortcodes).toBeDefined();
  });

  it('plugin.init() standard output formatting', async () => {
    const pluginOutput = await plugin.init(plugin);
    const markdownOutput = pluginOutput.markdown[plugin.config.routes[0]][0];
    expect(pluginOutput.markdown[plugin.config.routes[0]].length).toBe(1);
    expect(markdownOutput.slug).toEqual(gettingStartedOutput.slug);
    expect(markdownOutput.frontmatter).toEqual(gettingStartedOutput.frontmatter);
    expect(markdownOutput.html).toEqual(gettingStartedOutput.html);
    expect(markdownOutput.data).toEqual({})
  });

  it('@elderjs/plugin-images output', async () => {
    plugin.settings.plugins = { '@elderjs/plugin-images': {} }
    plugin.config.useElderJsPluginImages = true;
    const pluginOutput = await plugin.init(plugin);
    const markdownOuput = pluginOutput.markdown[plugin.config.routes[0]][0];
    expect(markdownOuput.html).toContain('<div class="md-img">');
  });

  it('config.contents test', async () => {
    plugin.settings.rootDir = __dirname;
    plugin.config.contents = {
      blog: 'contents'
    }
    const pluginOutput = await plugin.init(plugin);
    const markdownOutput = pluginOutput.markdown[plugin.config.routes[0]][0];
    expect(plugin.settings.srcDir).toBeDefined();
    // expect(plugin.config.contents).toEqual({ blog: 'contents' });
    expect(pluginOutput.markdown[plugin.config.routes[0]].length).toBe(1);
    expect(markdownOutput.slug).toEqual(gettingStartedOutput.slug);
    expect(markdownOutput.frontmatter).toEqual(gettingStartedOutput.frontmatter);
    expect(markdownOutput.html).toEqual(gettingStartedOutput.html);
    expect(markdownOutput.data).toEqual({});
  });

  it('config.contents error', async () => {
    plugin.settings.rootDir = __dirname;
    plugin.config.contents = {
      blog: 'thisfolderdoesnotexist'
    }
    await expect(plugin.init(plugin)).rejects.toThrow(Error);
  });
});
