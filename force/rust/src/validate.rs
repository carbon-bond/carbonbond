use crate::error::{
    Error,
    ValidationError::{self, *},
};
use crate::instance_defs::Bond;
use crate::*;
use serde_json::Value;

#[async_trait::async_trait]
pub trait ValidatorTrait {
    type OtherError;
    // XXX: 是否弄個 get_article 就好？
    async fn validate_bond(&self, bondee: &Bondee, data: &Bond) -> Result<bool, Self::OtherError>;
    async fn validate_basic_datatype(
        &self,
        data_type: &BasicDataType,
        data: &Value,
    ) -> Result<Option<ValidationError>, Self::OtherError> {
        log::trace!("驗證力語言基本型態： {:?} => {:?}", data_type, data);
        macro_rules! ret {
            ($err:expr) => {
                return Ok(Some($err))
            };
        }
        match (data_type, data) {
            (BasicDataType::Number, Value::Number(n)) => {
                if !n.is_i64() {
                    ret!(NotI64(n.clone()));
                }
            }
            (BasicDataType::OneLine, Value::String(s)) => {
                if s.contains('\n') {
                    ret!(NotOneline(s.clone()));
                }
            }
            (BasicDataType::Text(None), Value::String(_)) => (),
            (BasicDataType::Text(Some(regex)), Value::String(s)) => {
                if !regex.is_match(s) {
                    ret!(RegexFail(regex.clone(), s.clone()))
                }
            }
            (BasicDataType::Bond(bondee), data) => {
                let bond: Bond = match serde_json::from_value(data.clone()) {
                    Ok(b) => b,
                    Err(e) => {
                        ret!(Json(e));
                    }
                };
                // XXX: 檢查鍵能和標籤
                if !self.validate_bond(bondee, &bond).await? {
                    ret!(BondFail);
                }
            }
            _ => ret!(TypeMismatch(data_type.clone(), data.clone())),
        }
        Ok(None)
    }
    async fn validate_datatype(
        &self,
        data_type: &DataType,
        data: &Value,
    ) -> Result<Option<ValidationError>, Self::OtherError> {
        match data_type {
            DataType::Optional(t) => {
                if !data.is_null() {
                    return self.validate_basic_datatype(t, data).await;
                }
            }
            DataType::Single(t) => return self.validate_basic_datatype(t, data).await,
            DataType::Array { t, min, max } => match data {
                Value::Array(values) => {
                    if values.len() < *min || values.len() > *max {
                        return Ok(Some(ArrayLengthMismatch {
                            max: *max,
                            min: *min,
                            actual: values.len(),
                        }));
                    }
                    for value in values {
                        let opt = self.validate_basic_datatype(t, value).await?;
                        if opt.is_some() {
                            return Ok(opt);
                        }
                    }
                }
                _ => return Ok(Some(NotArray(data.clone()))),
            },
        };
        Ok(None)
    }
    async fn validate_category(
        &self,
        category: &Category,
        data: &Value,
    ) -> Result<(), Error<Self::OtherError>> {
        for field in &category.fields {
            log::trace!("驗證力語言欄位 {:?} => {:?}", field, data[&field.name]);
            match self
                .validate_datatype(&field.datatype, &data[&field.name])
                .await
            {
                Err(e) => return Err(Error::Other(e)),
                Ok(Some(e)) => return e.to_res(&field.name),
                Ok(None) => (),
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    impl PartialEq for ValidationError {
        fn eq(&self, other: &Self) -> bool {
            // XXX: 這樣定義相等不曉得會不會出問題…
            format!("{:?}", self) == format!("{:?}", other)
        }
    }
    struct Validator;
    #[async_trait::async_trait]
    impl ValidatorTrait for Validator {
        type OtherError = ();
        async fn validate_bond(&self, _bondee: &Bondee, _data: &Bond) -> Result<bool, ()> {
            Ok(true) // 測試中不檢查
        }
    }
    impl Validator {
        async fn validate(&self, category: &Category, data: &Value) -> bool {
            self.validate_category(category, data).await.is_ok()
        }
    }
    #[tokio::test]
    async fn test_oneline() -> ForceResult<()> {
        let source = "測試 {單行 文字}";
        let category = parse_category(source)?;
        let data1 = json!({
            "文字": "hihi"
        });
        let bad_string = "hi\nhi".to_owned();
        let data2 = json!({ "文字": &bad_string });
        assert!(Validator.validate(&category, &data1).await);
        assert_eq!(
            Validator
                .validate_category(&category, &data2)
                .await
                .unwrap_err()
                .validation_err()
                .unwrap(),
            ("文字".to_owned(), NotOneline(bad_string))
        );
        Ok(())
    }
    #[tokio::test]
    async fn test_number() -> ForceResult<()> {
        let source = "測試 {數字 數}";
        let category = parse_category(source)?;
        let data1 = json!({
            "數": 1
        });
        let data2 = json!({
            "數": "1"
        });
        assert!(Validator.validate(&category, &data1).await);
        assert!(Validator.validate(&category, &data2).await == false);
        Ok(())
    }
    #[tokio::test]
    async fn test_regex() -> ForceResult<()> {
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
        assert!(Validator.validate(&category, &data1).await == false);
        assert!(Validator.validate(&category, &data2).await == true);
        assert!(Validator.validate(&category, &data3).await == false);
        Ok(())
    }
    #[tokio::test]
    async fn test_optional() -> ForceResult<()> {
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
        assert!(Validator.validate(&category, &data1).await == true);
        assert!(Validator.validate(&category, &data2).await == true);
        assert!(Validator.validate(&category, &data3).await == true);
        assert!(Validator.validate(&category, &data4).await == false);
        Ok(())
    }
    #[tokio::test]
    async fn test_array() -> ForceResult<()> {
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
        assert!(Validator.validate(&category, &data1).await == false);
        assert!(Validator.validate(&category, &data2).await == false);
        assert!(Validator.validate(&category, &data3).await == false);
        assert!(Validator.validate(&category, &data4).await == false);
        assert!(Validator.validate(&category, &data5).await == false);
        assert!(Validator.validate(&category, &data6).await == true);
        assert!(Validator.validate(&category, &data7).await == true);
        assert!(Validator.validate(&category, &data8).await == false);
        assert!(Validator.validate(&category, &data9).await == false);
        Ok(())
    }
}
