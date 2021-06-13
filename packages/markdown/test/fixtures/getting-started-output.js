const gettingStartedOutput = {
  slug: 'getting-started',
  frontmatter: {
    title: 'Getting Started with Elder.js',
    excerpt: 'You have the starter template of Elder.js running. So what is next? This guide will help you explore the project.',
    date: '2020-03-16T05:35:07.322Z',
    author: 'Nick Reese'
  },
  html: "<p>Sweet! So you've got the Elder.js starter template up and running. What's next?</p>\n" +
    '<p><img src="/images/dummy_image.png" alt="dummy-image"></p>\n' +
    '<h2 id="4-routes-to-explore">4 Routes To Explore</h2>\n' +
    "<p>This project is structured to follow the required Elder.js folder structure which you can see below, but in short you've got several routes in the <code>./src/routes/</code> folder.</p>\n" +
    '<pre><code class="language-javascript">{\n' +
    " hook: 'data',\n" +
    " name: 'maliciousHook',\n" +
    " description: 'Can we break anything?',\n" +
    ' priority: 1, // this will be called last\n' +
    ' run: async ({ helpers, data, settings, request, query }) => {\n' +
    '   settings = null;\n' +
    '   request = null;\n' +
    '   helpers = null;\n' +
    '   query = null;\n' +
    '\n' +
    '   return { settings, request, query, helpers }\n' +
    ' },\n' +
    '},\n' +
    '</code></pre>\n',
  data: {}
}

module.exports = gettingStartedOutput;
