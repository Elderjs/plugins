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
    '<p>Each of these routes are designed to showcase something different.</p>\n' +
    '<ul>\n' +
    '<li><a href="/simple/">Simple</a> - The a simple route with an overview of how routing works in Elder.js.</li>\n' +
    '<li>Home - This is the simple route to illustrate the basic concepts. Open up the <code>./src/routes/home/route.js</code> file and look at how the <code>all</code> and <code>permalink</code> functions work. Then look at the <code>Home.svelte</code> to see what is going on there.</li>\n' +
    "<li>Blog - This route is powered entirely by the <code>@elderjs/plugin-markdown</code> which is configured in your <code>elder.config.js</code>. You can find this page's markdown at <code>./src/routes/blog/getting-started.md</code>. Try duplicating one of the existing markdown files and renaming it. You'll see that the homepage will change next time you build or reload the server.</li>\n" +
    "<li>Hooks - The hooks route illustrates how to add data to a page and the data flow. In the <code>./src/routes/hooks/route.js</code> file you'll see we're importing the hookInterface and then building a page for each hook using the <code>all</code> and <code>permalink</code> functions. Next open up the <code>./src/routes/hooks/route.js</code> and the <code>./src/routes/hooks/Hooks.svelte</code> to see how data is passed from request --> data --> Svelte.</li>\n" +
    '<li><code>dynamic</code> - This is an example of how to use Elder.js in SSR mode to create dynamic experiences.</li>\n' +
    '</ul>\n' +
    "<p>Now that you've got Elder.js up and running let's talk about some customization options.</p>\n" +
    '<h2 id="elderjs-community-discord">Elder.js Community Discord</h2>\n' +
    '<p>Getting started with Elder.js and want to connect with other users? Join us over at the <a href="https://discord.gg/rxc2yh5Pxa">Elder.js channel</a> within the official Svelte discord.</p>\n' +
    '<h2 id="seo-auditing">SEO Auditing</h2>\n' +
    "<p>As you play with this template you'll notice that there is some SEO auditing going on.</p>\n" +
    '<p>Under the hood Elder.js uses <a href="https://github.com/Elderjs/plugins/tree/master/packages/seo-check"><code>@elderjs/plugin-seo-check</code></a> to check each page generated for more than 50 common search engine optimization (SEO) issues.</p>\n' +
    '<p>If for some reason these warnings are to verbose you can adjust the level by editing your <code>./elder.config.js</code> to be:</p>\n' +
    `<pre><code class="language-js">'@elderjs/plugin-seo-check': {\n` +
    "  display: ['errors'], // If the errors are too verbose remove 'warnings'\n" +
    '},\n' +
    '</code></pre>\n' +
    '<p>This will silence some of the more opinionated rules.</p>\n' +
    '<h2 id="how-to-customize-elderjs">How to Customize Elder.js</h2>\n' +
    '<h3 id="plugins">Plugins:</h3>\n' +
    '<p>Currently this template is running two plugins:</p>\n' +
    '<ul>\n' +
    '<li><code>@elderjs/plugin-markdown</code> to help us parse markdown files, generate pages, and make them available within Elder.js.</li>\n' +
    '<li><code>@elderjs/plugin-browser-reload</code> to reload the browser when in dev server mode.</li>\n' +
    '</ul>\n' +
    '<p>If you are looking for other plugins check out these:</p>\n' +
    '<ul>\n' +
    '<li><a href="https://github.com/Elderjs/plugins/tree/master/packages/images">Images</a> Easily add and manage responsive images with your Elder.js website.</li>\n' +
    '<li><a href="https://github.com/Elderjs/plugins/tree/master/packages/critical-path-css">Critical Path CSS</a> Quickly and easily generate and include critical path css for your Elder.js website.</li>\n' +
    '<li><a href="https://github.com/Elderjs/plugins/tree/master/packages/sitemap">Sitemap</a> Automatically generate the latest sitemap for your Elder.js website on build.</li>\n' +
    '<li><a href="https://github.com/Elderjs/plugins/tree/master/packages/references">References</a> Easily add wikipedia style references to your content with <code>ref</code> and <code>referenceList</code> shortcodes.</li>\n' +
    '<li><a href="https://github.com/kiuKisas/elderjs-plugin-i18n">i18n</a> Easily add internationalization to your Elder.js website.</li>\n' +
    '</ul>\n' +
    '<p>If you want to share an idea for a plugin or want to help develop an Elder.js plugin, check out <a href="https://github.com/Elderjs/elderjs/discussions/categories/plugin-ideas">Plugin Ideas</a> discussion on the Elder.js repo.</p>\n' +
    '<h3 id="hooks-customize-and-control-elderjs">Hooks: Customize and Control Elder.js:</h3>\n' +
    "<p>Once you've explored the templates above, it is worth looking a bit at how the hooks work.</p>\n" +
    '<p>Open up the <code>./src/hooks.js</code> file and look at the hooks this project uses.</p>\n' +
    "<p>You'll see there are a few hooks in there.</p>\n" +
    "<p>If you uncomment the hook with the name of <code>compressHtml</code> and reload this page, you'll see that the html is now compressed... but the code blocks are broken. (they always say don't compress html with regex!).</p>\n" +
    '<p>In plain english, this hook takes the <code>htmlString</code>, modifies it (compresses it), and returns it.</p>\n' +
    "<p>Now that you see the power of hooks, let's have you add your first hook which illustrates how you'd add analytics code to every page of your site.</p>\n" +
    '<p>Copy and paste the hook below into your <code>hooks.js</code> file.</p>\n' +
    '<pre><code class="language-javascript">  {\n' +
    "    hook: 'stacks',\n" +
    "    name: 'addAnalyticstoFooter',\n" +
    "    description: 'Add analytics to Footer.',\n" +
    '    priority: 1, // we want it to be last\n' +
    '    run: async ({ footerStack }) => {\n' +
    '      footerStack.push({\n' +
    "        source: 'hooks',\n" +
    '        string: `&#x3C;!-- your analytics code here -->`,\n' +
    '        priority: 1,\n' +
    '      });\n' +
    '      return { footerStack }\n' +
    '    },\n' +
    '  },\n' +
    '</code></pre>\n' +
    '<p>If you reload your html, you should see the html comment from the hook.</p>\n' +
    '<p>In this hook we are manipulating a "stack."</p>\n' +
    '<p>Under the hood, Elder.js uses stacks to predictably manage in what order strings are rendered.</p>\n' +
    "<p>In this hook we're just adding our analytics code at a priority of 1 (last).</p>\n" +
    '<p>If stacks seem foreign, just remember they are a list of strings with some meta data.</p>\n' +
    '<h3 id="hooks-in-depth">Hooks In Depth:</h3>\n' +
    "<p>Elder.js runs it's hooks system based on it's 'hookInterface'. This interface defines which hooks can do what and what properties they have.</p>\n" +
    '<p>In building Elder.js we found that if anything can be mutated at anytime, a system quickly gets hard to reason about.</p>\n' +
    "<p>The 'hookInterface' is designed to solve that problem. While you can explore all of the hooks on the homepage, before you go try adding a malicious hook that is designed to corrupt important data during page load.</p>\n" +
    '<p>Add the hook below to your <code>hooks.js</code> file and reload this page:</p>\n' +
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
    '</code></pre>\n' +
    "<p>On reload, if you check the console you'll see that this hook wasn't able to mutate any of the props due to the way the hookInterface is configured.</p>\n" +
    '<p>Essentially only properties that are able to be mutated on a hook, will be mutated on the hook. This helps keep plugins and developers honest and makes maintaining the project in the future easier to reason about. :)</p>\n' +
    `<p>If you're interested in exploring hooks more check out the full <a href="https://elderguide.com/tech/elderjs/">Elder.js documentation on ElderGuide</a>.</p>\n` +
    '<h3 id="a-brief-look-at-shortcodes">A Brief Look At Shortcodes</h3>\n' +
    '<p>Shortcodes are a great way to customize otherwise static content. They are especially useful when using a CMS or external content store. The most common use cases include:</p>\n' +
    '<ol>\n' +
    "<li>You need a placeholder for dynamic content that isn't available when the static content is written.</li>\n" +
    "<li>You want a future proof way of adding 'design flair' to your site.</li>\n" +
    "<li>When you need a dynamic data point that changes often and don't want to go back and update it each time it changes.</li>\n" +
    '</ol>\n' +
    '<p>Here is an example of their power:</p>\n' +
    '<blockquote>\n' +
    '<p>This site has <strong>{{numberOfPages test="this is a sentence" /}}</strong> pages on it.</p>\n' +
    '</blockquote>\n' +
    "<p>If you add another page to this site, you'll see that the number of pages above adjusts accordingly. This dynamic ability is powered via a shortcode which you can see in <code>./src/shortcodes.js</code>.</p>\n" +
    '<p>Usually this sort of customization takes a ton of preprocessing, parsing, etc, but Elder.js handles it all for you. Simply define a shortcode and a function that returns what you want it to be replaced with and Elder.js will handle the rest.</p>\n' +
    '<p><strong>Learning Opportunities:</strong></p>\n' +
    '<ol>\n' +
    "<li>Try using the 'box' shortcode to see how to add design flair.</li>\n" +
    '<li>Think about how you could use a shortcode to fetch data from an external API and how that would add major flexibility to your static content.</li>\n' +
    '<li>Try adding a "Clock" Svelte component to this page. (Details in the <code>./src/shortcodes.js</code>)</li>\n' +
    '</ol>\n' +
    '<p><strong>Out of the Box Usecases</strong></p>\n' +
    '<ol>\n' +
    '<li>Pulling in your latest Tweets or replies to one of your tweets.</li>\n' +
    '<li>You run your own ad platform for your site. You can use a shortcode that hits an external API allowing you render your ads on the server.</li>\n' +
    '<li>You want to embed arbitrary JS on the page (event tracking or something) but only when a shortcode is present. (totally doable)</li>\n' +
    "<li>You need to add <code>ld+json</code> to your head for a specific page, but don't have it wired into the template. You could use a shortcode to do so.</li>\n" +
    '</ol>\n' +
    '<h2 id="elderjs-project-structure">Elder.js Project Structure</h2>\n' +
    '<p>Under the hood Elder.js does quite a bit of magic based on the file structure below but more importantly the <code>rollup.config.js</code> is setup to match this file structure. Since Rollup handles all of the bundling of our Svelte components, we recommend you follow this structure unless you like tinkering with bundlers.</p>\n' +
    '<pre><code>Project Root\n' +
    '| elder.config.js\n' +
    '| package.json\n' +
    '| rollup.config.js\n' +
    '| ... (other common stuff, .gitignore, svelte.config.js... etc)\n' +
    '| -- src\n' +
    '| -- | -- build.js\n' +
    '| -- | -- server.js\n' +
    '| -- | -- hooks.js\n' +
    '| -- | -- shortcodes.js\n' +
    '| -- helpers\n' +
    '| -- | -- index.js\n' +
    '| -- | -- ...\n' +
    '| -- layouts\n' +
    '| -- | -- Layout.svelte\n' +
    '| -- routes\n' +
    "| -- | -- [route] ('blog' in this example)\n" +
    '| -- | -- | -- Blog.svelte\n' +
    '| -- | -- | -- route.js\n' +
    '| -- plugins\n' +
    "| -- | -- [plugin] ('elderjs-plugin-your-plugin' for example)\n" +
    '| -- | -- | -- index.js\n' +
    '| -- components\n' +
    "| -- | -- [component] ('Contact' in this example)\n" +
    '| -- | -- | -- Contact.svelte\n' +
    '\n' +
    '\n' +
    'On this Project:\n' +
    '| -- assets\n' +
    "| -- | -- items to be copied to the 'distDir' defined in your 'elder.config.js'. See hooks.js.\n" +
    '</code></pre>\n' +
    '<h2 id="deploying-elderjs">Deploying Elder.js</h2>\n' +
    '<p>If you are looking to deploy your statically generated Elder.js site <a href="https://developers.cloudflare.com/pages/how-to/elderjs">Cloudflare Pages has a great guide</a>.</p>\n' +
    '<h2 id="customizing-the-css">Customizing The CSS:</h2>\n' +
    '<p>For this template any css in the <code>./src/layouts/Layout.svelte</code> will be made available on all pages. You can also import CSS like we do with the css file at <code>./assets/style.css</code> and that will get added to the CSS file Elder.js generates.</p>\n' +
    '<h2 id="ssr-and-dynamic-experiences">SSR and Dynamic Experiences:</h2>\n' +
    '<p>Elder.js started as a static site generator but today it is used in production as an SSR framework as well.</p>\n' +
    "<p>For more information look at the route found in <code>./src/routes/ssr/</code>. In short, the <code>req</code> and <code>next</code> functions from <code>express</code> or <code>polka</code> (used in this template) are made available there. This means you'll have access to <code>sessions</code> and anything else you'd need to make logged in or otherwise dynamic experiences.</p>\n" +
    '<p>For even more control make sure to checkout the <a href="/middleware/"><code>middleware</code></a> hook.</p>\n' +
    '<h2 id="copying-of-assets">Copying of Assets</h2>\n' +
    "<p>Another hook that you'll see is one that copies anything in your <code>./assets/</code> to the <code>distDir</code> defined in your <code>elder.config.js</code> (which is<code>./public/</code> folder by default in this project).</p>\n",
  data: {}
}

module.exports = gettingStartedOutput;
