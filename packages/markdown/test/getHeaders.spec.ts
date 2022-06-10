import fs from 'fs-extra';
import path from 'path';
import { describe, it, expect } from 'vitest';
import getHeaders from '../src/utils/getHeaders.js';

describe('getHeaders', () => {
  it('Properly Parses and updates the tree', () => {
    const node = fs.readJsonSync(path.resolve('./test/fixtures/node.json'));
    const headers = fs.readJsonSync(path.resolve('./test/fixtures/headers.json'));
    const updated = fs.readJsonSync(path.resolve('./test/fixtures/updated.json'));
    expect(getHeaders(node)).toEqual(headers);
    expect(node).toEqual(updated);
  });
});
