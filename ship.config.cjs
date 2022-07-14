const fs = require('fs');
const path = require('path');

module.exports = {
  monorepo: { mainVersionFile: 'lerna.json', packagesToBump: ['packages/*'], packagesToPublish: ['packages/*'] },
  publishCommand: () => 'pnpm publish --tag latest --access public',
  buildCommand: () => 'pnpm run build',
  versionUpdated: ({ version, dir }) => {
    // update lerna.json
    updateJson(dir, 'lerna.json', (json) => {
      json.version = version;
    });

    // update package.json
    updateJson(dir, 'package.json', (json) => {
      json.version = version;
    });
  },
};

const updateJson = (dir, fileName, fn) => {
  const filePath = path.resolve(dir, fileName);
  const json = JSON.parse(fs.readFileSync(filePath).toString());
  fn(json);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
};
