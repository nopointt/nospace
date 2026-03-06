# CX OSINT Platform - Technical Specification

## 1. Executive Summary

**CX OSINT Platform** is a Rust-based Customer Experience Open-Source Intelligence system designed to aggregate, process, and analyze customer data from multiple sources to provide actionable insights for customer experience management.

### 1.1 Core Objectives
- Collect customer interaction data from diverse sources (social media, reviews, support tickets, surveys)
- Process and normalize data through a unified ETL pipeline
- Store structured data in a relational database with full-text search capabilities
- Provide domain models for customer sentiment, journey mapping, and experience analytics
- Enable real-time and batch processing modes

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CX OSINT Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Sources   │  │    ETL      │  │        Domain           │  │
│  │  Layer      │──│   Pipeline  │──│       Models            │  │
│  │             │  │             │  │                         │  │
│  │ - Social    │  │ - Extract   │  │ - Customer              │  │
│  │ - Reviews   │  │ - Transform │  │ - Interaction           │  │
│  │ - Support   │  │ - Load      │  │ - Sentiment             │  │
│  │ - Surveys   │  │ - Validate  │  │ - Journey               │  │
│  │ - API       │  │ - Enrich    │  │ - Analytics             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  - PostgreSQL with SQLx                                    │  │
│  │  - Connection pooling                                      │  │
│  │  - Migrations management                                   │  │
│  │  - Full-text search (tsvector)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Core Technologies
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | Rust 1.75+ | Memory safety, performance, concurrency |
| Database | PostgreSQL 15+ | Relational integrity, JSONB, full-text search |
| DB Access | SQLx | Compile-time query verification, async |
| Serialization | Serde | Flexible JSON/binary serialization |
| Async Runtime | Tokio | Mature async ecosystem, performance |
| HTTP Client | Reqwest | Async HTTP with connection pooling |
| Logging | Tracing | Structured logging, async-aware |
| Error Handling | Thiserror + Anyhow | Type-safe errors, context propagation |

### 3.2 Key Crates (Dependencies)
```toml
[dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# HTTP client
reqwest = { version = "0.11", features = ["json", "gzip"] }

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging & tracing
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Date/time
chrono = { version = "0.4", features = ["serde"] }

# UUID
uuid = { version = "1.6", features = ["v4", "serde"] }

# Configuration
config = "0.14"
dotenvy = "0.15"

# Text processing
regex = "1.10"
unicode-normalization = "0.1"

# Parallelism
rayon = "1.8"
async-stream = "0.3"
```

---

## 4. Module Specifications

### 4.1 Sources Module (`src/sources/`)

**Purpose:** Abstract data source connectors with unified interface

#### 4.1.1 Source Trait
```rust
pub trait DataSource: Send + Sync {
    fn name(&self) -> &'static str;
    fn source_type(&self) -> SourceType;
    async fn extract(&self, config: &SourceConfig) -> Result<ExtractStream>;
    fn schema(&self) -> SourceSchema;
}
```

#### 4.1.2 Supported Sources
| Source | Type | Protocol | Data Format |
|--------|------|----------|-------------|
| Twitter/X | Social | REST API v2 | JSON |
| Reddit | Social | OAuth2 + JSON | JSON |
| Trustpilot | Reviews | API Key | JSON |
| Google Reviews | Reviews | OAuth2 | JSON |
| Zendesk | Support | API Token | JSON |
| Intercom | Support | Bearer Token | JSON |
| SurveyMonkey | Surveys | OAuth2 | JSON |
| Custom Webhook | Ingest | HTTP POST | JSON |

#### 4.1.3 Source Configuration
```rust
pub struct SourceConfig {
    pub id: Uuid,
    pub name: String,
    pub source_type: SourceType,
    pub credentials: Credentials,
    pub polling_interval: Duration,
    pub filters: SourceFilters,
    pub rate_limit: RateLimitConfig,
}
```

#### 4.1.4 Rate Limiting Strategy
- Token bucket algorithm per source
- Configurable requests/minute with burst capacity
- Automatic backoff on 429 responses
- Distributed rate limiting ready (Redis-compatible)

---

### 4.2 ETL Module (`src/etl/`)

**Purpose:** Extract, Transform, Load pipeline with validation and enrichment

#### 4.2.1 Pipeline Architecture
```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐
│ Extract  │───▶│ Transform │───▶│  Validate  │───▶│   Load   │
│          │    │           │    │            │    │          │
│ - Fetch  │    │ - Normalize│   │ - Schema   │    │ - Insert │
│ - Stream │    │ - Enrich  │    │ - Business │    │ - Update │
│ - Batch  │    │ - Dedupe  │    │ - Quality  │    │ - Upsert │
└──────────┘    └───────────┘    └────────────┘    └──────────┘
```

#### 4.2.2 Extract Phase
```rust
pub struct Extractor {
    sources: Vec<Box<dyn DataSource>>,
    concurrency: usize,
    buffer_size: usize,
}

impl Extractor {
    pub async fn extract_all(&self) -> Result<Vec<RawDocument>>;
    pub fn extract_stream(&self) -> Result<impl Stream<Item = RawDocument>>;
}
```

**Features:**
- Parallel extraction from multiple sources
- Checkpoint/resume capability
- Incremental extraction (cursor-based)
- Backpressure handling

#### 4.2.3 Transform Phase
```rust
pub trait Transformer: Send + Sync {
    async fn transform(&self, raw: RawDocument) -> Result<TransformedDocument>;
}

// Built-in transformers:
// - TextNormalizer: Unicode normalization, case folding
// - LanguageDetector: Identify document language
// - EntityExtractor: Extract names, organizations, locations
// - TimestampParser: Normalize timestamps to UTC
// - Deduplicator: Hash-based duplicate detection
```

**Transformations Applied:**
1. **Text Normalization**
   - NFC/NFKC Unicode normalization
   - Whitespace standardization
   - HTML entity decoding
   - URL decoding

2. **Enrichment**
   - Language detection (fasttext-rs or lingua-rs)
   - Named entity recognition
   - Topic classification
   - Customer ID resolution

3. **Deduplication**
   - Content hashing (SHA-256)
   - Fuzzy matching for near-duplicates
   - Time-window deduplication

#### 4.2.4 Validate Phase
```rust
pub struct Validator {
    rules: Vec<ValidationRule>,
}

pub trait ValidationRule: Send + Sync {
    fn validate(&self, doc: &TransformedDocument) -> ValidationResult;
}

// Built-in rules:
// - SchemaValidation: Required fields present
// - TypeValidation: Field types match schema
// - RangeValidation: Numeric values in range
// - RegexValidation: Pattern matching
// - BusinessRules: Domain-specific constraints
```

**Validation Categories:**
- **Schema Validation:** Required fields, data types
- **Quality Validation:** Text length, completeness score
- **Business Validation:** Customer exists, valid interaction type
- **Temporal Validation:** Timestamp not in future

#### 4.2.5 Load Phase
```rust
pub struct Loader {
    pool: PgPool,
    batch_size: usize,
    conflict_strategy: ConflictStrategy,
}

pub enum ConflictStrategy {
    Skip,
    Overwrite,
    Merge(MergeConfig),
    Upsert(UpsertConfig),
}
```

**Load Strategies:**
- **Batch Insert:** Group records for efficiency (100-1000 per batch)
- **Upsert:** ON CONFLICT with update logic
- **Merge:** Field-level merge with timestamp precedence
- **Transaction Support:** Atomic batch operations

---

### 4.3 Domain Module (`src/domain/`)

**Purpose:** Business logic, entities, and value objects

#### 4.3.1 Core Entities

```rust
// Customer aggregate root
pub struct Customer {
    pub id: CustomerId,
    pub external_ids: HashMap<SourceType, String>,
    pub profile: CustomerProfile,
    pub segments: Vec<CustomerSegment>,
    pub lifetime_value: MonetaryValue,
    pub risk_score: RiskScore,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct CustomerProfile {
    pub name: Option<String>,
    pub email: Option<Email>,
    pub phone: Option<PhoneNumber>,
    pub location: Option<Location>,
    pub preferred_language: Language,
    pub timezone: Timezone,
}

// Interaction entity
pub struct Interaction {
    pub id: InteractionId,
    pub customer_id: CustomerId,
    pub interaction_type: InteractionType,
    pub channel: Channel,
    pub content: InteractionContent,
    pub sentiment: Sentiment,
    pub metadata: InteractionMetadata,
    pub occurred_at: DateTime<Utc>,
    pub processed_at: DateTime<Utc>,
}

pub enum InteractionType {
    Complaint,
    Inquiry,
    Feedback,
    Review,
    SocialMention,
    SupportTicket,
    SurveyResponse,
}

pub enum Channel {
    Email,
    Phone,
    Chat,
    SocialMedia(SocialPlatform),
    Web,
    InPerson,
}

// Sentiment value object
pub struct Sentiment {
    pub score: f32,           // -1.0 to 1.0
    pub magnitude: f32,       // 0.0 to 1.0 (confidence)
    pub label: SentimentLabel,
    pub aspects: Vec<AspectSentiment>,
}

pub enum SentimentLabel {
    VeryNegative,  // score < -0.6
    Negative,      // -0.6 <= score < -0.2
    Neutral,       // -0.2 <= score <= 0.2
    Positive,      // 0.2 < score <= 0.6
    VeryPositive,  // score > 0.6
}

pub struct AspectSentiment {
    pub aspect: String,       // e.g., "price", "quality", "support"
    pub score: f32,
    pub mention_text: String,
}

// Customer Journey
pub struct CustomerJourney {
    pub id: JourneyId,
    pub customer_id: CustomerId,
    pub stages: Vec<JourneyStage>,
    pub current_stage: StageIndex,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

pub struct JourneyStage {
    pub stage_type: StageType,
    pub entered_at: DateTime<Utc>,
    pub exited_at: Option<DateTime<Utc>>,
    pub interactions: Vec<InteractionId>,
    pub sentiment_trajectory: Vec<Sentiment>,
}

pub enum StageType {
    Awareness,
    Consideration,
    Purchase,
    Onboarding,
    Adoption,
    Retention,
    Advocacy,
    Churn,
}
```

#### 4.3.2 Domain Services

```rust
// Sentiment Analysis Service
pub trait SentimentAnalyzer: Send + Sync {
    async fn analyze(&self, text: &str, language: Language) -> Result<Sentiment>;
    async fn analyze_batch(&self, texts: &[String]) -> Result<Vec<Sentiment>>;
}

// Customer Resolution Service
pub struct CustomerResolver {
    matching_rules: Vec<MatchingRule>,
}

pub trait MatchingRule: Send + Sync {
    fn matches(&self, profile1: &CustomerProfile, profile2: &CustomerProfile) -> bool;
}

// Rules:
// - EmailMatch: Exact email comparison
// - PhoneMatch: Normalized phone comparison
// - NameLocationMatch: Fuzzy name + same location
// - ExternalIdMatch: Same external ID from source

// Journey Tracking Service
pub struct JourneyTracker {
    stage_definitions: Vec<StageDefinition>,
    transition_rules: TransitionRules,
}

// Analytics Service
pub trait AnalyticsProvider: Send + Sync {
    async fn customer_satisfaction_score(&self, customer_id: CustomerId) -> Result<CSAT>;
    async fn net_promoter_score(&self, period: DateRange) -> Result<NPS>;
    async fn sentiment_trend(&self, customer_id: CustomerId, period: DateRange) -> Result<Trend>;
    async fn interaction_volume(&self, filters: InteractionFilters) -> Result<VolumeMetrics>;
}
```

#### 4.3.3 Repositories (Domain Layer)

```rust
#[async_trait]
pub trait CustomerRepository: Send + Sync {
    async fn find_by_id(&self, id: CustomerId) -> Result<Option<Customer>>;
    async fn find_by_external_id(&self, source: SourceType, external_id: &str) -> Result<Option<Customer>>;
    async fn find_by_email(&self, email: &Email) -> Result<Vec<Customer>>;
    async fn save(&self, customer: &Customer) -> Result<()>;
    async fn merge(&self, primary: CustomerId, secondary: CustomerId) -> Result<Customer>;
}

#[async_trait]
pub trait InteractionRepository: Send + Sync {
    async fn find_by_id(&self, id: InteractionId) -> Result<Option<Interaction>>;
    async fn find_by_customer(&self, customer_id: CustomerId, filters: InteractionFilters) -> Result<Vec<Interaction>>;
    async fn find_by_content_search(&self, query: &str, filters: InteractionFilters) -> Result<Vec<Interaction>>;
    async fn save(&self, interaction: &Interaction) -> Result<()>;
    async fn save_batch(&self, interactions: &[Interaction]) -> Result<()>;
}
```

---

### 4.4 Database Module (`src/db/`)

**Purpose:** Database access, connection management, migrations

#### 4.4.1 Database Schema

```sql
-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email CITEXT,
    phone TEXT,
    location_json JSONB,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    lifetime_value_cents BIGINT DEFAULT 0,
    risk_score INTEGER DEFAULT 50,
    external_ids JSONB DEFAULT '{}',
    segments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_external_ids ON customers USING GIN(external_ids);
CREATE INDEX idx_customers_segments ON customers USING GIN(segments);

-- Interactions table
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    channel_details JSONB,
    content_text TEXT NOT NULL,
    content_html TEXT,
    language VARCHAR(10) DEFAULT 'en',
    sentiment_score REAL,
    sentiment_magnitude REAL,
    sentiment_label VARCHAR(20),
    aspects_json JSONB,
    metadata_json JSONB,
    source_type VARCHAR(50) NOT NULL,
    source_id TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_channel ON interactions(channel);
CREATE INDEX idx_interactions_source ON interactions(source_type, source_id);
CREATE INDEX idx_interactions_occurred ON interactions(occurred_at);
CREATE INDEX idx_interactions_sentiment ON interactions(sentiment_label);
CREATE INDEX idx_interactions_content ON interactions USING GIN(to_tsvector('english', content_text));

-- Customer Journeys table
CREATE TABLE customer_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) NOT NULL,
    stage_history JSONB NOT NULL DEFAULT '[]',
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journeys_customer ON customer_journeys(customer_id);
CREATE INDEX idx_journeys_current_stage ON customer_journeys(current_stage);

-- Sources configuration table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    config_json JSONB NOT NULL,
    credentials_encrypted BYTEA NOT NULL,
    polling_interval_seconds INTEGER DEFAULT 300,
    filters_json JSONB,
    rate_limit_config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sources_type ON data_sources(source_type);
CREATE INDEX idx_sources_active ON data_sources(is_active) WHERE is_active = true;

-- Processing checkpoints table
CREATE TABLE etl_checkpoints (
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    checkpoint_key TEXT NOT NULL,
    checkpoint_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (source_id, checkpoint_key)
);

-- Analytics materialized views
CREATE MATERIALIZED VIEW mv_customer_sentiment_summary AS
SELECT 
    customer_id,
    DATE_TRUNC('day', occurred_at) AS date,
    COUNT(*) AS interaction_count,
    AVG(sentiment_score) AS avg_sentiment,
    MIN(sentiment_score) AS min_sentiment,
    MAX(sentiment_score) AS max_sentiment,
    COUNT(*) FILTER (WHERE sentiment_label = 'VeryNegative' OR sentiment_label = 'Negative') AS negative_count,
    COUNT(*) FILTER (WHERE sentiment_label = 'VeryPositive' OR sentiment_label = 'Positive') AS positive_count
FROM interactions
GROUP BY customer_id, DATE_TRUNC('day', occurred_at);

CREATE INDEX idx_mv_sentiment_customer_date ON mv_customer_sentiment_summary(customer_id, date);
```

#### 4.4.2 Connection Management

```rust
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn connect(config: &DbConfig) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(config.max_connections)
            .min_connections(config.min_connections)
            .acquire_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .connect_with(config.to_pg_connect_options())
            .await?;
        
        Ok(Self { pool })
    }
    
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
    
    pub async fn migrate(&self) -> Result<()> {
        sqlx::migrate!("./migrations")
            .run(&self.pool)
            .await
            .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))
    }
}
```

#### 4.4.3 Repository Implementations

```rust
pub struct SqlCustomerRepository {
    pool: PgPool,
}

#[async_trait]
impl CustomerRepository for SqlCustomerRepository {
    async fn find_by_id(&self, id: CustomerId) -> Result<Option<Customer>> {
        let customer = sqlx::query_as!(
            CustomerModel,
            r#"
            SELECT 
                id, name, email, phone, 
                location_json as "location_json: Json<Option<Location>>",
                preferred_language, timezone,
                lifetime_value_cents, risk_score,
                external_ids as "external_ids: Json<HashMap<String, String>>",
                segments, created_at, updated_at
            FROM customers
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(customer.map(|c| c.into_domain()))
    }
    
    // ... other methods
}
```

---

## 5. Configuration

### 5.1 Configuration Structure

```rust
pub struct AppConfig {
    pub app: AppSettings,
    pub database: DbConfig,
    pub etl: EtlConfig,
    pub sources: SourcesConfig,
    pub logging: LoggingConfig,
}

pub struct AppSettings {
    pub name: String,
    pub environment: Environment,
    pub version: String,
}

pub enum Environment {
    Development,
    Staging,
    Production,
}

pub struct DbConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub ssl_mode: SslMode,
}

pub struct EtlConfig {
    pub extract_concurrency: usize,
    pub transform_batch_size: usize,
    pub load_batch_size: usize,
    pub checkpoint_interval: Duration,
    pub error_threshold: usize,
}

pub struct SourcesConfig {
    pub sources: Vec<SourceConfig>,
}

pub struct LoggingConfig {
    pub level: Level,
    pub format: LogFormat,
    pub output: LogOutput,
}
```

### 5.2 Configuration File Example

```yaml
# config.yaml
app:
  name: "cx-osint-platform"
  environment: "development"
  version: "0.1.0"

database:
  host: "localhost"
  port: 5432
  database: "cx_platform"
  username: "cx_user"
  password: "${DB_PASSWORD}"
  max_connections: 20
  min_connections: 5
  ssl_mode: "prefer"

etl:
  extract_concurrency: 10
  transform_batch_size: 100
  load_batch_size: 500
  checkpoint_interval: "1m"
  error_threshold: 100

sources:
  - id: "550e8400-e29b-41d4-a716-446655440000"
    name: "Twitter Brand Mentions"
    source_type: "twitter"
    credentials:
      api_key: "${TWITTER_API_KEY}"
      api_secret: "${TWITTER_API_SECRET}"
      bearer_token: "${TWITTER_BEARER_TOKEN}"
    polling_interval: "5m"
    filters:
      keywords: ["@ourbrand", "ourbrand"]
      language: ["en"]
    rate_limit:
      requests_per_minute: 300
      burst: 50

logging:
  level: "info"
  format: "json"
  output: "stdout"
```

---

## 6. Error Handling Strategy

### 6.1 Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum CxPlatformError {
    #[error("Database error: {0}")]
    Database(#[from] DatabaseError),
    
    #[error("Source error: {0}")]
    Source(#[from] SourceError),
    
    #[error("ETL error: {0}")]
    Etl(#[from] EtlError),
    
    #[error("Domain error: {0}")]
    Domain(#[from] DomainError),
    
    #[error("Configuration error: {0}")]
    Configuration(#[from] ConfigError),
    
    #[error("External API error: {source}: {message}")]
    ExternalApi {
        source: String,
        message: String,
        status_code: Option<u16>,
    },
    
    #[error("Validation failed: {0}")]
    Validation(Vec<ValidationError>),
}

#[derive(Debug, thiserror::Error)]
pub enum SourceError {
    #[error("Rate limit exceeded for source {0}")]
    RateLimited(String),
    
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    
    #[error("Source unavailable: {0}")]
    Unavailable(String),
    
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
}

#[derive(Debug, thiserror::Error)]
pub enum EtlError {
    #[error("Transform failed: {0}")]
    TransformFailed(String),
    
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
    
    #[error("Load failed: {0}")]
    LoadFailed(String),
    
    #[error("Checkpoint error: {0}")]
    CheckpointError(String),
}
```

### 6.2 Error Recovery Strategies

| Error Type | Strategy | Retry | Fallback |
|------------|----------|-------|----------|
| Rate Limit | Exponential backoff | Yes (5x) | Queue for later |
| Network Timeout | Retry with backoff | Yes (3x) | Skip batch, log |
| Authentication | Alert, pause source | No | Disable source |
| Validation Error | Log, quarantine | No | Dead letter queue |
| Database Deadlock | Retry transaction | Yes (3x) | Fail batch |
| Schema Mismatch | Alert, skip record | No | Log for review |

---

## 7. Performance Considerations

### 7.1 Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Ingestion Rate | 10,000 docs/min | Batch mode |
| Real-time Latency | < 500ms | Per-document processing |
| Query Response | < 100ms | P95 for simple queries |
| Full-text Search | < 500ms | P95 for complex queries |
| Batch Processing | 1M docs/hour | Overnight processing |

### 7.2 Optimization Strategies

1. **Database**
   - Connection pooling (20-50 connections)
   - Prepared statements (SQLx compile-time)
   - Batch inserts (500-1000 rows)
   - Index optimization (covering indexes)
   - Partitioning by date for large tables

2. **ETL Pipeline**
   - Async streaming (backpressure-aware)
   - Parallel source extraction
   - Batch transformations
   - Memory-mapped files for large datasets

3. **Caching**
   - Customer profile cache (Redis-compatible)
   - Query result cache for analytics
   - Source metadata cache

4. **Concurrency**
   - Tokio async runtime
   - Rayon for CPU-bound tasks
   - Channel-based communication
   - Semaphore-based limiting

---

## 8. Security

### 8.1 Data Protection

| Aspect | Implementation |
|--------|----------------|
| Credentials | Encrypted at rest (AES-256-GCM) |
| PII | Field-level encryption option |
| Transit | TLS 1.3 for all connections |
| Audit | Immutable audit log for sensitive ops |
| Access | Role-based access control (RBAC) |

### 8.2 Credential Management

```rust
pub struct CredentialManager {
    encryption_key: MasterKey,
}

impl CredentialManager {
    pub fn encrypt(&self, credentials: &Credentials) -> Result<EncryptedCredentials> {
        // AES-256-GCM encryption
    }
    
    pub fn decrypt(&self, encrypted: &EncryptedCredentials) -> Result<Credentials> {
        // Decryption with authentication
    }
}
```

### 8.3 Compliance Considerations

- **GDPR:** Right to erasure, data portability
- **CCPA:** Consumer disclosure, deletion rights
- **Data Retention:** Configurable retention policies
- **Audit Trail:** All data access logged

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
           /\
          /  \
         / E2E \        (10%) - Full pipeline tests
        /------\
       /        \
      / Integration\    (30%) - Repository, service tests
     /--------------\
    /                \
   /     Unit Tests    \  (60%) - Domain logic, transformers
  /--------------------\
```

### 9.2 Test Categories

```rust
// Unit tests (in each module)
#[cfg(test)]
mod tests {
    #[test]
    fn test_sentiment_label_from_score() {
        assert_eq!(SentimentLabel::from_score(-0.8), SentimentLabel::VeryNegative);
    }
}

// Integration tests (tests/integration/)
#[tokio::test]
async fn test_etl_pipeline_end_to_end() {
    // Spin up test DB with testcontainers
    // Run full ETL pipeline
    // Verify results in database
}

// Property-based tests
#[test]
fn test_text_normalization_preserves_meaning() {
    proptest!(|(text in ".{10,1000}")| {
        let normalized = normalize_text(&text);
        // Properties: length reduced, valid UTF-8, etc.
    });
}
```

### 9.3 Test Infrastructure

- **Testcontainers:** PostgreSQL for integration tests
- **Mock servers:** WireMock for external API mocking
- **Fixtures:** Sample data for each source type
- **Coverage:** cargo-llvm-cov for coverage reports

---

## 10. Deployment

### 10.1 Deployment Modes

1. **Standalone Binary**
   ```bash
   ./cx-platform --config config.yaml
   ```

2. **Docker Container**
   ```dockerfile
   FROM rust:1.75-slim as builder
   # Build steps...
   
   FROM debian:bookworm-slim
   COPY --from=builder /app/cx-platform /usr/local/bin/
   CMD ["cx-platform"]
   ```

3. **Kubernetes**
   - Deployment with HPA
   - ConfigMap for configuration
   - Secret for credentials
   - PersistentVolume for checkpoints

### 10.2 Health Checks

```rust
pub struct HealthStatus {
    pub status: Status,
    pub database: ComponentHealth,
    pub sources: Vec<SourceHealth>,
    pub etl: EtlHealth,
    pub uptime: Duration,
}

// GET /health
// Returns: {"status": "healthy", "database": "up", ...}
```

### 10.3 Monitoring

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| ingestion_rate | Counter | < 100/min for 5m |
| processing_latency | Histogram | P99 > 5s |
| error_rate | Counter | > 1% for 5m |
| db_connections | Gauge | > 90% capacity |
| queue_depth | Gauge | > 10,000 |

---

## 11. Future Enhancements

### Phase 2
- [ ] Machine learning sentiment model (custom training)
- [ ] Real-time streaming (Apache Kafka integration)
- [ ] GraphQL API for queries
- [ ] Web dashboard (React + TypeScript)
- [ ] Alert rules engine

### Phase 3
- [ ] Multi-tenant architecture
- [ ] Custom source builder (low-code)
- [ ] Advanced analytics (cohort analysis, churn prediction)
- [ ] Integration marketplace (pre-built connectors)
- [ ] Automated journey mapping

---

## 12. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| OSINT | Open-Source Intelligence |
| CX | Customer Experience |
| ETL | Extract, Transform, Load |
| CSAT | Customer Satisfaction Score |
| NPS | Net Promoter Score |
| PII | Personally Identifiable Information |

### B. Reference Documents

- [SQLx Documentation](https://docs.rs/sqlx)
- [Tokio Documentation](https://docs.rs/tokio)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [12-Factor App Methodology](https://12factor.net/)

### C. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-06 | PostgreSQL over NoSQL | ACID compliance, complex queries, JSONB flexibility |
| 2026-03-06 | SQLx over Diesel | Async support, compile-time query verification |
| 2026-03-06 | Domain-Driven Design | Complex business logic, clear boundaries |

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-06  
**Author:** CX Platform Team
