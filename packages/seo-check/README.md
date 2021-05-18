# Elder.js Plugin: SEO Check

Checks the generated HTML for common SEO issues along with tips.

**ALPHA**

## Working Checks

### Canonical

-[x] canonical tag exists -[x] canonical tag matches `request.permalink`

### Title Tag

-[x] Title tag exists -[x] Title tag `innerText` and `innerHTML` are the same. (no html tags in your title tag) -[x] Only one title tag per page -[x] Title tag is less than 70 chars -[x] Title tag is more than 10 chars -[x] Title doesn't include common stopwords. -[x] Title tag doesn't have `null` -[x] Title tag doesn't have `undefined`

### Meta Description

-[x] meta description exists -[x] only one meta description tag per page -[x] Meta description doesn't have `null` -[x] Meta description doesn't have `undefined` -[x] Meta description is longer than 10 chars -[x] Meta description is less than than 120 chars -[x] Meta description is longer than 300 chars (sometimes things go REALLY wrong and this helps catch it.) -[x] Meta description includes ~20% of the keywords of the title tag. (useful in my experience.)

### HTags

-[x] h1 Exists on page -[x] only a single h1 per page. -[x] h1 has 10% of the words in the title tag -[x] h1 is less than 70 chars -[x] h1 is more than than 10 chars -[x] H2 or H3 don't exist if an H1 is missing. -[x] H2 exists on the page -[x] h2 is less than 100 chars -[x] h2 is more than than 10 chars -[x] At least one of your h2s contains a single word from your title tag. -[x] h3 is less than 100 chars -[x] h3 is more than than 10 chars -[x] h4 is less than 100 chars -[x] h4 is more than than 10 chars -[x] If no h2s checks for h3s. -[x] If no h3s checks for h4s. -[x] If no h4s checks for h5s. -[x] If no h5s checks for h6s.

### Images

-[x] Checks images for alt tags.

### Links

- [x] Internal links are lowercase
- [x] Internal links have trailing slash
- [x] Internal links are not `nofollow`
- [x] Notifies if there are more than 50 outbound links on the page.

### Misc

-[x] Checks for `width=device-width, initial-scale=1.0` meta viewport.

## Install

```bash
npm install --save @elderjs/plugin-seo-check
```

## Config

Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/seo-check` to your plugin object.

```javascript
plugins: {
  '@elderjs/plugin-seo-check': {
  },

}
```
