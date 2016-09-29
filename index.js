/**
 * @since  2016-09-28
 * @author <k127@gmx.de>
 */

const util     = require('util');
const overpass = require('query-overpass');
const slug     = require('slug');
const GeoJSON  = require('geojson');
const sprintf  = require("sprintf-js").sprintf;
const fs       = require('fs');
const request  = require('request');
const exec     = require('child_process').exec;

var state = {
  bbox:  {n: 47.1, w: 11, s: 47, e: 11.1},
  cfg:   {verbose: 2, saveGeoJSON: true, hgtDir: __dirname + '/geodata'},
  peaks: {raw: {}, withEle: [], withoutEle: []},
  downloadLock: false,
};

var importOSMNaturalPeak = function(state) {
  var overpassQuery = util.format(
    '[out:json];node(%d,%d,%d,%d)[natural=peak];out;',
    state.bbox.s, state.bbox.w, state.bbox.n, state.bbox.e),
    file = slug(overpassQuery);

  overpass(overpassQuery, function(err, data) {
    if (!err) {
      state.peaks.raw = data;
      if (state.cfg.saveGeoJSON) {
        require('jsonfile').writeFile(file + '.json', state.peaks.raw, {spaces: 2}, function(err) {
          console.error('ERROR: jsonfile.writeFile(): ' + err);
        });
      }
      forEachPeak(state);
    } else console.error('ERROR: query_overpass(): ' + err);
  });
};

var isNumeric = function(n) {return !isNaN(parseFloat(n)) && isFinite(n)}

var forEachPeak = function(state) {
  for (var i in state.peaks.raw.features) {
    state.currentPeak = state.peaks.raw.features[i];
    if (isNumeric(state.currentPeak.properties.tags.ele)) {
      state.peaks.withEle.push(state.currentPeak);
      if (state.cfg.verbose > 2) console.log(util.format('%s (ele: %dm, lat: %dN, lon: %dE)',
          state.currentPeak.properties.tags.name,
          state.currentPeak.properties.tags.ele,
          state.currentPeak.geometry.coordinates[1],
          state.currentPeak.geometry.coordinates[0]));
      getSRTMTiles(state);
    } else {
      state.peaks.withoutEle.push(state.currentPeak);
    }
  }
  if (state.cfg.verbose > 0) console.log(util.format('Found %d peaks where %d contain elevation information and %d don\'t.',
      state.peaks.raw.features.length, state.peaks.withEle.length, state.peaks.withoutEle.length));
};

var getSRTMTileFilename = function(lat,lon) {return sprintf('%s%02d%s%03d.hgt.zip',lat>=0?'N':'S',lat,lon>=0?'E':'W',lon)};

var getSRTMTiles = function(state) {
  var lat       = state.currentPeak.geometry.coordinates[1],
      lon       = state.currentPeak.geometry.coordinates[0],
      continent = 'Eurasia',  // FIXME
      urlFmt    = 'http://dds.cr.usgs.gov/srtm/version2_1/SRTM3/%s/%s',
      filename  = getSRTMTileFilename(lat, lon),
      filepath  = util.format('%s/%s', state.cfg.hgtDir, filename);
  // check cache / target dir
  // TODO we need some download queue within the state
  fs.access(filepath, fs.F_OK, function(err) {
    if (err && state.downloadLock !== true) {  // download
      state.downloadLock = true;
      var url = util.format(urlFmt, continent, filename);
      if (state.cfg.verbose > 1) console.log(util.format('Downloading SRTM tile %s ...', filename));
      // TODO maybe just use wget here
      request(url, function (err, resp, body) {
        state.downloadLock = false;
        if (state.cfg.verbose > 1) console.log(util.format('   done with %s.', filename));
        if (!err && resp.statusCode == 200) {
          // FIXME zipfile corrupt.
          fs.writeFile(filepath, body, function(err) {
            // TODO validate zipfile
            if (!err) {
              // TODO callGrassWithScript(state);
            } else console.error('ERROR: fs.writeFile(): ' + err);
          });
        } else console.error(util.format('ERROR %d: request(): %s', resp.statusCode, err));
      });
    } else {
      // TODO callGrassWithScript(state);
    }
  });
};

var callGrassWithScript = function() {
  console.error('TODO: callGrassWithScript()');  // TODO
  // see: http://stackoverflow.com/a/20643568/211514
  // TODO provide actual script
  var grassCmd = 'docker run -it --rm -v $(pwd):/data k127/grass -c /data/grassdb/here/PERMANENT';
  exec(grassCmd, function(err, stdout, stderr) {
    // command output is in stdout
  });
};

var exportOSMTags = function() {
  console.error('TODO: exportOSMTags()');  // TODO
};

// main
importOSMNaturalPeak(state);
