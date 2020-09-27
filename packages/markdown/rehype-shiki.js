// this is a local fork of rehype-shiki, which is unmaintained/out of date
// we want to use shiki (over other syntax highlighers) because it offers html highlighting with NO js or CSS weight concerns

const shiki = require('shiki');
const visit = require('unist-util-visit');
const hastToString = require('hast-util-to-string');
const u = require('unist-builder');

module.exports = attacher;

function attacher(options) {
  let settings = options || {};
  let theme = settings.theme || 'nord';
  let useBackground = typeof settings.useBackground === 'undefined' ? true : Boolean(settings.useBackground);
  let shikiTheme;
  let highlighter;

  try {
    shikiTheme = shiki.getTheme(theme);
  } catch (_) {
    try {
      shikiTheme = shiki.loadTheme(theme);
    } catch (_) {
      throw new Error('Unable to load theme: ' + theme);
    }
  }

  return transformer;

  async function transformer(tree) {
    highlighter = await shiki.getHighlighter({
      theme: shikiTheme,
    });
    visit(tree, 'element', visitor);
  }

  function visitor(node, index, parent) {
    if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
      return;
    }

    if (useBackground) {
      addStyle(parent, 'background: ' + shikiTheme.bg);
    }

    const lang = codeLanguage(node);

    if (!lang) {
      // Unknown language, fall back to a foreground colour
      addStyle(node, 'color: ' + shikiTheme.settings.foreground);
      return;
    }

    const tokens = highlighter.codeToThemedTokens(hastToString(node), lang);
    const tree = tokensToHast(tokens);

    node.children = tree;
  }
}

function tokensToHast(lines) {
  let tree = [];

  for (const line of lines) {
    if (line.length === 0) {
      tree.push(u('text', '\n'));
    } else {
      for (const token of line) {
        tree.push(
          u(
            'element',
            {
              tagName: 'span',
              properties: { style: 'color: ' + token.color },
            },
            [u('text', token.content)],
          ),
        );
      }

      tree.push(u('text', '\n'));
    }
  }

  // Remove the last \n
  tree.pop();

  return tree;
}

function addStyle(node, style) {
  let props = node.properties || {};
  let styles = props.style || [];
  styles.push(style);
  props.style = styles;
  node.properties = props;
}

function codeLanguage(node) {
  const className = node.properties.className || [];
  let value;

  for (const element of className) {
    value = element;

    if (value.slice(0, 9) === 'language-') {
      return value.slice(9);
    }
  }

  return null;
}
