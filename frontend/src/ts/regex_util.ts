// NOTE: 由於 emoji 每年都會增加，本函式可能需要更新
export function isEmojis(s: string): boolean {
	const ranges = [
		'\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]',
		' ', // Also allow spaces
	].join('|');

	const removeEmoji = (str: string): string => str.replace(new RegExp(ranges, 'g'), '');
	return !removeEmoji(s).length;
}

export function isLink(s: string): boolean {
	const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
	return !!pattern.test(s);
}

export function isImageLink(s: string): boolean {
	return isLink(s) && (s.match(/\.(jpeg|jpg|gif|png)$/) != null);
}