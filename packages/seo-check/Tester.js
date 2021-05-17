const cheerio = require('cheerio');

const $attributes = ($, search) => {
  const arr = [];
  $(search).each(function () {
    const namespace = $(this)[0].namespace;
    if (!namespace || namespace.includes('html')) {
      const out = {
        tag: $(this)[0].name,
        innerHTML: $(this).html(),
        innerText: $(this).text(),
      };

      if ($(this)[0].attribs) {
        Object.entries($(this)[0].attribs).forEach((attr) => {
          out[attr[0].toLowerCase()] = attr[1];
        });
      }

      arr.push(out);
    }
  });
  return arr;
};

const emptyRule = {
  name: '',
  description: '',
  success: false,
  errors: [],
  warnings: [],
  info: [],
};

const Tester = function (rules, siteWide = false) {
  this.internalLinks = new Set();
  this.pagesSeen = new Set();

  this.currentUrl = '';

  this.titleTags = new Map();
  this.metaDescriptions = new Map();

  this.currentRule = JSON.parse(JSON.stringify(emptyRule));

  this.results = [];

  const logMetaDescription = (meta) => {
    if (this.metaDescriptions.has(meta)) {
    } else {
      this.metaDescriptions.set(meta, this.currentUrl);
    }
  };

  const logTitleTag = (title) => {
    if (this.titleTags.has(title)) {
    } else {
      this.titleTags.set(title, this.currentUrl);
    }
  };

  const noEmptyRule = () => {
    if (!this.currentRule.name || this.currentRule.name.length === 0) throw Error('No current test name');
    if (!this.currentRule.description || this.currentRule.description.length === 0)
      throw Error('No current test description');
  };

  const runTest = (defaultPriority = 50, arrName) => {
    return (t, ...params) => {
      let test = t;
      let priority = defaultPriority;

      // allows overwriting of priority
      if (typeof test !== 'function') {
        priority = t;
        test = params.splice(0, 1)[0];
      }

      noEmptyRule();
      this.count += 1;
      try {
        return test(...params);
      } catch (e) {
        this.currentRule[arrName].push({ message: e.message, priority });
        return e;
      }
    };
  };

  const tester = {
    test: runTest(70, 'errors'),
    lint: runTest(40, 'warnings'),
  };

  const startRule = ({ validator, test, testData, ...payload }) => {
    if (this.currentRule.errors.length > 0)
      throw Error(
        "Starting a new rule when there are errors that haven't been added to results. Did you run 'finishRule'? ",
      );
    if (this.currentRule.warnings.length > 0)
      throw Error(
        "Starting a new rule when there are warnings that haven't been added to results. Did you run 'finishRule'? ",
      );
    this.currentRule = Object.assign(this.currentRule, payload);
  };
  const finishRule = () => {
    if (this.currentRule.errors.length === 0 && this.currentRule.warnings.length === 0) this.currentRule.success = true;
    this.results.push(this.currentRule);
    this.currentRule = JSON.parse(JSON.stringify(emptyRule));
  };

  return async (html, url) => {
    this.currentUrl = url;
    this.pagesSeen.add(url);

    const $ = cheerio.load(html);

    const result = {
      html: $attributes($, 'html'),
      title: $attributes($, 'title'),
      meta: $attributes($, 'head meta'),
      ldjson: $attributes($, 'script[type="application/ld+json"]'),
      h1s: $attributes($, 'h1'),
      h2s: $attributes($, 'h2'),
      h3s: $attributes($, 'h3'),
      h4s: $attributes($, 'h4'),
      h5s: $attributes($, 'h5'),
      h6s: $attributes($, 'h6'),
      canonical: $attributes($, '[rel="canonical"]'),
      imgs: $attributes($, 'img'),
      aTags: $attributes($, 'a'),
      linkTags: $attributes($, 'link'),
      ps: $attributes($, 'p'),
    };

    if (siteWide) {
      if (result.title[0] && result.title[0].innerText) {
        logTitleTag(result.title[0].innerText);
      }
      const metaDescription = result.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription) {
        logMetaDescription(metaDescription.content);
      }

      result.aTags.filter((a) => !a.href.includes('http')).forEach((a) => this.internalLinks.add(a.href));
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      startRule(rule);
      await rule.validator({ result, response: { url } }, tester);
      finishRule();
    }

    const out = ['errors', 'warnings'].reduce((out, key) => {
      return [
        ...out,
        ...this.results
          .filter((r) => !r.success)
          .sort((a, b) => a.priority > b.priority)
          .reduce((o, ruleResult) => {
            return [...o, ...ruleResult[key].map((r) => ({ ...r, level: key }))];
          }, []),
      ];
    }, []);

    console.table(out);

    this.results = [];
  };
};

// eslint-disable-next-line jest/no-export
module.exports = Tester;

// accept rules one time.
// offer a function that tests all of the rules for a url.
// if in build mode test site wide rules.
