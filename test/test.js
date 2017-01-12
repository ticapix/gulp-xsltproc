const assert = require('assert');
const path = require('path');
const xsltproc = require(path.join('..', 'src'));
const gulp = require('gulp');
const map = require('map-stream');

const fixtures_path = path.join(__dirname, 'fixtures');

describe('gulp-xsltproc', function() {
	describe('failure', () => {
		it('should fail if binary not available', () => {
			assert.throws(() => xsltproc({xsltproc_path: '/'}), Error);
		});
	});
	describe('transform', () => {
		it('check files are processed (warning as warning)', () => {
			let input = [];
			let output = [];
			return new Promise((resolve, reject) => {
				gulp.src(path.join(fixtures_path, '**', '*.xml'))
				.pipe(map((file, done) => {
					input.push(path.relative(fixtures_path, file.path));
					done(null, file);
				}))
				.pipe(xsltproc({warning_as_error: false}))
				.pipe(map((file, done) => {
					output.push(path.relative(fixtures_path, file.path));
					done(null, file);
				}))
				.on('end', () => {
					assert.equal(2, input.filter(elt => elt.endsWith('.xml')).length);
					assert.equal(2, output.filter(elt => elt.endsWith('.xml')).length);
					assert.equal(2, output.filter(elt => elt.endsWith('.xml.json')).length);
					assert.equal(4, output.length);
					resolve();
				});
			});
		});
		it('check files are processed (warning as error)', () => {
			return new Promise((resolve, reject) => {
				gulp.src(path.join(fixtures_path, '**', '*.xml'))
				.pipe(xsltproc().on('error', (error) => {
					assert.notEqual(error.message.indexOf('warning: failed to load external entity'), -1);
					assert.notEqual(error.message.indexOf('fakefile.dtd'), -1);
					resolve();
				}));
			});
		});
		it('do not generate metadata', () => {
			let output = [];
			return new Promise((resolve, reject) => {
				gulp.src(path.join(fixtures_path, 'page.xml'))
				.pipe(xsltproc({metadata: false}))
				.pipe(map((file, done) => {
					output.push(path.relative(fixtures_path, file.path));
					done(null, file);
				}))
				.on('end', () => {
					assert.deepEqual(output, ['page.xml']);
					resolve();
				});
			});
		});

	});
});
