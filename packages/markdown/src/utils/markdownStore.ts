import { readFileSync } from 'fs';
import { relative } from 'path';

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

export type Ret = {
  slug: string | null;

  frontmatter:
    | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | (Record<string, any> & {
        date?: string;
      });
  html: string | null;
  data: unknown | null;
  compileHtml: () => Promise<void>;
};

async function createMarkdownStore({
  root,
  file,
  slug,
  shortcodes: { openPattern, closePattern } = { openPattern: '{{', closePattern: '}}' },
  parser,
  useImagePlugin = false,
  preserveFolderStructure = false,
}) {
  const ret: Ret = {
    slug: null,
    frontmatter: null,
    html: null,
    data: null,
    compileHtml,
  };

  let source = readFileSync(file, 'utf-8');
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
    if (ret.frontmatter.slug) {
      return ret.frontmatter.slug;
    }

    const relativePath = relative(root, file).replace(/\\/g, '/');
    if (slug && typeof slug === 'function') {
      const result = slug(relativePath, ret.frontmatter);
      if (typeof result === 'string') {
        return result;
      }
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

    ret.html = result.value;
    ret.frontmatter = result.data.frontmatter || {};
    delete result.data.frontmatter;
    ret.data = result.data;
  }
}
export default createMarkdownStore;
