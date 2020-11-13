module.exports = function createTree(arr) {
  // purposely mutating objs.
  const indexedTree = arr.map((v, i) => ({ ...v, i }));
  const itl = indexedTree.length;
  function getDepth(depth) {
    const filtered = [];
    let i = 0;
    for (; i < itl; i++) {
      if (indexedTree[i].depth === depth) filtered.push(indexedTree[i]);
    }
    return filtered;
  }
  function getChildren(h, i, siblings, di) {
    const children = [];
    const lower = getDepth(di + 1);
    let ci = 0;
    for (; ci < lower.length; ci++) {
      const c = lower[ci];
      if (c.i > h.i && (siblings[i + 1] ? c.i < siblings[i + 1].i : true)) {
        c.parent = true;
        children.push(c);
      }
    }

    return children;
  }

  let parentArr = [];
  let di = 1;
  while (di <= 5) {
    const current = getDepth(di);
    if (parentArr.length === 0) parentArr = current;
    current.forEach((h, i, siblings) => {
      h.children = getChildren(h, i, siblings, di);
    });
    di += 1;
  }

  // assigns orphans to the header before them.
  const orphans = indexedTree.filter((a) => !a.parent);
  orphans.forEach((o) => {
    const parent = indexedTree[o.i - 1];
    if (parent && parent.depth < o.depth) {
      const spliceIndex = parent.children.findIndex((c) => c.i > o.i);
      if (spliceIndex > -1) {
        parent.children.splice(spliceIndex - 1, 0, o);
      } else {
        parent.children.push(o);
      }
    }
  });

  return parentArr;
};
