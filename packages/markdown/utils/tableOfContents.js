const createTree = require('./createTree');
const getHeaders = require('./getHeaders');

function tableOfContents() {
  return function transformer(node, file) {
    const headers = getHeaders(node);
    const tocTree = createTree(headers);

    file.data.tocTree = tocTree;

    return;
  };
}
module.exports = tableOfContents;
