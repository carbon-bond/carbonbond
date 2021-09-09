use crate::defs::*;
use crate::lexer::{lexer, Token};
use logos::Span;
use regex::Regex;
use std::collections::HashMap;
use std::sync::Arc;

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
    fn get_integer(&mut self) -> ForceResult<usize> {
        let ret = if let Token::Integer(n) = &self.cur {
            Ok(*n)
        } else {
            Err(ForceError::NonExpect {
                // TODO: 提高拋錯的可讀性
                expect: Token::Integer(123456789),
                fact: self.cur.clone(),
            })
        };
        if let Ok(_) = ret {
            self.advance();
        }
        ret
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
    fn parse_choice(&mut self) -> ForceResult<Choice> {
        match self.cur {
            Token::At => {
                self.advance();
                let name = self.get_identifier()?;
                Ok(Choice::Family(name))
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
    fn parse_datatype(&mut self) -> ForceResult<BasicDataType> {
        match self.cur {
            Token::Number => {
                self.advance();
                Ok(BasicDataType::Number)
            }
            Token::OneLine => {
                self.advance();
                Ok(BasicDataType::OneLine)
            }
            Token::Text => {
                self.advance();
                match self.cur.clone() {
                    Token::Regex(s) => {
                        self.advance();
                        let regex = Regex::new(&format!("(?s){}", s))
                            .map_err(|_e| ForceError::InvalidRegex { regex: s })?;
                        Ok(BasicDataType::Text(Some(regex)))
                    }
                    _ => Ok(BasicDataType::Text(None)),
                }
            }
            Token::Bond => {
                self.advance();
                let bondee = self.parse_bondee()?;
                Ok(BasicDataType::Bond(bondee))
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
                // 不允許分類族為空
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
    pub fn parse_field(&mut self) -> ForceResult<Field> {
        let basic_datatype = self.parse_datatype()?;
        let name = self.get_identifier()?;
        let datatype = match self.cur {
            Token::QuestionMark => {
                self.advance();
                DataType::Optional(basic_datatype)
            }
            Token::LeftSquareBracket => {
                self.advance();
                let min = self.get_integer()?;
                self.eat(Token::Tilde)?;
                let max = self.get_integer()?;
                self.eat(Token::RightSquareBracket)?;
                DataType::Array {
                    t: basic_datatype,
                    min,
                    max,
                }
            }
            _ => DataType::Single(basic_datatype),
        };
        Ok(Field { datatype, name })
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
                fields.push(self.parse_field()?);
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
                let category = Arc::new(self.parse_category()?);
                categories.insert(category.name.clone(), category);
            }
        }
        return Ok(categories);
    }
    pub fn parse(&mut self) -> ForceResult<Force> {
        let categories = self.parse_categories()?;

        // 建造分類族雜湊表
        let mut families: HashMap<String, Vec<String>> = HashMap::new();

        for (_key, category) in &categories {
            for family in &category.family {
                match families.get_mut(family) {
                    Some(f) => {
                        f.push(category.name.clone());
                    }
                    None => {
                        families.insert(family.clone(), vec![category.name.clone()]);
                    }
                }
            }
        }

        // 檢驗鍵結指向的分類跟分類族是否存在
        let mut not_found_categories = Vec::new();
        let mut not_found_families = Vec::new();

        for (_key, category) in &categories {
            for field in &category.fields {
                match field.datatype.basic_type() {
                    BasicDataType::Bond(bondee) => {
                        if let Bondee::Choices {
                            family: family_choices,
                            category: category_choices,
                        } = bondee
                        {
                            for c in category_choices {
                                if categories.get(c).is_none() {
                                    not_found_categories.push(c.clone());
                                }
                            }
                            for f in family_choices {
                                if families.get(f).is_none() {
                                    not_found_families.push(f.clone());
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }

        if not_found_categories.len() > 0 || not_found_families.len() > 0 {
            return Err(ForceError::InvalidBond {
                not_found_categories,
                not_found_families,
            });
        }

        return Ok(Force {
            categories,
            families,
        });
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

        let ans = Category {
            name: "新聞".to_owned(),
            fields: vec![
                Field {
                    datatype: BasicDataType::OneLine.into(),
                    name: "記者".to_owned(),
                },
                Field {
                    datatype: BasicDataType::OneLine.into(),
                    name: "網址".to_owned(),
                },
            ],
            family: vec!["轉載".to_owned(), "外部".to_owned()],
            source: source.to_owned(),
        };
        assert_eq!(**(force.categories.get("新聞").unwrap()), ans);
        assert_eq!(parse_category(source).unwrap(), ans);

        assert_eq!(force.families.len(), 2);
        assert_eq!(force.families.get("轉載").unwrap().len(), 1);
        assert_eq!(
            force
                .families
                .get("轉載")
                .unwrap()
                .contains(&"新聞".to_string()),
            true
        );
        assert_eq!(force.families.get("外部").unwrap().len(), 1);
        assert_eq!(
            force
                .families
                .get("外部")
                .unwrap()
                .contains(&"新聞".to_string()),
            true
        );

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
                datatype: BasicDataType::Text(Some(Regex::new("(?s)我的志願是.+").unwrap())).into(),
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

        let ans = &Category {
            name: "留言".to_owned(),
            fields: vec![Field {
                datatype: BasicDataType::Bond(Bondee::Choices {
                    category: vec!["新聞".to_owned()],
                    family: vec!["批踢踢文章".to_owned(), "狄卡文章".to_owned()],
                })
                .into(),
                name: "原文".to_owned(),
            }],
            family: vec![],
            source: source.to_owned(),
        };
        assert_eq!(&parse_category(source).unwrap(), ans);
        Ok(())
    }
    #[test]
    fn test_family() -> ForceResult<()> {
        let source = "
            留言 { 鍵結[@批踢踢文章, @狄卡文章, 新聞] 原文 }
            新聞 {}
            八卦 @[批踢踢文章] {}
            政黑 @[批踢踢文章] {}
            有趣 @[狄卡文章] {}
            ";
        let force = parse(source)?;

        assert_eq!(force.families.get("批踢踢文章").unwrap().len(), 2);
        assert_eq!(
            force
                .families
                .get("批踢踢文章")
                .unwrap()
                .contains(&"八卦".to_string()),
            true
        );
        assert_eq!(
            force
                .families
                .get("批踢踢文章")
                .unwrap()
                .contains(&"政黑".to_string()),
            true
        );

        assert_eq!(force.families.get("狄卡文章").unwrap().len(), 1);
        assert_eq!(
            force
                .families
                .get("狄卡文章")
                .unwrap()
                .contains(&"有趣".to_string()),
            true
        );
        Ok(())
    }
}
