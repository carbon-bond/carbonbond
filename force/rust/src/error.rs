use serde_json::Error as JsonError;
use std::fmt::{Debug, Display, Formatter, Result};
#[derive(Debug)]
pub enum Error<OtherError> {
    // Validation,
    Json(JsonError),
    Other(OtherError),
}

impl<E: Display + Debug> Display for Error<E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        write!(f, "{:?}", self)
    }
}
impl<E: Display + Debug> std::error::Error for Error<E> {}
