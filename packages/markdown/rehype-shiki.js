// this is a local fork of rehype-shiki, which is unmaintained/out of date
// we want to use shiki (over other syntax highlighers) because it offers html highlighting with NO js or CSS weight concerns

const shiki = require('shiki');
const visit = require('unist-util-visit');

module.exports = (options) => {
  const settings = options || {};
  const theme = settings.theme || 'nord';
  let shikiTheme;

  try {
    shikiTheme = shiki.getTheme(theme);
  } catch (_) {
    try {
      shikiTheme = shiki.loadTheme(theme);
    } catch (_) {
      throw new Error('Unable to load theme: ' + theme);
    }
  }

  const asyncHighlighter = shiki.getHighlighter({
    theme: shikiTheme,
  });

  return async (tree) => {
    const highlighter = await asyncHighlighter;
    visit(tree, 'code', (node) => {
      node.value = highlighter.codeToHtml(node.value, node.lang || 'text');
      node.type = 'html';
    });
    return tree;
  };
};
