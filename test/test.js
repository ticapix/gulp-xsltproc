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
				gulp.src(path.join(fixtures_path, '**', '{menu,page}.xml'))
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
					assert.strictEqual(2, input.filter(elt => elt.endsWith('.xml')).length);
					assert.strictEqual(2, output.filter(elt => elt.endsWith('.xml')).length);
					assert.strictEqual(2, output.filter(elt => elt.endsWith('.xml.json')).length);
					assert.strictEqual(4, output.length);
					resolve();
				});
			});
		});
		it('check files are processed (warning as error)', () => {
			return new Promise((resolve, reject) => {
				gulp.src(path.join(fixtures_path, '**', 'menu.xml'))
				.pipe(xsltproc().on('error', (error) => {
					assert.notStrictEqual(error.message.indexOf('warning: failed to load external entity'), -1);
					assert.notStrictEqual(error.message.indexOf('fakefile.dtd'), -1);
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
					assert.deepStrictEqual(output, ['page.xml']);
					resolve();
				});
			});
		});
		it('check stringparams', () => {
			return new Promise((resolve, reject) => {
				gulp.src(path.join(fixtures_path, 'params.xml'))
				.pipe(xsltproc({metadata: false, stringparams: {n: '42'}}))
				.pipe(map((file, done) => {
					assert.strictEqual(file.contents.toString(), 'n=42');
					resolve();
				}));
			});
		});
        it('handles custom xslt stylesheets', () => {
            return new Promise((resolve, reject) => {
                const stylesheet = path.join( fixtures_path, 'no-stylesheet.xsl');
                gulp.src(path.join(fixtures_path, 'no-stylesheet.xml'))
                    .pipe(xsltproc({ metadata: false, stylesheet: stylesheet }))
                    .pipe(map((file, done) => {
                        assert.strictEqual(file.contents.toString(), 'CUSTOM_STYLESHEET');
                        resolve();
                    }));
            });
        });
	});
});
