use crate::defs::*;
use crate::lexer::{lexer, Token};
use logos::Span;
use regex::Regex;
use std::collections::HashMap;

pub struct Parser {
    tokens: Vec<(Token, Span)>,
    count: usize,
    cur: Token,
    source: String,
}

enum Choice {
    Category(String),
    Family(String),
}

impl Parser {
    pub fn new(source: &str) -> Parser {
        let tokens = lexer(source);
        return Parser {
            count: 0,
            cur: tokens[0].0.clone(),
            tokens: tokens,
            source: source.to_owned(),
        };
    }
    fn advance(&mut self) {
        self.count += 1;
        self.cur = self.tokens[self.count].clone().0
    }
    fn eat(&mut self, expect: Token) -> ForceResult<()> {
        if self.cur == expect {
            self.advance();
            Ok(())
        } else {
            Err(ForceError::NonExpect {
                expect,
                fact: self.cur.clone(),
            })
        }
    }
    fn get_identifier(&mut self) -> ForceResult<String> {
        let ret = if let Token::Identifier(id) = &self.cur {
            Ok(id.clone())
        } else {
            Err(ForceError::NonExpect {
                expect: Token::Identifier("某個識別子".to_owned()),
                fact: self.cur.clone(),
            })
        };
        if let Ok(_) = ret {
            self.advance();
        }
        ret
    }
    fn parse_tags(&mut self) -> ForceResult<Vec<Tag>> {
        let mut tags = Vec::new();
        self.eat(Token::LeftCurlyBrace)?;
        loop {
            if let Token::RightCurlyBrace = self.cur {
                self.advance();
                break;
            } else {
                let tag = self.get_identifier()?;
                tags.push(Tag { name: tag });
                self.eat(Token::LeftCurlyBrace)?;
                while self.cur != Token::RightCurlyBrace {
                    // TODO: 解析真實內容
                    self.advance();
                }
                self.eat(Token::RightCurlyBrace)?;
            }
        }
        Ok(tags)
    }
    fn parse_choice(&mut self) -> ForceResult<Choice> {
        match self.cur {
            Token::At => {
                self.advance();
                let family = self.get_identifier()?;
                Ok(Choice::Family(family))
            }
            _ => {
                let name = self.get_identifier()?;
                Ok(Choice::Category(name))
            }
        }
    }
    fn parse_choices(&mut self) -> ForceResult<Bondee> {
        let mut category = vec![];
        let mut family = vec![];
        match self.parse_choice()? {
            Choice::Category(name) => category.push(name),
            Choice::Family(name) => family.push(name),
        }
        loop {
            match self.cur {
                Token::RightSquareBracket => {
                    break;
                }
                Token::Comma => {
                    self.advance();
                    match self.parse_choice()? {
                        Choice::Category(name) => category.push(name),
                        Choice::Family(name) => family.push(name),
                    }
                }
                _ => {
                    return Err(ForceError::NoMeet {
                        expect: ", 或 ]".to_owned(),
                        fact: self.cur.clone(),
                    });
                }
            }
        }
        Ok(Bondee::Choices { category, family })
    }
    fn parse_bondee(&mut self) -> ForceResult<Bondee> {
        self.eat(Token::LeftSquareBracket)?;
        match self.cur.clone() {
            Token::Star => {
                self.advance();
                self.eat(Token::RightSquareBracket)?;
                Ok(Bondee::All)
            }
            Token::At | Token::Identifier(_) => {
                let choices = self.parse_choices()?;
                self.eat(Token::RightSquareBracket)?;
                Ok(choices)
            }
            _ => Err(ForceError::NoMeet {
                expect: "* 或識別子".to_owned(),
                fact: self.cur.clone(),
            }),
        }
    }
    fn parse_datatype(&mut self) -> ForceResult<DataType> {
        match self.cur {
            Token::Number => {
                self.advance();
                Ok(DataType::Number)
            }
            Token::OneLine => {
                self.advance();
                Ok(DataType::OneLine)
            }
            Token::Text => {
                self.advance();
                match self.cur.clone() {
                    Token::Regex(s) => {
                        self.advance();
                        let regex =
                            Regex::new(&s).map_err(|_e| ForceError::InvalidRegex { regex: s })?;
                        Ok(DataType::Text(Some(regex)))
                    }
                    _ => Ok(DataType::Text(None)),
                }
            }
            Token::Bond => {
                self.advance();
                let bondee = self.parse_bondee()?;
                Ok(DataType::Bond(bondee))
            }
            Token::TaggedBond => {
                self.advance();
                let bondee = self.parse_bondee()?;
                let tags = self.parse_tags()?;
                Ok(DataType::TaggedBond(bondee, tags))
            }
            _ => Err(ForceError::NoMeet {
                expect: "型別".to_owned(),
                fact: self.cur.clone(),
            }),
        }
    }
    pub fn parse_family(&mut self) -> ForceResult<Vec<String>> {
        match self.cur.clone() {
            Token::At => {
                self.advance();
                self.eat(Token::LeftSquareBracket)?;
                // 不允許分類族爲空
                let name = self.get_identifier()?;
                let mut family = vec![name];
                loop {
                    match self.cur {
                        Token::RightSquareBracket => {
                            self.advance();
                            break;
                        }
                        _ => {
                            self.eat(Token::Comma)?;
                            let name = self.get_identifier()?;
                            family.push(name);
                        }
                    }
                }
                Ok(family)
            }
            _ => Ok(vec![]),
        }
    }
    pub fn parse_category(&mut self) -> ForceResult<Category> {
        let start = self.tokens[self.count].1.start;
        // 讀取分類名稱
        let name = self.get_identifier()?;

        // 讀取分類族
        let family = self.parse_family()?;

        // 讀取各欄位資訊
        let mut fields = Vec::new();
        self.eat(Token::LeftCurlyBrace)?;
        loop {
            if let Token::RightCurlyBrace = self.cur {
                break;
            } else {
                let datatype = self.parse_datatype()?;
                let name = self.get_identifier()?;
                fields.push(Field { datatype, name });
            }
        }
        let end = self.tokens[self.count].1.end;
        self.eat(Token::RightCurlyBrace)?;
        Ok(Category {
            name,
            fields,
            family,
            source: self.source[start..end].to_string(),
        })
    }
    fn parse_categories(&mut self) -> ForceResult<Categories> {
        let mut categories = HashMap::new();
        loop {
            if let Token::End = self.cur {
                break;
            } else {
                let category = self.parse_category()?;
                categories.insert(category.name.clone(), category);
            }
        }
        return Ok(categories);
    }
    pub fn parse(&mut self) -> ForceResult<Force> {
        let categories = self.parse_categories()?;
        return Ok(Force { categories });
    }
}

pub fn parse(source: &str) -> ForceResult<Force> {
    Parser::new(source).parse()
}

pub fn parse_category(source: &str) -> ForceResult<Category> {
    Parser::new(source).parse_category()
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_simple_category() -> ForceResult<()> {
        let source = "新聞 @[轉載, 外部] {單行 記者 單行 網址}";

        let force = parse(source)?;
        assert_eq!(force.categories.len(), 1);

        let ans = &Category {
            name: "新聞".to_owned(),
            fields: vec![
                Field {
                    datatype: DataType::OneLine,
                    name: "記者".to_owned(),
                },
                Field {
                    datatype: DataType::OneLine,
                    name: "網址".to_owned(),
                },
            ],
            family: vec!["轉載".to_owned(), "外部".to_owned()],
            source: source.to_owned(),
        };
        assert_eq!(force.categories.get("新聞").unwrap(), ans);
        assert_eq!(&parse_category(source).unwrap(), ans);
        Ok(())
    }
    #[test]
    fn test_regex() -> ForceResult<()> {
        let source = "作文比賽 {文本/我的志願是.+/ 文章}";

        let force = parse(source)?;
        assert_eq!(force.categories.len(), 1);

        let ans = &Category {
            name: "作文比賽".to_owned(),
            fields: vec![Field {
                datatype: DataType::Text(Some(Regex::new("我的志願是.+").unwrap())),
                name: "文章".to_owned(),
            }],
            family: vec![],
            source: source.to_owned(),
        };
        assert_eq!(&parse_category(source).unwrap(), ans);
        Ok(())
    }
    #[test]
    fn test_choices() -> ForceResult<()> {
        let source = "留言 { 鍵結[@批踢踢文章, @狄卡文章, 新聞] 原文 }";

        let force = parse(source)?;
        assert_eq!(force.categories.len(), 1);

        let ans = &Category {
            name: "留言".to_owned(),
            fields: vec![Field {
                datatype: DataType::Bond(Bondee::Choices {
                    category: vec!["新聞".to_owned()],
                    family: vec!["批踢踢文章".to_owned(), "狄卡文章".to_owned()],
                }),
                name: "原文".to_owned(),
            }],
            family: vec![],
            source: source.to_owned(),
        };
        assert_eq!(&parse_category(source).unwrap(), ans);
        Ok(())
    }
}
