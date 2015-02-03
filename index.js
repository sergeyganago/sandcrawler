/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var core = require('./src/core.js'),
    Scraper = require('./src/scraper.js'),
    StaticEngine = require('./src/engines/static.js');

var sandcrawler = core;

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.0.2'
});

// Public declarations
sandcrawler.staticScraper = function(name) {
  var scraper = new Scraper(name);
  scraper.engine = new StaticEngine(scraper);
  scraper.type = 'static';
  return scraper;
};

sandcrawler.scraper = function(name) {
  var scraper = new Scraper(name);
  scraper.type = 'phantom';
  return scraper;
};

// Exporting
module.exports = sandcrawler;
