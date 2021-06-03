# Elder.js Plugin: Random

Easily preview a random page of a route by visiting a single url. This plugin should be used exclusively for development.

## What This Plugin Does:

When not running in `process.env.NODE_ENV === 'production'` this plugin does 2 things:

1.  It creates a `/random/` route that lists each of your routes linking to `/random/routeName/`.
2.  It intercepts requests to `/random/routeName/` and randomly serves a page for that route.

## Benefits:

Say that you have a route named `blog` that has 1000 entries. With this plugin you could visit `/random/blog/` and randomly design against any blog page instead of just one as most designers would do.

This is a simplistic example, but when building major sites with 10,000s of pages you'll often encounter scenarios where pages of the same route differ dramatically based on business logic.

By using this plugin, you can design and debug against random pages of a route without having to change the URL.

At <a href="https://elderguide.com">ElderGuide.com</a> we've found this is especially useful when working on a unified design across a route that can vary dramatically.

Having found this useful, it has now become a core part of our development process across all projects.

## Install

```bash
npm install --save @elderjs/plugin-random
```

## Config

```javascript
plugins: {
  '@elderjs/plugin-random': {},
}
```

## Notes:

- When using this plugin with the `@elderjs/plugin-browser-reload` remember that `/random/routeName/` will generate a new page each refresh. This can be annoying when working on CSS issues or thing that require stateful experiences on the front end.
- If you are looking for the REAL url of a page look within `request.permalink` inside your `Layout.svelte` or `RouteName.svelte` files.
