import { remark } from 'remark';

type PrepareMarkdownParserReturn = ReturnType<typeof remark>;

function prepareMarkdownParser(remarkPlugins: unknown[] | unknown[][] = []): PrepareMarkdownParserReturn {
  const processor = remark();

  if (remarkPlugins.length === 0) {
    console.warn(
      `elderjs-plugin-markdown: Warning, no remarkPlugins defined. Markdown parsing will probably not turn out as expected.`,
    );
  }

  remarkPlugins
    .filter((plugin) => !!plugin)
    .forEach((plugin: unknown | unknown[]) => {
      if (Array.isArray(plugin)) {
        processor.use(plugin[0], plugin[1]);
      } else {
        processor.use(plugin);
      }
    });

  return processor;
}

export default prepareMarkdownParser;
