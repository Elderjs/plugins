const rehype = require('rehype');
const rehypeSlug = require('rehype-slug');
const toString = require('hast-util-to-string');
const visit = require('unist-util-visit');

const htmlParser = rehype()
  .data({ settings: { fragment: true } })
  .use(rehypeSlug);

const headerTags = ['h0Placeholder', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function getHtmlHeadings(tree) {
  const headers = [];
  visit(
    tree,
    (node) => node.type === 'element' && headerTags.includes(node.tagName),
    (node) => {
      headers.push({ depth: headerTags.indexOf(node.tagName), text: toString(node), id: node.properties.id });
    },
  );

  return headers;
}

const getHeadingsFromHtml = (node) => {
  const slugifiedHtml = htmlParser.processSync(node.value);
  const htmlSyntaxTree = htmlParser.parse(slugifiedHtml.contents);
  const headings = getHtmlHeadings(htmlSyntaxTree);
  // only if there are headings do we update the content of the mdast
  if (headings.length > 0) {
    node.value = slugifiedHtml.contents;
  }
  return headings;
};

const makeHeadingMd = (node) => {
  return { depth: node.depth, text: toString(node), id: node.data.id };
};

const getHeaders = (tree) => {
  let headers = [];
  visit(
    tree,
    (node) => (node.type === 'html' && node.value && node.value.length > 0) || node.type === 'heading',
    (node) => {
      if (node.type === 'heading') {
        headers.push(makeHeadingMd(node));
      } else if (node.type === 'html') {
        headers = [...headers, ...getHeadingsFromHtml(node)];
      }
    },
  );
  return headers;
};

module.exports = getHeaders;
