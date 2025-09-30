# Database and Table Structure Explanation

## 📊 Complete Database Overview

### **Total Databases: 107**

---

## 🗄️ **1. Master Database (1 database)**

**Purpose:** Central registry for tenant routing only - contains ZERO operational data

**Database Name:** `master_registry`

**Location:** Shared infrastructure (OCI Mumbai)

**Size:** < 1 MB

### Tables in Master Database (3 tables):

#### **Table 1: `tenants`**
- **Purpose:** Store tenant metadata for routing
- **Columns:**
    - `id` (UUID) - Primary key
    - `subdomain` (string) - "zoo", "fort", "garden" etc.
    - `db_host` (string) - "tenant-zoo.rds.amazonaws.com"
    - `db_name` (string) - "tenant_zoo_prod"
    - `db_user` (string) - "zoo_app_user"
    - `db_password_encrypted` (text) - AES-256 encrypted password
    - `db_ocid` (string) - OCI database instance ID
    - `tier` (string) - "basic", "standard", "premium", "enterprise"
    - `status` (string) - "active", "suspended", "maintenance"
    - `max_events` (integer) - Tier limit
    - `monthly_cost_bdt` (decimal) - BDT 12,600 - 45,000
    - `created_at` (timestamp)
- **Records:** 106 rows (one per tenant)

#### **Table 2: `tenant_configs`**
- **Purpose:** Store tenant-specific configurations
- **Columns:**
    - `id` (UUID) - Primary key
    - `tenant_id` (UUID) - Foreign key to tenants
    - `pricing_rules` (JSONB) - Dynamic pricing configuration
    - `validation_rules` (JSONB) - Checkout validation logic
    - `branding_config` (JSONB) - Theme, logo, colors
    - `payment_gateways` (JSONB) - Gateway credentials (encrypted)
    - `features_enabled` (JSONB) - Feature flags
    - `updated_at` (timestamp)
- **Records:** 106 rows (one per tenant)

#### **Table 3: `tenant_health`**
- **Purpose:** Health monitoring and status tracking
- **Columns:**
    - `id` (bigserial) - Primary key
    - `tenant_id` (UUID) - Foreign key to tenants
    - `check_type` (string) - "database", "api", "cache"
    - `status` (string) - "healthy", "degraded", "critical"
    - `response_time_ms` (integer)
    - `details` (JSONB) - Error messages, metrics
    - `checked_at` (timestamp)
- **Records:** Grows over time (purged after 30 days), ~300,000 rows active

**Total Master Database Tables:** 3 tables

---

## 💾 **2. Tenant Databases (106 databases)**

**Purpose:** Store ALL operational data for each tenant in complete isolation

**Naming Pattern:** `tenant_{name}_prod`
- Example: `tenant_zoo_prod`, `tenant_fort_prod`, `tenant_garden_prod`

**Location:** Each tenant has their own PostgreSQL 16 instance in OCI Mumbai (with Multi-AZ standby)

**Size per tenant:** 50 GB - 500 GB (varies by activity)

### Tables in EACH Tenant Database (12 tables per tenant × 106 tenants = 1,272 tables total):

#### **Table 1: `events`**
- **Purpose:** Store event/attraction information
- **Columns:**
    - `id` (UUID) - Primary key
    - `name` (string) - "Zoo Safari Tour", "Fort Night Visit"
    - `description` (text)
    - `event_date` (timestamp)
    - `venue_id` (UUID)
    - `capacity` (integer)
    - `available_tickets` (integer)
    - `status` (string) - "draft", "published", "sold_out", "cancelled"
    - `metadata` (JSONB) - Tenant-specific custom fields
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 100 - 5,000 events (depending on venue type)

#### **Table 2: `tickets`**
- **Purpose:** Individual ticket inventory
- **Columns:**
    - `id` (UUID) - Primary key
    - `event_id` (UUID) - Foreign key to events
    - `ticket_type` (string) - "adult", "child", "vip", "group", "student"
    - `price_bdt` (decimal) - 50 - 2,500 BDT
    - `status` (string) - "available", "reserved", "sold", "cancelled"
    - `seat_number` (string) - "A-12", "VIP-5" (if applicable)
    - `custom_fields` (JSONB) - Age restrictions, special requirements
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 10,000 - 500,000 tickets

#### **Table 3: `bookings` (MONTHLY PARTITIONED)**
- **Purpose:** Customer booking records
- **Partitioning:** One partition per month (e.g., `bookings_2025_01`, `bookings_2025_02`)
- **Columns:**
    - `id` (UUID) - Primary key
    - `user_id` (UUID) - Customer identifier
    - `event_id` (UUID) - Foreign key to events
    - `ticket_ids` (UUID[]) - Array of ticket IDs
    - `total_amount_bdt` (decimal)
    - `payment_status` (string) - "pending", "paid", "failed", "refunded"
    - `booking_reference` (string) - "ZOO-2025-001234" (unique)
    - `customer_nid_encrypted` (text) - AES-256 encrypted National ID
    - `customer_phone` (string)
    - `customer_email` (string)
    - `customer_name` (string)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 50,000 - 1,000,000 bookings/year
- **Partitions:** 12 partitions/year, old partitions archived after 2 years

#### **Table 4: `payments`**
- **Purpose:** Payment transaction records
- **Columns:**
    - `id` (UUID) - Primary key
    - `booking_id` (UUID) - Foreign key to bookings
    - `amount_bdt` (decimal)
    - `gateway` (string) - "bkash", "nagad", "rocket", "sslcommerz"
    - `transaction_id` (string) - Gateway's transaction ID
    - `payment_token` (text) - Tokenized payment reference (NO raw card data)
    - `status` (string) - "initiated", "processing", "completed", "failed", "refunded"
    - `error_message` (text)
    - `paid_at` (timestamp)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** Same as bookings (1:1 relationship)

#### **Table 5: `users`**
- **Purpose:** Customer accounts
- **Columns:**
    - `id` (UUID) - Primary key
    - `email` (string, unique)
    - `phone` (string, unique)
    - `password_hash` (string) - Bcrypt
    - `name` (string)
    - `nid_encrypted` (text) - If verified
    - `email_verified_at` (timestamp)
    - `phone_verified_at` (timestamp)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 10,000 - 200,000 users

#### **Table 6: `user_profiles`**
- **Purpose:** Extended user information
- **Columns:**
    - `id` (UUID) - Primary key
    - `user_id` (UUID) - Foreign key to users
    - `date_of_birth` (date)
    - `gender` (string)
    - `address` (text)
    - `city` (string)
    - `preferences` (JSONB) - Notification settings, favorite events
    - `loyalty_points` (integer)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** Same as users (1:1 relationship)

#### **Table 7: `audit_logs` (QUARTERLY PARTITIONED)**
- **Purpose:** Immutable audit trail for compliance
- **Partitioning:** One partition per quarter (e.g., `audit_logs_2025_q1`)
- **Columns:**
    - `id` (bigserial) - Primary key
    - `user_id` (UUID)
    - `action` (string) - "CREATE", "UPDATE", "DELETE", "VIEW"
    - `resource` (string) - "booking", "payment", "event"
    - `resource_id` (UUID)
    - `ip_address` (inet)
    - `user_agent` (text)
    - `changes` (JSONB) - Before/after values
    - `timestamp` (timestamp)
- **Records per tenant:** 500,000 - 5,000,000/year (7-year retention)
- **Partitions:** 4 partitions/year × 7 years = 28 partitions per tenant

#### **Table 8: `venues`**
- **Purpose:** Physical locations/zones within tenant
- **Columns:**
    - `id` (UUID) - Primary key
    - `name` (string) - "Main Entrance", "Safari Zone", "Children's Area"
    - `capacity` (integer)
    - `description` (text)
    - `location` (JSONB) - GPS coordinates, map data
    - `amenities` (JSONB) - Facilities available
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 5 - 50 venues

#### **Table 9: `pricing_rules`**
- **Purpose:** Dynamic pricing configuration
- **Columns:**
    - `id` (UUID) - Primary key
    - `name` (string) - "Weekend Surge", "Holiday Premium"
    - `ticket_type` (string)
    - `rule_type` (string) - "percentage", "fixed", "tiered"
    - `rule_config` (JSONB) - Complex pricing logic
    - `valid_from` (timestamp)
    - `valid_until` (timestamp)
    - `is_active` (boolean)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 10 - 100 pricing rules

#### **Table 10: `staff_members`**
- **Purpose:** Admin/operator accounts
- **Columns:**
    - `id` (UUID) - Primary key
    - `email` (string, unique)
    - `password_hash` (string)
    - `name` (string)
    - `role` (string) - "admin", "operator", "viewer"
    - `permissions` (JSONB) - Granular access control
    - `last_login_at` (timestamp)
    - `created_at`, `updated_at` (timestamp)
- **Records per tenant:** 5 - 50 staff members

#### **Table 11: `notifications`**
- **Purpose:** SMS/Email notification log
- **Columns:**
    - `id` (UUID) - Primary key
    - `user_id` (UUID)
    - `type` (string) - "sms", "email", "push"
    - `template` (string) - "booking_confirmed", "payment_success"
    - `content` (text)
    - `status` (string) - "pending", "sent", "failed"
    - `sent_at` (timestamp)
    - `created_at` (timestamp)
- **Records per tenant:** 100,000 - 2,000,000/year

#### **Table 12: `reports_cache`**
- **Purpose:** Pre-computed analytics for dashboards
- **Columns:**
    - `id` (UUID) - Primary key
    - `report_type` (string) - "daily_revenue", "booking_trends"
    - `date_range` (daterange)
    - `data` (JSONB) - Computed metrics
    - `generated_at` (timestamp)
    - `expires_at` (timestamp)
- **Records per tenant:** 1,000 - 10,000 cached reports

**Total Tables per Tenant Database:** 12 base tables + partitions

**Total Tenant Database Tables:** 12 tables × 106 tenants = **1,272 tables**

---

## 📊 **Grand Total Summary**

| Component | Count | Details |
|-----------|-------|---------|
| **Total Databases** | **107** | 1 Master + 106 Tenant DBs |
| **Master DB Tables** | **3** | tenants, tenant_configs, tenant_health |
| **Tables per Tenant** | **12** | events, tickets, bookings, payments, users, etc. |
| **Total Tenant Tables** | **1,272** | 12 × 106 tenants |
| **Partitions (avg/tenant)** | **40** | 12 monthly (bookings) + 28 quarterly (audit_logs) |
| **Total Partitions** | **4,240** | 40 × 106 tenants |
| **GRAND TOTAL TABLES** | **1,275** | 3 master + 1,272 tenant |
| **With Partitions** | **5,515** | 1,275 + 4,240 partitions |

---

## 🔢 **Record Volume Example (National Zoo)**

| Table | Approximate Records | Notes |
|-------|---------------------|-------|
| events | 2,500 | 10 events/day × 250 days/year |
| tickets | 250,000 | 100 tickets/event × 2,500 events |
| bookings | 180,000/year | 500 bookings/day × 360 days |
| payments | 180,000/year | 1:1 with bookings |
| users | 85,000 | Registered customers |
| user_profiles | 85,000 | 1:1 with users |
| audit_logs | 2,500,000/year | Every action logged |
| venues | 15 | Different zones in zoo |
| pricing_rules | 25 | Weekend, holiday, group discounts |
| staff_members | 12 | Admins and operators |
| notifications | 540,000/year | 3 per booking (confirmation + reminder + ticket) |
| reports_cache | 2,000 | Daily/weekly/monthly reports |

**Total Records in Zoo's Database:** ~3.8 million records/year

---

## 💡 **Why This Structure?**

### **Master Database (3 tables, 106 rows):**
- ✅ Lightweight - queries in <50ms
- ✅ Only routing metadata
- ✅ Zero operational data (no cross-tenant risk)
- ✅ Can be replicated easily

### **Tenant Databases (12 tables each, isolated):**
- ✅ Complete physical isolation
- ✅ No `tenant_id` column needed (entire DB is one tenant)
- ✅ Simpler queries, better performance
- ✅ Independent backups and scaling
- ✅ Isolated failures (Zoo crash ≠ Fort crash)

### **Partitioning Strategy:**
- ✅ **Bookings:** Monthly partitions allow fast archival (move old months to cold storage)
- ✅ **Audit Logs:** Quarterly partitions with 7-year retention for compliance
- ✅ **Query Performance:** Partition pruning (only scan relevant months)
- ✅ **Backup Efficiency:** Backup only hot partitions frequently, cold partitions weekly

This structure ensures **complete tenant isolation** while maintaining **operational efficiency** and **compliance requirements**.