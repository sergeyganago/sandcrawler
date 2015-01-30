/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util'),
    request = require('request'),
    artoo = require('artoo-js'),
    cheerio = require('cheerio');

// Plug into cheerio
// TODO
artoo.bootstrap(cheerio);
artoo.helpers.isSelector = function(v) {
  return v instanceof cheerio;
};

/**
 * Main Class
 */
function StaticScraper(name) {
  var self = this;

  // New safeguard
  if (!(this instanceof StaticScraper))
    return new StaticScraper(name);

  // Extending
  Scraper.call(this, name);

  // Hidden properties
  this._parser = null;

  // Listerning
  this.on('job:scrape', function(job) {
    request(job.req.url, function(err, response, body) {

      // Dispatching error if any
      if (err) return self.emit('job:fail', err, job);

      // Overloading job's response
      job.res.body = body;
      job.res.status = response.statusCode;

      // Status error
      if (response.statusCode >= 400) {
        var error = new Error('status-' + (response.statusCode || 'unknown'));
        error.status = response.statusCode;
        return self.emit('job:fail', error, job);
      }

      // Do parsing
      if (self._parser) {
        var $ = cheerio.load(job.res.body);
        job.res.data = self._parser.call(self, $, artoo);
      }

      self.emit('job:after', job);
    });
  });
}

// Inheriting
util.inherits(StaticScraper, Scraper);

/**
 * Prototype
 */
StaticScraper.prototype.parse = function(fn) {
  if (this._parser)
    throw Error('sandcrawler.scraper.parse: parser already registered.');

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.parse: given argument is not a function.');

  this._parser = fn;

  return this;
};

/**
 * Exporting
 */
module.exports = StaticScraper;