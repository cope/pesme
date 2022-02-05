import path from 'path';

import * as fs from 'fs';
import * as _ from 'lodash';

const WordExtractor = require('word-extractor');
const increment = require('add-filename-increment');

const extractor = new WordExtractor();

const _isUpper = (t: string) => t === _.toUpper(t);

const extract = async (folder: string, wordfile: string): Promise<void> => {
	const ext = path.extname(wordfile);
	if (ext !== '.docx') return;

	const doc = await extractor.extract(path.join(folder, `${wordfile}`));
	let body = doc.getBody();
	body = body.replace(/\n\s*\n/g, '\n\n');
	let lines: any[] = _.split(body, '\n');
	lines = _.map(lines, (line) => _.replace(line, '&', ''));
	lines = _.map(lines, (line) => _.replace(line, '*', ''));
	lines = _.map(lines, (line) => _.replace(line, '*', ''));
	lines = _.map(lines, (line) => _.replace(line, '*', ''));
	lines = _.map(lines, (line) => _.replace(line, '#', ''));
	lines = _.map(lines, _.trim);
	lines = _.map(lines, (line: string) => {
		if (_.startsWith(line, '---')) return '';
		if (_.includes(line, '....')) return '';
		if (_.includes(line, '\t')) return '';

		if (line === '*') return '';
		if (line === '#') return '';
		if (line === '.') return '';
		if (line === ',') return '';
		if (_.startsWith(line, '?')) line = _.replace(line, '?', '');
		if (_.startsWith(line, '?')) line = _.replace(line, '?', '');
		if (_.startsWith(line, '+')) line = _.replace(line, '+', '');
		if (_.startsWith(line, '+')) line = _.replace(line, '+', '');
		if (_.startsWith(line, '%')) line = _.replace(line, '%', '');

		return line;
	});

	body = _.join(lines, '\n');
	body = body.replace(/\n\s*\n/g, '\n\n');
	lines = _.split(body, '\n');

	let pesme: any[] = [];
	let current: any = {title: '', text: []};
	for (let line of lines) {
		if (!_.isEmpty(line) && _isUpper(line)) {
			if (current?.title) pesme.push(current);
			current = {title: line, text: []};
		} else if (!!current) current?.text.push(line);
	}

	pesme = _.sortBy(pesme, 'title');
	console.log(' - extract', folder, wordfile, _.size(pesme));
	for (const pesma of pesme) {
		let filename = _.replace(pesma.title, '?', '');
		filename = _.replace(filename, '%', '');
		filename = _.replace(filename, '"', '');
		filename = _.replace(filename, '"', '');
		filename = _.replace(filename, '”', '');
		filename = _.replace(filename, '”', '');
		const text = pesma.title + '\n\n' + _.trim(_.join(pesma.text, '\n'));

		let newFile = path.join(folder, `pesme/${filename} --- (${wordfile}).txt`);
		if (fs.existsSync(newFile)) newFile = increment(newFile, {platform: 'win32'});

		fs.writeFileSync(newFile, text);
	}
};

const doit = async () => {
	const wordovi = path.join(__dirname, 'wordovi');
	const subfolderNames = fs.readdirSync(wordovi);
	const subfolders = _.filter(subfolderNames, (sub: string) => fs.lstatSync(path.join(wordovi, sub)).isDirectory());
	for (const subfolder of subfolders) {
		const fullPath = path.join(wordovi, subfolder);

		const fileNames = fs.readdirSync(fullPath);
		const files = _.filter(fileNames, (file: string) => !fs.lstatSync(path.join(fullPath, file)).isDirectory());

		fs.rmSync(path.join(fullPath, 'pesme'), {recursive: true, force: true});
		if (!fs.existsSync(path.join(fullPath, 'pesme'))) fs.mkdirSync(path.join(fullPath, 'pesme'));
		console.log('\najmo', fullPath);
		for (const file of files) {
			await extract(fullPath, file);
		}

		let spisak: string[] = fs.readdirSync(path.join(fullPath, 'pesme'));
		spisak = _.sortBy(spisak);
		console.log('spisak', subfolder, _.size(spisak));
		fs.writeFileSync(path.join(__dirname, `${subfolder}-spisak.txt`), _.join(spisak, '\n'));
	}
};
doit();
