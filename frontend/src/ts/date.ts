import { isYesterday, isToday, format, isThisYear } from 'date-fns';
// import { formatRelative } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 根據時間的久遠程度來決定輸出
function relative_date(date: Date): string {
	if (isToday(date)) {
		return format(date, 'a h:mm', {locale: zhTW});
	} else if (isYesterday(date)) {
		return `昨天 ${format(date, 'a h:mm', {locale: zhTW})}`;
	} else if (isThisYear(date)) {
		return format(date, 'MM月dd日 a h:mm', {locale: zhTW});
	} else {
		return format(date, 'yyyy年MM月dd日 a h:mm', {locale: zhTW});
	}
}

// 根據時間越久遠，顯示越簡略
function rough_date(date: Date): string {
	if (isToday(date)) {
		return format(date, 'a h:mm', {locale: zhTW});
	} else if (isYesterday(date)) {
		return '昨天';
	} else if (isThisYear(date)) {
		return format(date, 'MM月dd日');
	} else {
		return format(date, 'yyyy年');
	}
}

export {
	relative_date as rough_date
};