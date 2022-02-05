import path from 'path';

import * as fs from 'fs';
import * as _ from 'lodash';

const WordExtractor = require('word-extractor');
const increment = require('add-filename-increment');

const extractor = new WordExtractor();

const _isUpper = (t: string) => t === _.toUpper(t);

const extract = (folder: string, wordfile: string) => {
	const extracted = extractor.extract(path.join(folder, `${wordfile}`));

	extracted.then((doc: any) => {
		let body = doc.getBody();
		body = body.replace(/\n\s*\n/g, '\n\n');
		let lines: any[] = _.split(body, '\n');
		lines = _.map(lines, (line) => _.replace(line, '&', ''));
		lines = _.map(lines, (line) => _.replace(line, '*', ''));
		lines = _.map(lines, (line) => _.replace(line, '#', ''));
		lines = _.map(lines, _.trim);
		lines = _.map(lines, (line: string) => {
			if (line === '*') return '';
			if (line === '#') return '';
			if (line === '.') return '';
			if (line === ',') return '';
			if (_.startsWith(line, '?')) line = _.replace(line, '?', '');
			return line;
		});

		body = _.join(lines, '\n');
		body = body.replace(/\n\s*\n/g, '\n\n');
		lines = _.split(body, '\n');

		let pesme: any[] = [];
		let current: any = {title: '', text: []};
		_.each(lines, (line: string) => {
			if (!_.isEmpty(line) && _isUpper(line)) {
				if (current?.title) pesme.push(current);
				current = {title: line, text: []};
			} else if (!!current) current?.text.push(line);
		});

		pesme = _.sortBy(pesme, 'title');
		fs.writeFileSync(path.join(__dirname, `pesme.json`), JSON.stringify(pesme, null, 4));

		_.each(pesme, (pesma: any) => {
			let filename = _.replace(pesma.title, '?', '');
			const text = pesma.title + '\n\n' + _.trim(_.join(pesma.text, '\n'));

			let newFile = path.join(__dirname, `pesme/${filename} --- (${wordfile}).txt`);
			if (fs.existsSync(newFile)) newFile = increment(newFile, {platform: 'win32'});

			fs.writeFileSync(newFile, text);
		});
	});
};

const file = 'ГЛАВНО СТЕПЕНИШТЕ.docx';
extract(__dirname, file);
