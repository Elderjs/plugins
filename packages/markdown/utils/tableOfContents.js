function getTextChild(node) {
  let textChild = node.children.find((c) => c.type === 'text');
  if (!textChild) {
    textChild = node.children.reduce((out, cv) => {
      if (out) return out;
      let sub = getTextChild(cv);
      if (sub) return sub;
      return out;
    }, false);
  }
  return textChild;
}

function getTocTree(headers) {
  const tree = headers.reduce((out, cv) => {
    const textChild = getTextChild(cv);
    if (!textChild) {
      console.log(cv.children);
    }
    out.push({ depth: cv.depth, text: textChild.value, id: cv.data.id });
    return out;
  }, []);
  return tree;
}

function getChildHeaders(node) {
  return node.children.filter((n) => n.type === 'heading');
}

function parseTocTree(tree) {
  const { html } = tree.reduce(
    (out, cv, i, arr) => {
      if (cv.depth < out.depth) {
        // bug where depth goes from h4 to h2
        out.html += '</ul>';
        out.depth = cv.depth;
        out.openLists -= 1;
      } else if (cv.depth > out.depth) {
        out.html += '<ul class="toc">';
        out.depth = cv.depth;
        out.openLists += 1;
      }
      out.html += `<li class="toc-item"><a href="#${cv.id}">${cv.text}</a></li>`;
      if (i === arr.length - 1) {
        while (out.openLists > 0) {
          out.html += `</ul>`;
          out.openLists -= 1;
        }
      }

      return out;
    },
    { html: '', depth: 0, openLists: 0 },
  );

  return `<nav id="table-of-contents">${html}</nav>`;
}

function tableOfContents() {
  return function transformer(node, file) {
    const headers = getChildHeaders(node);
    const tocTree = getTocTree(headers);
    const tocHtml = parseTocTree(tocTree);

    file.data.tocTree = tocTree;
    file.data.tocHtml = tocHtml;

    return;
  };
}
module.exports = tableOfContents;
