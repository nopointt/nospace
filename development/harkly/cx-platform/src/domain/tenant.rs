use std::fmt;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct TenantId(pub Uuid);

impl fmt::Display for TenantId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Uuid> for TenantId {
    fn from(id: Uuid) -> Self {
        TenantId(id)
    }
}

#[derive(Debug, Clone)]
pub struct Tenant {
    pub id: TenantId,
    pub name: String,
    pub billing_tier: String,
}
