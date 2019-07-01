extern crate serde_json;
use serde::{Serialize, Deserialize, Deserializer, Serializer};
use serde::de::{self, Visitor, Error};
extern crate regex;
use regex::Regex;

#[derive(Deserialize, Serialize, Debug)]
pub struct Threshold {
    bond_energy: i32,
    identity: usize, // 0平民, 1黨員, 2黨代表, 3黨主席
}

#[derive(Debug)]
pub enum AtomType {
    Str,
    Text,
    Int,
}
fn str_to_atom_type<E: Error>(s: &str) -> Result<AtomType, E> {
    if s == "Str" {
        Ok(AtomType::Str)
    } else if s == "Text" {
        Ok(AtomType::Text)
    } else if s == "Int" {
        Ok(AtomType::Int)
    } else {
        Err(E::custom(format!("解析原子類型失敗: {}", s)))
    }
}
fn atom_type_to_str(t: &AtomType) -> String {
    match t {
        AtomType::Str => "Str",
        AtomType::Text => "Text",
        AtomType::Int => "Int",
    }
    .to_owned()
}

#[derive(Debug)]
pub enum ColType {
    Arr(AtomType, usize),
    Atom(AtomType),
}

use std::fmt;
struct ColTypeVisitor;
impl<'de> Visitor<'de> for ColTypeVisitor {
    type Value = ColType;
    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("欄位結構")
    }
    fn visit_str<E: Error>(self, value: &str) -> Result<Self::Value, E> {
        let re_arr = Regex::new(r"^\[([A-Za-z]+); *(\d+)\]$").unwrap();
        let cap = re_arr.captures_iter(value).last();
        match cap {
            Some(cap_vec) => {
                let atom = str_to_atom_type(&cap_vec[1])?;
                let size_res = cap_vec[2].parse::<usize>();
                if size_res.is_err() {
                    Err(E::custom(format!("解析陣列長度失敗: {}", value)))
                } else {
                    Ok(ColType::Arr(atom, size_res.unwrap()))
                }
            }
            None => {
                let atom = str_to_atom_type(value)?;
                Ok(ColType::Atom(atom))
            }
        }
    }
}
impl<'de> Deserialize<'de> for ColType {
    fn deserialize<D>(deserializer: D) -> Result<ColType, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(ColTypeVisitor)
    }
}
impl Serialize for ColType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = {
            match self {
                ColType::Arr(a_type, size) => format!("[{};{}]", atom_type_to_str(a_type), size),
                ColType::Atom(a_type) => atom_type_to_str(a_type),
            }
        };
        serializer.serialize_str(&s)
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct NodeCol {
    col_name: String,
    col_type: ColType,
    restriction: String,
}
#[derive(Deserialize, Serialize, Debug)]
pub struct TemplateBody {
    template_name: String,
    transfusable: bool,
    is_question: bool,
    show_in_list: bool,
    rootable: bool,
    threshold_to_post: Threshold,
    attached_to: Vec<String>,
    structure: Vec<NodeCol>,
}
impl TemplateBody {
    pub fn to_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}
