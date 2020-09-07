use crate::lexer::{lexer, Token};
use crate::*;
use logos::Span;

pub struct Parser {
    tokens: Vec<(Token, Span)>,
    count: usize,
    cur: Token,
    source: String,
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
    fn parse_bondee(&mut self) -> ForceResult<Bondee> {
        self.eat(Token::LeftSquareBracket)?;
        match self.cur.clone() {
            Token::Star => {
                self.advance();
                self.eat(Token::RightSquareBracket)?;
                Ok(Bondee::All)
            }
            Token::Identifier(name) => {
                let mut choices = vec![name.to_string()];
                self.advance();
                loop {
                    match self.cur {
                        Token::RightSquareBracket => {
                            break;
                        }
                        _ => {
                            self.eat(Token::Comma)?;
                            let name = self.get_identifier()?;
                            choices.push(name);
                        }
                    }
                }
                self.eat(Token::RightSquareBracket)?;
                Ok(Bondee::Choices(choices))
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
                    Token::Regex(regex) => {
                        self.advance();
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
    pub fn parse_category(&mut self) -> ForceResult<Category> {
        let start = self.tokens[self.count].1.start;
        let name = self.get_identifier()?;
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
        let source = "新聞 {單行 記者 單行 網址}";

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
            source: "新聞 {單行 記者 單行 網址}".to_owned(),
        };
        assert_eq!(force.categories.get("新聞").unwrap(), ans);
        assert_eq!(&parse_category(source).unwrap(), ans);
        Ok(())
    }
}
