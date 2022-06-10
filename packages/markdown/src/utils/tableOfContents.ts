import createTree from './createTree.js';
import getHeaders from './getHeaders.js';

function tableOfContents() {
  return function transformer(node, file) {
    const headers = getHeaders(node);
    const tocTree = createTree(headers);

    file.data.tocTree = tocTree;

    return;
  };
}
export default tableOfContents;
