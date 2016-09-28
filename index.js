/**
 * @since  2016-09-28
 * @author <k127@gmx.de>
 */

const util     = require('util');
const overpass = require('query-overpass');
const slug     = require('slug');
const GeoJSON  = require('geojson');
const exec     = require('child_process').exec;

var state = {
  bbox:  {n: 47.1, w: 11, s: 47, e: 11.1},
  cfg:   {verbose: true, saveGeoJSON: true},
  peaks: {raw: {}, withEle: [], withoutEle: []},
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
    var peak = state.peaks.raw.features[i];
    if (isNumeric(peak.properties.tags.ele)) {
      state.peaks.withEle.push(peak);
      if (state.cfg.verbose) {
        console.log(util.format('%s (%dm)', peak.properties.tags.name, peak.properties.tags.ele));
      }
    } else {
      state.peaks.withoutEle.push(peak);
    }
    // TODO getSRTMTiles(state);
  }
  if (state.cfg.verbose) {
    console.log(util.format('Found %d peaks where %d contain elevation information and %d don\'t.',
      state.peaks.raw.features.length, state.peaks.withEle.length, state.peaks.withoutEle.length));
  }
};

var getSRTMTiles = function() {
  console.error('TODO: getSRTMTiles()');  // TODO
}

var callGrassWithScript = function() {
  console.error('TODO: callGrassWithScript()');  // TODO
  // see: http://stackoverflow.com/a/20643568/211514
  // TODO provide actual script
  var grassCmd = 'docker run -it --rm -v /home/k/github-projects/osm-dominance-tagger:/data geodata/grass -c /data/grassdb/here/PERMANENT';
  exec(grassCmd, function(err, stdout, stderr) {
    // command output is in stdout
  });
};

var exportOSMTags = function() {
  console.error('TODO: exportOSMTags()');  // TODO
};

// main
importOSMNaturalPeak(state);
