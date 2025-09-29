## **Overall Architecture Pattern: Dual-Database with Real-Time Sync**

This is a **modern search-optimized architecture** that separates transactional operations (MySQL) from search operations (OpenSearch) using Change Data Capture (CDC) for real-time synchronization.

---

## **🔄 Data Flow Breakdown**

### **1. User Layer → API Gateway**
```
Web Users ──┐
Mobile Users ──┤──→ Load Balancer ──→ API Servers (1, 2, 3)
Admin/Agents ──┘
```

**Purpose:**
- Load balancer distributes traffic across multiple API servers
- SSL/TLS termination, DDoS protection, rate limiting
- Health checks ensure only healthy servers receive traffic

---

### **2. Write Path (Red/Dashed): MySQL as Source of Truth**

```
API Servers ──[Writes]──→ MySQL Primary
                           ↓
                      MySQL Binlog
                           ↓
                      Debezium CDC (<2s lag)
                           ↓
                      Kafka Topics
                           ↓
                  ML Enrichment Service
                    ↓              ↓
            (Third-Party APIs)  OpenSearch Data Nodes
```

**How it works:**
1. **Write to MySQL**: All creates/updates/deletes go to MySQL first
    - Properties, users, inquiries stored here
    - ACID guarantees, <50ms write latency

2. **Binlog Capture**: MySQL binlog records every change
    - ROW format captures full before/after images
    - 7-day retention for replay capability

3. **Debezium CDC**: Reads binlog, publishes to Kafka
    - Real-time capture with <2 second lag
    - Monitors: properties, property_images, users, user_profiles
    - At-least-once delivery guarantee

4. **Kafka Buffer**: Message broker between MySQL and OpenSearch
    - 6 partitions per topic for parallelism
    - 7-day retention allows replay if needed
    - Decouples producers from consumers

5. **ML Enrichment**: Transforms raw data before indexing
    - **BERT embeddings**: 768-dim vectors from property descriptions
    - **ResNet embeddings**: 2048-dim vectors from property images
    - **Third-party enrichment**:
        - GreatSchools API → school ratings
        - Walk Score API → walkability scores
        - Crime Data API → safety metrics
    - All cached for 24 hours to reduce API costs

6. **Index to OpenSearch**: Enriched data written to Data Nodes
    - Properties index: 6 primary shards, 1 replica each
    - User profiles: 3 shards
    - Refresh interval: 5 seconds (near real-time)

---

### **3. Search Path (Blue/Solid): OpenSearch Query Flow**

```
API Servers ──[Search Query]──→ Coordinating Nodes (1, 2)
                                      ↓
                            Data Nodes (1, 2, 3, 4)
                                      ↓
                            OpenSearch Indexes
                              ↓      ↓      ↓
                         Vector  Full-Text  Aggregations
```

**How it works:**
1. **API receives search request** from user (e.g., "3BR condo in Brooklyn under $800K")

2. **Coordinating Nodes**: Route requests, don't store data
    - Round-robin across data nodes
    - Scatter-gather pattern: query all relevant shards
    - Merge results from multiple shards
    - Return top-k ranked results

3. **Data Nodes**: Execute actual search
    - 4 nodes, each storing 32GB of indexed data
    - Each has subset of primary/replica shards
    - Execute queries in parallel

4. **Query Types**:
    - **k-NN Vector Search** (120-200ms):
        - "Find properties similar to this one"
        - Uses HNSW algorithm for fast approximate search
        - 98.5% recall at top-10

    - **Full-Text BM25** (50-200ms):
        - Keyword matching with typo tolerance
        - "apartmnt" → "apartment" (fuzzy matching)
        - Relevance ranking with BM25 algorithm

    - **Aggregations** (100-300ms):
        - Real-time facet counts
        - "How many 3BR? Price distribution? Property types?"
        - 15+ facet dimensions calculated in single query

---

### **4. OpenSearch Cluster Management**

```
Master Nodes (1, 2, 3) ──[Manage]──→ Data Nodes
         ↓
   Quorum (3 nodes)
   - Shard allocation
   - Index lifecycle
   - Cluster state
```

**Master Nodes** (3 nodes for quorum):
- Don't store data or handle queries
- Manage cluster state and shard allocation
- Detect node failures, rebalance shards
- Prevent split-brain with 3-node quorum

**HNSW Configuration**:
- `ef_construction=512`: High-quality index build
- `m=32`: 32 connections per node (memory vs accuracy)
- Replication factor: 1 (each shard has 1 replica)

---

### **5. Monitoring Path (Purple/Dashed)**

```
MySQL ──┐
Kafka  ──┤──[Metrics]──→ Prometheus ──→ Grafana Dashboards
Data Nodes ──┘
```

**Prometheus** (scrape every 15 seconds):
- Query latency: P50, P95, P99
- Throughput: QPS (queries per second)
- Resource usage: CPU, memory, disk, JVM heap
- Error rates, CDC lag

**Grafana**:
- 8+ dashboards visualizing metrics
- Alerts trigger when P95 > 200ms or heap > 85%
- PagerDuty/Slack integration for on-call

---

### **6. Backup Path**

```
MySQL ──[Daily Backup]──→ S3 Backups
Data Nodes ──[Snapshots]──→ S3 Backups
```

- **Daily at 2 AM UTC**
- **Retention**: 7 daily, 4 weekly, 3 monthly
- **Recovery Time**: 15-30 minutes for full restore
- **Point-in-time Recovery**: Using MySQL binlogs

---

## **🎯 Why This Architecture?**

### **Problem: MySQL Can't Handle Modern Search**
| Requirement | MySQL | OpenSearch |
|------------|-------|------------|
| Full-text search (5M properties) | 2-5 seconds ❌ | 50-200ms ✅ |
| Typo tolerance | Not supported ❌ | Built-in ✅ |
| Vector similarity | Not feasible ❌ | 120-200ms ✅ |
| Faceted search (all facets) | 7+ seconds ❌ | 100-300ms ✅ |
| Auto-complete | 500-2000ms ❌ | 10-50ms ✅ |

### **Solution: Use Both**
- **MySQL**: ACID transactions, source of truth, writes
- **OpenSearch**: Search, ML, recommendations, 95% of queries

---

## **📊 Key Constraints & SLAs**

| Component | Constraint | Purpose |
|-----------|-----------|---------|
| MySQL | <50ms writes | Fast transactional operations |
| CDC (Debezium) | <2s lag | Near real-time sync |
| P95 Search | <200ms | Good user experience |
| P99 Search | <300ms | Acceptable for 99% of queries |
| HNSW Recall@10 | >98.5% | High-quality vector search |
| JVM Heap | <75% | Prevent garbage collection pauses |
| Cluster Status | GREEN | All shards available |
| Backup Retention | 7 days | Recovery capability |

---

## **🔐 Data Consistency Model**

**Eventually Consistent** (with <2 second lag):
1. Write accepted by MySQL immediately (strong consistency)
2. Appears in OpenSearch within ~2 seconds
3. During this 2-second window, new data not yet searchable
4. This is acceptable for property search use case

**Failure Scenarios**:
- **MySQL down**: No writes possible (by design - source of truth)
- **OpenSearch down**: Search unavailable, writes still work
- **Kafka down**: Backpressure to Debezium, CDC pauses temporarily
- **Network partition**: Kafka retries, eventual consistency maintained

---

## **🎛️ Scalability Strategy**

**Horizontal Scaling**:
- **API Servers**: Auto-scale 3-12 instances based on traffic
- **OpenSearch Data Nodes**: Add nodes as data grows (currently 4, can grow to 10+)
- **Kafka Partitions**: 6 partitions allow 6 parallel consumers
- **Sharding**: 6 shards split across 4 data nodes, easily redistributed

**Current Capacity**:
- 5M+ properties indexed
- 5,000+ queries per second
- 1,000-5,000 docs indexed per second
- Scales to 50M+ properties without architecture change

---

## **💡 Why This is Industry Standard**

This pattern is used by:
- **Airbnb**: MySQL + Elasticsearch for property search
- **Uber**: PostgreSQL + Elasticsearch for trip search
- **Netflix**: Cassandra + Elasticsearch for content discovery
- **LinkedIn**: MySQL + Elasticsearch for job search

**Key Benefits**:
1. **Separation of concerns**: OLTP vs search optimized separately
2. **Scalability**: Each system scales independently
3. **Resilience**: Failure in one doesn't cascade to other
4. **Performance**: Each system optimized for its workload
5. **Flexibility**: Can swap databases without changing search

---

This architecture enables HelloHomeX to deliver **Google-quality search performance** (sub-200ms) while maintaining **database reliability** (ACID, backups, point-in-time recovery) that property transactions require.