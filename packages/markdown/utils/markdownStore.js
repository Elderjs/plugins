const fs = require('fs');

function compileImage(md, openPattern, closePattern) {
  // replace md images if image plugin is being used
  const MDImgRegex = /!\[([A-Za-z-_ \d]*)\]\(([^)]*)\)/gm;
  let match;
  const result = [];
  let lastIndex = 0;
  while ((match = MDImgRegex.exec(md)) !== null) {
    const [, alt, src] = match;
    result.push(
      md.slice(lastIndex, match.index),
      `<div class="md-img">${openPattern}picture alt="${alt}" src="${src}" /${closePattern}</div>`,
    )
    lastIndex = MDImgRegex.lastIndex;
  }
  result.push(md.slice(lastIndex));
  return result.join('');
}

function createMarkdownStore({
  root,
  file,
  slug,
  shortcodes: {
    openPattern = '{{',
    closePattern = '/}}'
  } = {},
  parser,
  useImagePlugin = false,
  preserveFolderStructure = false
}) {
  let source;
  const ret = {
    slug: null,
    frontmatter: null,
    html: null,
    data: null,

    prepareSlug,
    prepareHtml
  };
  return ret;

  async function prepareSlug() {
    if (ret.slug != null) return;

    await prepareFrontMatter();

    let result;
    const relativePath = file.replace(`${root}/`, '');
    if (slug && typeof slug === 'function') {
      result = slug(relativePath, ret.frontmatter);
    }
    if (typeof result !== 'string') {
      if (ret.frontmatter.slug) {
        result = ret.frontmatter.slug;
      } else {
        result = preserveFolderStructure ? relativePath : file.split('/').pop();
        result = result.replace('.md', '').replace(/ /gim, '-');
      }
    }
    ret.slug = result;
  }

  async function prepareFrontMatter() {
    if (ret.frontmatter) return;
    await prepareSource();
    const header = source.match(/\s*^---[^\S\r\n]*\r?\n[\s\S]*?^---[^\S\r\n]*\r?(\n|$)/ym)?.[0];
    if (!header) {
      ret.frontmatter = {};
      return;
    }
    const result = await parser.process(header);
    ret.frontmatter = result.data.frontmatter || {};
  }

  async function prepareSource() {
    if (source != null) return;
    source = fs.readFileSync(file, 'utf-8');
  }

  async function prepareHtml() {
    if (ret.html != null) return;

    await prepareSource();

    if (useImagePlugin) {
      source = compileImage(source, openPattern, closePattern);
    }

    const result = await parser.process(source);
    source = null;
    ret.html = result.contents;
    ret.frontmatter = result.data.frontmatter || {};
    delete result.data.frontmatter;
    ret.data = result.data;
  }
}
module.exports = createMarkdownStore;
