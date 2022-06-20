// this is a local fork of rehype-shiki, which is unmaintained/out of date
// we want to use shiki (over other syntax highlighers) because it offers html highlighting with NO js or CSS weight concerns

import * as shiki from 'shiki';
import { visit } from 'unist-util-visit';

export default (options) => {
  const settings = options || {};
  const theme = settings.theme || 'nord';

  const asyncHighlighter = shiki.getHighlighter({
    theme,
  });
  return async (tree) => {
    const highlighter = await asyncHighlighter;
    visit(tree, 'code', (node) => {
      node.value = highlighter.codeToHtml(node.value, node.lang || 'js');
      node.type = 'html';
    });
    return tree;
  };
};
