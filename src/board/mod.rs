extern crate serde_json;
use serde::{Serialize, Deserialize};



#[derive(Deserialize, Serialize, Debug)]
pub struct Threshold {
    bond_energy: i32,
    identity: usize // 0平民, 1黨員, 2黨代表, 3黨主席
}
#[derive(Deserialize, Serialize, Debug)]
pub struct NodeCol {
    col_name: String,
    col_type: String,
    restriction: String,
}
#[derive(Deserialize, Serialize, Debug)]
pub struct NodeTemplate {
    class_name: String,
    transfusable: bool,
    is_question: bool,
    show_in_linear_view: bool,
    rootable: bool,
    threshold_to_post: Threshold,
    attached_to: Vec<String>,
    structure: Vec<NodeCol>
}
