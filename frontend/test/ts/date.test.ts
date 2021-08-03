import { relativeDate, roughDate } from '../../src/ts/date';

describe('relativeDate 元件', () => {
	let regex_time = /(上午|下午) ([1-9]|1[0-2]):[0-9]{2}/;
	test('測試 relativeDate 當天的格式', () => {
		let now = new Date();
		let regex_date = new RegExp('');
		let regex = new RegExp(regex_date.source + regex_time.source);
		expect(relativeDate(now)).toMatch(regex);
	});
	test('測試 relativeDate 昨天的格式', () => {
		let yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		let regex_date = new RegExp('昨天');
		let regex = new RegExp(regex_date.source + ' ' + regex_time.source);
		expect(relativeDate(yesterday)).toMatch(regex);
	});
	test('測試 relativeDate 今年的格式', () => {
		let now = new Date();
		let day_before_tomorrow = new Date();
		day_before_tomorrow.setDate(now.getDate() - 2);
		let regex_date = new RegExp('([1-9]|1[0-2])月([0-3][0-9])日');
		let regex = new RegExp(regex_date.source + ' ' + regex_time.source);
		if (now.getFullYear() != day_before_tomorrow.getFullYear()) {
			expect(true).toBeTruthy();
		} else {
			expect(relativeDate(day_before_tomorrow)).toMatch(regex);
		}
	});
	test('測試 relativeDate 今年以前的格式', () => {
		let now = new Date();
		let day_one_year_before = new Date();
		day_one_year_before.setDate(now.getDate() - 366);
		let regex_date = new RegExp('[0-9]+年([1-9]|1[0-2])月[0-9]{2}日');
		let regex = new RegExp(regex_date.source + ' ' + regex_time.source);
		expect(relativeDate(day_one_year_before)).toMatch(regex);
	});
});

describe('roughDate 元件', () => {
	test('測試 roughDate 當天的格式', () => {
		let now = new Date();
		let regex = /(上午|下午) ([1-9]|1[0-2]):[0-9]{2}/;
		expect(roughDate(now)).toMatch(regex);
	});
	test('測試 roughDate 昨天的格式', () => {
		let yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		let regex = /昨天/;
		expect(roughDate(yesterday)).toMatch(regex);
	});
	test('測試 roughDate 今年的格式', () => {
		let now = new Date();
		let yesterday = new Date();
		yesterday.setDate(now.getDate() - 2);
		let regex = /([1-9]|1[0-2])月([0-3][0-9])日/;
		if (now.getFullYear() != yesterday.getFullYear()) {
			expect(true).toBeTruthy();
		} else {
			expect(roughDate(yesterday)).toMatch(regex);
		}
	});
	test('測試 roughDate 今年以前的格式', () => {
		let now = new Date();
		let yesterday = new Date();
		yesterday.setDate(now.getDate() - 366);
		let regex = /[0-9]+年/;
		expect(roughDate(yesterday)).toMatch(regex);
	});
});
