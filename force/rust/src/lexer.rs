use logos::{Lexer, Logos, Span};

// 先藉助 logos 函式庫自動生成 LogoToken ，再將之轉成自定義的 Token

// logos 詞法分析庫的 token
#[derive(Logos, Debug, PartialEq, Clone)]
pub enum Token {
    #[regex(r"[ \t\n]+", logos::skip)]
    #[error]
    Error,

    // 特殊符號
    #[token("{")]
    LeftCurlyBrace,
    #[token("}")]
    RightCurlyBrace,
    #[token("[")]
    LeftSquareBracket,
    #[token("]")]
    RightSquareBracket,
    #[token(",")]
    Comma,
    #[token("#")]
    Sharp,
    #[token(":")]
    Colon,
    #[token("@")]
    At,
    #[token("?")]
    QuestionMark,
    #[token("~")]
    Tilde,

    // 域型別
    #[token("單行")]
    OneLine,
    #[token("文本")]
    Text,
    #[token("數字")]
    Number,
    #[token("鍵結")]
    Bond,

    // 正則表達式
    #[regex("/[^/]+/", extract_regex)]
    Regex(String),

    // 鍵結的符號
    #[token("*")]
    Star,
    #[token("輸能")]
    Transfuse,

    // 識別子，只能是中文、英文、數字、底線
    // TODO: 增強識別子的限制
    #[regex("[^\\s/\\[\\]\\}\\{\\?\\~,#@:]+", get_string)]
    Identifier(String),

    // 整數，詞法解析順位優先於識別子
    #[regex("[0-9]+", get_integer, priority = 2)]
    Integer(usize),

    End,
}

// TODO: 當整數太大時給出有意義的錯誤訊息
fn get_integer(lex: &mut Lexer<Token>) -> usize {
    lex.slice().to_owned().parse::<usize>().unwrap()
}

fn get_string(lex: &mut Lexer<Token>) -> String {
    lex.slice().to_string()
}

fn extract_regex(lex: &mut Lexer<Token>) -> String {
    let s = lex.slice();
    s[1..(s.len() - 1)].to_string()
}

pub fn lexer(s: &str) -> Vec<(Token, Span)> {
    let lex = Token::lexer(s);
    let mut ret: Vec<(Token, Span)> = lex.spanned().collect();
    ret.push((Token::End, s.len()..s.len()));
    ret
}

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_integer_identifier() {
        let mut lexer = Token::lexer("12345 123木頭人 木頭人321 123木頭人321");
        assert_eq!(lexer.next(), Some(Token::Integer(12345)));
        assert_eq!(
            lexer.next(),
            Some(Token::Identifier("123木頭人".to_owned()))
        );
        assert_eq!(
            lexer.next(),
            Some(Token::Identifier("木頭人321".to_owned()))
        );
        assert_eq!(
            lexer.next(),
            Some(Token::Identifier("123木頭人321".to_owned()))
        );
    }
    #[test]
    fn test_special_character() {
        let mut lexer = Token::lexer("{}[],#:@?~");
        assert_eq!(lexer.next(), Some(Token::LeftCurlyBrace));
        assert_eq!(lexer.next(), Some(Token::RightCurlyBrace));
        assert_eq!(lexer.next(), Some(Token::LeftSquareBracket));
        assert_eq!(lexer.next(), Some(Token::RightSquareBracket));
        assert_eq!(lexer.next(), Some(Token::Comma));
        assert_eq!(lexer.next(), Some(Token::Sharp));
        assert_eq!(lexer.next(), Some(Token::Colon));
        assert_eq!(lexer.next(), Some(Token::At));
        assert_eq!(lexer.next(), Some(Token::QuestionMark));
        assert_eq!(lexer.next(), Some(Token::Tilde));
        assert_eq!(lexer.next(), None);
    }
    #[test]
    fn test_keyword() {
        let mut lexer = Token::lexer("單行 文本 數字 鍵結 輸能");
        assert_eq!(lexer.next(), Some(Token::OneLine));
        assert_eq!(lexer.next(), Some(Token::Text));
        assert_eq!(lexer.next(), Some(Token::Number));
        assert_eq!(lexer.next(), Some(Token::Bond));
        assert_eq!(lexer.next(), Some(Token::Transfuse));
        assert_eq!(lexer.next(), None);
    }
    #[test]
    fn test_identifier() {
        let mut lexer = Token::lexer("單行文本數字鍵結輸能");
        assert_eq!(
            lexer.next(),
            Some(Token::Identifier("單行文本數字鍵結輸能".to_owned()))
        );
        lexer = Token::lexer("Gossip");
        assert_eq!(lexer.next(), Some(Token::Identifier("Gossip".to_owned())));
        lexer = Token::lexer("八卦");
        assert_eq!(lexer.next(), Some(Token::Identifier("八卦".to_owned())));
        lexer = Token::lexer("play_boy");
        assert_eq!(lexer.next(), Some(Token::Identifier("play_boy".to_owned())));
        lexer = Token::lexer("花花公子");
        assert_eq!(lexer.next(), Some(Token::Identifier("花花公子".to_owned())));
    }
    #[test]
    fn test_regex() {
        let mut lexer = Token::lexer("/[ab]+d?/");
        assert_eq!(lexer.next(), Some(Token::Regex("[ab]+d?".to_owned())));
    }
    #[test]
    fn test_family() {
        let mut lexer = Token::lexer("@批踢踢文章");
        assert_eq!(lexer.next(), Some(Token::At));
        assert_eq!(
            lexer.next(),
            Some(Token::Identifier("批踢踢文章".to_owned()))
        );
        assert_eq!(lexer.next(), None);
    }
}
