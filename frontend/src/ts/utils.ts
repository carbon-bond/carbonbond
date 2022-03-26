function fallbackCopyToClipboard(text_to_copy: string): Promise<void> {
	console.warn('瀏覽器剪貼簿僅在 https 或 localhost 可用，現採用兼容方式複製');
	// 创建text area
	let text_area = document.createElement('textarea');
	text_area.value = text_to_copy;
	// 使text area不在viewport，同时设置不可见
	text_area.style.position = 'fixed';
	text_area.style.opacity = '0';
	text_area.style.left = '-999999px';
	text_area.style.top = '-999999px';
	document.body.appendChild(text_area);
	text_area.focus();
	text_area.select();
	return new Promise((res, rej) => {
		// 执行复制命令并移除文本框
		document.execCommand('copy') ? res() : rej();
		text_area.remove();
	});
}

export function copyToClipboard(text_to_copy: string): Promise<void> {
	// navigator clipboard 需要https等安全上下文
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(text_to_copy);
	} else {
		return fallbackCopyToClipboard(text_to_copy);
	}
}
