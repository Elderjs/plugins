const fs = require('fs');
const path = require('path');

function compileImage(md, openPattern = '{{', closePattern = '}}') {
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
    );
    lastIndex = MDImgRegex.lastIndex;
  }
  result.push(md.slice(lastIndex));
  return result.join('');
}

async function createMarkdownStore({
  root,
  file,
  slug,
  shortcodes: { openPattern, closePattern } = {},
  parser,
  useImagePlugin = false,
  preserveFolderStructure = false,
}) {
  const ret = {
    slug: null,
    frontmatter: null,
    html: null,
    data: null,
    compileHtml,
  };

  let source = fs.readFileSync(file, 'utf-8');
  const matches = source.match(/\s*^---[^\S\r\n]*\r?\n[\s\S]*?^---[^\S\r\n]*\r?(\n|$)/my);
  const header = matches && matches[0];
  if (!header) {
    ret.frontmatter = {};
  } else {
    const result = await parser.process(header);
    ret.frontmatter = result.data.frontmatter || {};
  }
  ret.slug = getSlug();
  return ret;

  function getSlug() {
    const relativePath = path.relative(root, file).replace(/\\/g, '/');
    if (slug && typeof slug === 'function') {
      const result = slug(relativePath, ret.frontmatter);
      if (typeof result === 'string') {
        return result;
      }
    }
    if (ret.frontmatter.slug) {
      return ret.frontmatter.slug;
    }
    const fileName = preserveFolderStructure ? relativePath : file.split('/').pop();
    return fileName.replace('.md', '').replace(/ /gim, '-');
  }

  async function compileHtml() {
    if (ret.html != null) return;

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
