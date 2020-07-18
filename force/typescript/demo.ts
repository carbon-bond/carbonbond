import { Parser } from './src/parser';

let source = `
新聞 {
    單行 媒體
    單行 記者
    文本 內文
    單行 超鏈接
    文本 備註
}
問卦 {
    文本/.{256,}/ 內文
}
解答 {
    鍵結[問卦,留言] 問題
    文本 內文
}
留言 {
    鍵結[*] 本體
    文本/.{1,256}/ 內文
}
回覆 {
    帶籤鍵結[*] {
        挺 {
            輸能: [1]
        }
        戰 {
            輸能: [-1]
        }
        回 {
            輸能: [0]
        }
    } 原文
    文本 內文
}
`;

const parser = new Parser(source);
const force = parser.parse();
force.categories.forEach((value, key) => {
	console.log(`${key} => ${JSON.stringify(value, null, 2)}`);
});