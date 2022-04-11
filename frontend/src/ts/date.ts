import { isYesterday, isToday, format, isThisYear, differenceInSeconds } from 'date-fns';
import { zhTW } from 'date-fns/locale';

function dateDistance(date: Date): string {
	const seconds = differenceInSeconds(new Date(), date);
	if (seconds < 60) {
		return '剛才';
	}
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) {
		return `${minutes} 分鐘`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours} 小時`;
	}
	const days = Math.floor(hours / 24);
	if (days <= 10) {
		return `${days} 天`;
	}
	return roughDate(date);
}

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

export {
	relativeDate,
	roughDate,
	dateDistance
};