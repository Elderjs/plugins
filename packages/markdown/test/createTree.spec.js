const createTree = require('../utils/createTree');

describe('createTree', () => {
  it('Make a tree from an easy array of h2s', () => {
    const h2s = require('./fixtures/h2s.json');
    expect(createTree(h2s)).toEqual([
      {
        children: [],
        depth: 2,
        i: 0,
        id: 'determining-the-right-type-of-senior-living-facility',
        text: 'Determining The Right Type of Senior Living Facility',
      },
      { children: [], depth: 2, i: 1, id: 'independent-living', text: 'Independent Living' },
      { children: [], depth: 2, i: 2, id: 'assisted-living', text: 'Assisted Living' },
      {
        children: [],
        depth: 2,
        i: 3,
        id: 'home-healthcare-services-assisted-living-alternative',
        text: 'Home Healthcare Services: Assisted Living Alternative',
      },
      { children: [], depth: 2, i: 4, id: 'nursing-homes', text: 'Nursing Homes' },
      { children: [], depth: 2, i: 5, id: 'memory-care-units', text: 'Memory Care Units' },
      {
        children: [],
        depth: 2,
        i: 6,
        id: 'continuing-care-retirement-communities',
        text: 'Continuing Care Retirement Communities',
      },
      { children: [], depth: 2, i: 7, id: 'hospice-care', text: 'Hospice Care' },
      { children: [], depth: 2, i: 8, id: 'putting-it-all-together', text: 'Putting It All Together' },
    ]);
  });

  it('Mixed Page with out of order headers', () => {
    const mixed = require('./fixtures/mixedhs.json');
    expect(createTree(mixed)).toEqual([
      {
        depth: 2,
        i: 0,
        id: 'services-offered-by-assisted-living',
        text: 'Services Offered By ',
        children: [
          { children: [], depth: 4, i: 1, id: 'test-orphan', text: 'test orphan' },
          {
            children: [{ children: [], depth: 4, i: 3, id: 'testing-more', parent: true, text: 'Testing more' }],
            depth: 3,
            i: 2,
            id: 'testing',
            parent: true,
            text: 'Testing',
          },
        ],
      },
      {
        children: [],
        depth: 2,
        i: 4,
        id: 'costs-and-paying-for-assisted-living',
        text: 'Costs and Paying for Assisted Living',
      },
      {
        children: [],
        depth: 2,
        i: 5,
        id: 'pros-and-cons-of-assisted-living',
        text: 'Pros and Cons of Assisted Living',
      },
    ]);
  });

  it('It parses Elder.js', () => {
    const json = require('./fixtures/elderjs-headers.json');
    const parsed = require('./fixtures/elderjs-parsed.json');
    expect(createTree(json)).toEqual(parsed);
  });
});
