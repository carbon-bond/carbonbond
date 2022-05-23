// NOTE: 由於 emoji 每年都會增加，本函式可能需要更新
export function isEmojis(s: string): boolean {
	const ranges = [
		'\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]',
		' ', // Also allow spaces
	].join('|');

	const removeEmoji = (str: string): string => str.replace(new RegExp(ranges, 'g'), '');
	return !removeEmoji(s).length;
}

export const EMAIL_REGEX = new RegExp('.+@.+');

export function isEmail(s: string): boolean {
	return !!EMAIL_REGEX.test(s);
}

export function isLink(s: string): boolean {
	const pattern = new RegExp('^https?:\\/\\/');
	return !!pattern.test(s);
}

export function isImageLink(s: string): boolean {
	return isLink(s) && (s.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

export function isInteger(s: string): boolean {
	return /^-?\d+$/.test(s);
}