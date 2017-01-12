const through = require('through2');
const gutil = require('gulp-util');
const assert = require('assert');
const File = require('vinyl');
const path = require('path');
const xsltproc = require('node-xsltproc');

// plugin created from this tutorial http://www.pixeldonor.com/2014/feb/20/writing-tasks-gulpjs/
// outputing 2 streams like descrided here https://gist.github.com/cecilemuller/40880002c340edaa7e4a

function gulpPlugin(options) {
	options = options || {};
	options.metadata = options.metadata === undefined ? true : options.metadata;
	options.warning_as_error = options.warning_as_error === undefined ? true : options.warning_as_error;
	let processor = xsltproc(options);
	function XsltProcPlugin(file, encoding, done) {
		if (file.contents.indexOf('xml-stylesheet') === -1) {
			console.log('skipping', file.path);
			return done();
		}
		processor.transform(file.path)
		.then((data) => {
			file.contents = new Buffer(data.result);
			if (options.warning_as_error && data.metadata.message !== '') {
				this.emit('error', new gutil.PluginError({
					plugin: 'XsltProc',
					message: `warning transforming ${file.path}\n${data.metadata.message}`
				}));
				return done();
			}
			data.file = path.relative(file.base, file.path);
			let metadata = new File({
				base: file.base,
				path: `${file.path}.json`,
				contents: new Buffer(JSON.stringify(data.metadata))
			});
			this.push(file); // don't move this line higher in the code as value of file changes after that line
			if (options.metadata) {
				this.push(metadata);
			}
			return done();
		})
		.catch((error) => {
			this.emit('error', new gutil.PluginError({
				plugin: 'XsltProc',
				message: `error transforming ${file.path}\n${error.message}`
			}));
			return done();
		});
	}
	return through.obj(XsltProcPlugin);
}

module.exports = gulpPlugin;
