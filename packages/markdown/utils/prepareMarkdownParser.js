const remark = require('remark');

function prepareMarkdownParser(remarkPlugins = []) {
  const processor = remark();

  if (remarkPlugins.length === 0) {
    console.warn(
      `elderjs-plugin-markdown: Warning, no remarkPlugins defined. Markdown parsing will probably not turn out as expected.`,
    );
  }

  remarkPlugins
    .filter((plugin) => !!plugin)
    .forEach((plugin) => {
      if (Array.isArray(plugin)) {
        processor.use(...plugin);
      } else {
        processor.use(plugin);
      }
    });

  return processor;
}

module.exports = prepareMarkdownParser;
exports.default = prepareMarkdownParser;
