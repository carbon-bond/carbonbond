import { isYesterday, isToday, format, isThisYear } from 'date-fns';
// import { formatRelative } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 根據時間的久遠程度來決定輸出
function relativeDate(date: Date): string {
	if (isToday(date)) {
		return format(date, 'a h:mm', {locale: zhTW});
	} else if (isYesterday(date)) {
		return `昨天 ${format(date, 'a h:mm', {locale: zhTW})}`;
	} else if (isThisYear(date)) {
		return format(date, 'M月dd日 a h:mm', {locale: zhTW});
	} else {
		return format(date, 'yyyy年M月dd日 a h:mm', {locale: zhTW});
	}
}

// 根據時間越久遠，顯示越簡略
function roughDate(date: Date): string {
	if (isToday(date)) {
		return format(date, 'a h:mm', {locale: zhTW});
	} else if (isYesterday(date)) {
		return '昨天';
	} else if (isThisYear(date)) {
		return format(date, 'M月dd日');
	} else {
		return format(date, 'yyyy年');
	}
}

/**
 * @param time 以毫秒計的 UTC 時間
 */
function formatCreateDate(time: number): string {
	let d = new Date(time * 1000);
	if (isToday(d)) {
		return `今天 ${d.getHours()}:${d.getMinutes()}`;
	} else if (isYesterday(d)) {
		return `昨天 ${d.getHours()}:${d.getMinutes()}`;
	} else if (isThisYear(d)) {
		return `${d.getMonth()}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
	} else {
		return `${d.getFullYear()}${d.getMonth()}/${d.getDate()}`;
	}
}

export {
	relativeDate,
	roughDate,
	formatCreateDate
};