const getHeaders = require('../utils/getHeaders');

describe('getHeaders', () => {
  it('Properly Parses and updates the tree', () => {
    const node = require('./fixtures/node.json');
    const headers = require('./fixtures/headers.json');
    const updated = require('./fixtures/updated.json');
    expect(getHeaders(node)).toEqual(headers);
    expect(node).toEqual(updated);
  });
});
