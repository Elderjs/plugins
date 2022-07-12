import type { Ret } from './markdownStore.js';

export default (md: Ret) => md?.frontmatter?.draft || md?.slug?.startsWith('draft-');
