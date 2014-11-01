/**
 * Sandcrawler Runtime Plugin
 * ===========================
 *
 * This fundamental plugin takes care of the abstract scraper's runtime.
 */
var async = require('async'),
    _ = require('lodash');

module.exports = function(callback) {

  return function(scraper) {
    var self = scraper;

    // Before scraper execution hook
    scraper.once('scraper:before', function() {

      // Applying before middlewares
      async.applyEachSeries(
        this._middlewares.before,
        function(err) {

          // If an error occured, the scraper failed
          if (err)
            return self.emit('scraper:fail', err);

          // Otherwise, we start
          self.emit('scraper:start');
        }
      );
    });

    // Scraper will now start
    this.once('scraper:start', function() {
      var limit = Math.min(this.settings.maxConcurrency, this._jobs.length || 1);

      for (var i = 0; i < limit; i++)
        this._nextJob();
    });

    // Before job hook
    scraper.on('job:before', function(job) {

      // Applying beforeScraping middlewares
      async.applyEachSeries(
        this._middlewares.beforeScraping,
        job.req,
        function(err) {
          // TODO: handle error

          // If the scraper is paused, we delay the job
          if (self.state.paused)
            return self.once('scraper:resume', function() {
              self.emit('job:scrape', job);
            });

          // Otherwise we start scraping
          self.emit('job:scrape', job);
        }
      );
    });

    // After job hook
    scraper.on('job:after', function(job) {

      // Applying afterScraping middlewares
      async.applyEachSeries(
        this._middlewares.afterScraping,
        job.req,
        job.res,
        function(err) {
          if (err)
            return self.emit('job:fail', err, job);

          self.emit('job:success', job);
        }
      );
    });

    // Emitting job:end event
    // NOTE: those emitters must be registered last because job:end alters
    // the stack itself
    this.on('job:fail', function(err, job) {
      this.emit('job:end', job);
    });

    this.on('job:success', function(job) {
      this.emit('job:end', job);
    });

    // On job end, we advance
    scraper.on('job:end', function(job) {

      // If retrying, we skip to the next job
      if (job.state.retrying)
        return this._nextJob();

      // A job has been done, we increment the count
      this._doneCount++;

      // Removing page from stack
      var idx = _.findIndex(this._stack, function(e) {
        return e.id === job.id;
      });

      // If the job is failing, we add it to the remains
      if (job.state.failing)
        this._remains.push(job.original);

      this._stack.splice(idx, 1);
      this._nextJob(job);
    });

    // Listening to scraper ending
    scraper.once('scraper:fail', function(err) {
      callback(err, this._remains);
    });

    scraper.once('scraper:success', function() {
      callback(null, this._remains);
    });
  };
};
