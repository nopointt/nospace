use crate::domain::tenant::TenantId;
use chrono::{DateTime, Utc};
use std::fmt;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum ResearchState {
    Draft,
    ConfiguringSources,
    CollectingOSINT,
    ProcessingData,
    ReadyForSampling,
    Completed,
    Archived,
}

impl fmt::Display for ResearchState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = match self {
            ResearchState::Draft => "Draft",
            ResearchState::ConfiguringSources => "ConfiguringSources",
            ResearchState::CollectingOSINT => "CollectingOSINT",
            ResearchState::ProcessingData => "ProcessingData",
            ResearchState::ReadyForSampling => "ReadyForSampling",
            ResearchState::Completed => "Completed",
            ResearchState::Archived => "Archived",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Research {
    pub id: Uuid,
    pub tenant_id: TenantId,
    pub name: String,
    pub state: ResearchState,
    pub source_config: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

pub fn new_research(tenant_id: TenantId, name: String) -> Research {
    Research {
        id: Uuid::new_v4(),
        tenant_id,
        name,
        state: ResearchState::Draft,
        source_config: serde_json::Value::Object(Default::default()),
        created_at: Utc::now(),
    }
}
