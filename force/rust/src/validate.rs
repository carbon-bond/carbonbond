use crate::*;
use serde_json::Value;

pub trait ValidatorTrait {
    fn validate_bond(&self, bondee: &Bondee, data: &Value) -> bool;
    fn validate_datatype(&self, data_type: &DataType, data: &Value) -> bool {
        match (data_type, data) {
            (DataType::Number, Value::Number(n)) => n.is_i64(),
            (DataType::OneLine, Value::String(s)) => !s.contains('\n'),
            (DataType::Text(None), Value::String(_)) => true,
            (DataType::Text(Some(regex)), Value::String(s)) => regex.is_match(s),
            (DataType::Bond(bondee), data) => self.validate_bond(bondee, data),
            _ => false,
        }
    }
    fn validate_category(&self, category: &Category, data: &Value) -> bool {
        for field in &category.fields {
            if self.validate_datatype(&field.datatype, &data[&field.name]) == false {
                return false;
            }
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    struct Validator {}
    impl ValidatorTrait for Validator {
        fn validate_bond(&self, _bondee: &Bondee, _data: &Value) -> bool {
            true // 測試中不檢查
        }
    }
    #[test]
    fn test_oneline() -> ForceResult<()> {
        let source = "測試 {單行 文字}";
        let category = parse_category(source)?;
        let data1 = json!({
            "文字": "hihi"
        });
        let data2 = json!({
            "文字": "hi\nhi"
        });
        assert!(Validator {}.validate_category(&category, &data1) == true);
        assert!(Validator {}.validate_category(&category, &data2) == false);
        Ok(())
    }
    #[test]
    fn test_number() -> ForceResult<()> {
        let source = "測試 {數字 數}";
        let category = parse_category(source)?;
        let data1 = json!({
            "數": 1
        });
        let data2 = json!({
            "數": "1"
        });
        assert!(Validator {}.validate_category(&category, &data1) == true);
        assert!(Validator {}.validate_category(&category, &data2) == false);
        Ok(())
    }
    #[test]
    fn test_regex() -> ForceResult<()> {
        let source = "測試 {文本/^.{3,5}$/ 文字}";
        let category = parse_category(source)?;
        let data1 = json!({
            "文字": "12"
        });
        let data2 = json!({
            "文字": "1234"
        });
        let data3 = json!({
            "文字": "123456"
        });
        assert!(Validator {}.validate_category(&category, &data1) == false);
        assert!(Validator {}.validate_category(&category, &data2) == true);
        assert!(Validator {}.validate_category(&category, &data3) == false);
        Ok(())
    }
}
