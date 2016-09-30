/**
 * @since  2016-09-28
 * @author <k127@gmx.de>
 */

const util     = require('util');
const overpass = require('query-overpass');
const slug     = require('slug');
const sprintf  = require("sprintf-js").sprintf;
const fs       = require('fs');
const wget     = require('wget-improved');
const _progr   = require('cli-progress');
const unzip    = require('unzip');
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
      getSRTMTile(state);
    } else {
      state.peaks.withoutEle.push(state.currentPeak);
    }
  }
  if (state.cfg.verbose > 0) console.log(util.format('Found %d peaks where %d contain elevation information and %d don\'t.',
      state.peaks.raw.features.length, state.peaks.withEle.length, state.peaks.withoutEle.length));
};

var getSRTMTileFilename = function(lat,lon) {return sprintf('%s%02d%s%03d.hgt.zip',lat>=0?'N':'S',lat,lon>=0?'E':'W',lon)};

var getSRTMTile = function(state) {
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
      // maybe just use wget here
      var outputFile = util.format('%s/%s', state.cfg.hgtDir, filename);
      var download = wget.download(url, outputFile);
      if (state.cfg.verbose > 1) var bar = new _progr.Bar();
      if (state.cfg.verbose > 1) bar.start(1, 0);
      download.on('error',    function(err) {console.error('ERROR: ' + err)});
      download.on('start',    function(fileSize) {if (state.cfg.verbose > 1) console.log(fileSize)});
      download.on('progress', function(progress) {if (state.cfg.verbose > 1) bar.update(progress)});
      download.on('end',      function(output) {
        if (state.cfg.verbose > 1) bar.stop();
        state.downloadLock = false;
        if (state.cfg.verbose > 1) console.log(output);
        fs.createReadStream(outputFile).pipe(unzip.Extract({path: state.cfg.hgtDir}));
        // TODO maybe unlink zipfile
        execGRASSCmd('gdalwarp *.hgt srtm_mosaik.tif');
      });
    } else {
      console.log('TODO (A) callGrassWithScript(state)');
    }
  });
};

var execGRASSCmd = function(cmd) {
  var grassCmd = 'export BLA=1 ' +
    'docker run -it --rm -v $(pwd):/data k127/grass -e ' /* ' -c /data/grassdb/here/PERMANENT' */ + cmd;
  exec(grassCmd, function(err, stdout, stderr) {
    console.log(stdout);
    console.error(stderr);
    if (err) console.error('ERROR: ' + err);
  });
};

var exportOSMTags = function() {
  console.error('TODO: exportOSMTags()');  // TODO
};

// main
importOSMNaturalPeak(state);
