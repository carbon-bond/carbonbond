use force::lexer::lexer;
use force::parser::Parser;

fn main() {
    let source = "
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
    鍵結[*] 原文
    文本 內文
}
";
    let tokens = lexer(&source);
    for token in &tokens {
        println!("{:?}", token);
    }
    let mut parser = Parser::new(source);
    let force = parser.parse().unwrap();
    println!("{:#?}", force);
}
