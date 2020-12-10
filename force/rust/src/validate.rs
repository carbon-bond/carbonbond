use crate::instance_defs::Bond;
use crate::*;
use serde_json::Value;

#[async_trait::async_trait]
pub trait ValidatorTrait {
    async fn validate_bond(&self, bondee: &Bondee, data: &Bond) -> bool;
    async fn validate_basic_datatype(&self, data_type: &BasicDataType, data: &Value) -> bool {
        log::trace!("驗證力語言基本型態： {:?} => {:?}", data_type, data);
        match (data_type, data) {
            (BasicDataType::Number, Value::Number(n)) => n.is_i64(),
            (BasicDataType::OneLine, Value::String(s)) => !s.contains('\n'),
            (BasicDataType::Text(None), Value::String(_)) => true,
            (BasicDataType::Text(Some(regex)), Value::String(s)) => regex.is_match(s),
            (BasicDataType::Bond(bondee), data) => {
                let bond: Bond = match serde_json::from_value(data.clone()) {
                    Ok(b) => b,
                    Err(e) => {
                        log::error!("解析鍵結錯誤 {}", e);
                        return false;
                    }
                };
                // XXX: 檢查鍵能和標籤
                self.validate_bond(bondee, &bond).await
            }
            _ => false,
        }
    }
    async fn validate_datatype(&self, data_type: &DataType, data: &Value) -> bool {
        match data_type {
            DataType::Optional(t) => data.is_null() || self.validate_basic_datatype(t, data).await,
            DataType::Single(t) => self.validate_basic_datatype(t, data).await,
            DataType::Array { t, min, max } => match data {
                Value::Array(values) => {
                    if values.len() < *min || values.len() > *max {
                        return false;
                    }
                    for value in values {
                        if !self.validate_basic_datatype(t, value).await {
                            return false;
                        }
                    }
                    true
                }
                _ => false,
            },
        }
    }
    async fn validate_category(&self, category: &Category, data: &Value) -> bool {
        for field in &category.fields {
            log::trace!("驗證力語言欄位 {:?} => {:?}", field, data[&field.name]);
            if self
                .validate_datatype(&field.datatype, &data[&field.name])
                .await
                == false
            {
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
        async fn validate_bond(&self, _bondee: &Bondee, _data: &Bond) -> bool {
            true // 測試中不檢查
        }
    }
    #[tokio::test]
    fn test_oneline() -> ForceResult<()> {
        let source = "測試 {單行 文字}";
        let category = parse_category(source)?;
        let data1 = json!({
            "文字": "hihi"
        });
        let data2 = json!({
            "文字": "hi\nhi"
        });
        assert!(Validator {}.validate_category(&category, &data1).await == true);
        assert!(Validator {}.validate_category(&category, &data2).await == false);
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
        assert!(Validator {}.validate_category(&category, &data1).await == true);
        assert!(Validator {}.validate_category(&category, &data2).await == false);
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
        assert!(Validator {}.validate_category(&category, &data1).await == false);
        assert!(Validator {}.validate_category(&category, &data2).await == true);
        assert!(Validator {}.validate_category(&category, &data3).await == false);
        Ok(())
    }
    #[test]
    fn test_optional() -> ForceResult<()> {
        let source = "測試 {數字 數?}";
        let category = parse_category(source)?;
        let data1 = json!({
            "數": 1
        });
        let data2 = json!({ "數": null });
        let data3 = json!({});
        let data4 = json!({
            "數": "1"
        });
        assert!(Validator {}.validate_category(&category, &data1).await == true);
        assert!(Validator {}.validate_category(&category, &data2).await == true);
        assert!(Validator {}.validate_category(&category, &data3).await == true);
        assert!(Validator {}.validate_category(&category, &data4).await == false);
        Ok(())
    }
    #[test]
    fn test_array() -> ForceResult<()> {
        let source = "測試 {數字 數[2~3]}";
        let category = parse_category(source)?;
        let data1 = json!({
            "數": 1
        });
        let data2 = json!({ "數": null });
        let data3 = json!({});
        let data4 = json!({
            "數": "1"
        });
        let data5 = json!({
            "數": [1]
        });
        let data6 = json!({
            "數": [1,2]
        });
        let data7 = json!({
            "數": [1,2,3]
        });
        let data8 = json!({
            "數": [1,2,3,4]
        });
        let data9 = json!({
            "數": [1,2,"3"]
        });
        assert!(Validator {}.validate_category(&category, &data1).await == false);
        assert!(Validator {}.validate_category(&category, &data2).await == false);
        assert!(Validator {}.validate_category(&category, &data3).await == false);
        assert!(Validator {}.validate_category(&category, &data4).await == false);
        assert!(Validator {}.validate_category(&category, &data5).await == false);
        assert!(Validator {}.validate_category(&category, &data6).await == true);
        assert!(Validator {}.validate_category(&category, &data7).await == true);
        assert!(Validator {}.validate_category(&category, &data8).await == false);
        assert!(Validator {}.validate_category(&category, &data9).await == false);
        Ok(())
    }
}
