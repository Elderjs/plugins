# Elder.js Plugin: References

Easily add wikipedia style references to your content.

1. Simply wrap references in your content like so: `An amazing fact.{{ref}}References goes here{{/ref}}`.
2. Add `{{referenceList /}}` to your content or add `{@html helpers.shortcode({name: "referenceList"})}` to your Svelte template to display all of the references collected.

> **Example**: See references in action on this post: [https://nicholasreese.com/how-to-generate-more-referrals/](https://nicholasreese.com/how-to-generate-more-referrals/)

## Install

```bash
npm install --save @elderjs/plugin-references
```

## Config

Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/plugin-references` to your plugin object.

```javascript
plugins: {
  '@elderjs/plugin-references': {
    referenceListLabel: 'References: ', // this is the label shown for the reference list.
  }
}
```
