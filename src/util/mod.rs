mod board;
pub use board::*;

mod article_digest;
pub use article_digest::*;

mod article;
pub use article::*;

pub fn is_mobile(user_agent: &str) -> bool {
    let s = user_agent.to_lowercase();
    if s.find("ipad").is_some() {
        false
    } else {
        s.find("mobile").is_some()
    }
}
