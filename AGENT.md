# DDH Consulting — Website Context Document
# Purpose: Provides full business context for website development.
# This file lives in the GitHub repository and serves as the authoritative
# reference for anyone (or any agent) building or maintaining ddhbiconsulting.com.

---

## IDENTITY

**Company:** DDH Consulting LLC
**Website:** ddhbiconsulting.com
**Email:** contact@ddhbiconsulting.com
**Location:** Miami, Florida
**Principal:** Pedro Dahdah

DDH Consulting is a data architecture and healthcare intelligence firm. We collect and process public healthcare data to deliver revenue performance intelligence to physician groups, management services organizations, and healthcare finance leaders. We build production systems — data pipelines, semantic data models, and intelligence dashboards — and maintain them on an ongoing basis.

We specialize in two areas:
- **Healthcare Revenue Intelligence** — identifying program enrollment gaps, reimbursement discrepancies, and unclaimed federal and state program revenue using public data
- **Financial Data Architecture & FP&A Reporting** — building the data infrastructure and reporting systems that give healthcare finance teams a clear, organized view of their financial performance

Our deliverables are infrastructure and intelligence — not advisory reports or recommendations. We build systems. Clients own their reporting layer. We charge a retainer for continued access to our organized public data intelligence, and separate development and maintenance fees for client-specific systems we build and manage.

---

## WHAT WE DO

### Data Architecture & Engineering
We design and build end-to-end data infrastructure — automated pipelines, cloud data warehouses, and semantic data models. Our systems connect client operational and financial data to our healthcare intelligence layer, producing a unified, organized view of revenue performance that finance and operations leadership can rely on.

Every system we build is production-grade, documented, and owned by the client at the conclusion of the engagement.

### Healthcare Revenue Intelligence
We collect, process, and organize public healthcare program data — federal and state — into a structured intelligence layer that identifies revenue gaps at the provider level. This intelligence is updated monthly as program lists and federal data sources are refreshed.

Clients access this intelligence through a reporting layer we build on top of their data, placing their organization's performance in the context of program benchmarks, enrollment status, and reimbursement standards.

### Business Intelligence & FP&A Reporting
We build the reporting infrastructure that healthcare finance teams use daily — semantic models, executive dashboards, revenue cycle analytics, and payer performance reporting. Our BI work is built with the same architectural rigor as enterprise OLAP systems: pre-calculated dimensions, fact tables, and measures that allow finance teams to analyze data without requiring technical support for every report.

### Development & Maintenance
Client reporting systems require ongoing maintenance as data sources evolve, new program data becomes available, and organizational needs change. DDH Consulting charges separately for development work and for the ongoing maintenance of client-specific systems.

---

## REVENUE MODEL

DDH Consulting operates on three revenue streams:

**Intelligence Retainer**
Clients pay a monthly retainer for continued access to DDH's organized public data intelligence layer — updated monthly as federal and state program data is refreshed. This covers MPIP list updates, QPP performance data, CMS fee schedule changes, and all underlying public data processing. Without a retainer, clients lose access to current intelligence.

**Development Fee**
A project-based fee for designing and building client-specific data infrastructure — pipelines, data warehouses, semantic models, and reporting dashboards. This is a one-time or phased investment that produces infrastructure the client owns.

**Maintenance Fee**
An ongoing fee for maintaining and evolving client-specific systems — pipeline monitoring, dashboard updates, schema changes, and integration of new data sources as the client's needs grow.

---

## REVENUE INTELLIGENCE SOLUTIONS

DDH Consulting currently identifies five categories of healthcare revenue opportunity through its public data intelligence layer.

### MPIP — Florida Medicaid Physician Incentive Program
Florida law requires Medicaid managed care plans to reimburse MPIP-qualified primary care physicians at rates equivalent to Medicare. When a managed care plan fails to recognize a provider's MPIP eligibility, they underpay on every Medicaid claim — often for extended periods without detection by the provider or their billing team.

DDH cross-references provider enrollment data against AHCA-published MPIP qualification lists for all 20 Florida Medicaid managed care plans monthly. Providers appearing on some plan lists but absent from others represent a documented administrative gap — one that can often be remediated retroactively through plan correction.

- Eligible specialties: Family Medicine, Internal Medicine, Pediatrics, OB/GYN, General Practice
- Program scope: Florida Medicaid
- Data source: AHCA monthly MPIP Qualified Provider list (publicly available)
- Recovery potential: Varies by Medicaid volume; significant for practices with high Medicaid payer mix

### MIPS — Merit-Based Incentive Payment System
CMS applies automatic payment adjustments to Medicare Part B billing based on annual MIPS performance scores. Providers below the performance threshold receive a negative payment adjustment — up to 9% — applied two years after the performance period. Providers above threshold receive positive adjustments up to 5%.

DDH identifies providers facing negative MIPS adjustments, quantifies the dollar exposure against their Medicare billing volume, and flags those not participating in MIPS or ACO arrangements despite eligibility.

- Program scope: National (Medicare Part B)
- Data source: CMS Quality Payment Program (QPP) — publicly available
- Impact: Directly proportional to Medicare revenue volume

### APCM — Advanced Primary Care Management
CMS introduced three new care management codes effective January 1, 2025 — G0556, G0557, and G0558 — providing monthly reimbursement for primary care practices managing patients with chronic conditions. Most primary care practices have not incorporated these codes into their billing workflows despite having qualifying Medicare patient panels.

DDH identifies providers with Medicare utilization patterns consistent with APCM eligibility and low or absent APCM billing activity.

- HCPCS codes: G0556, G0557, G0558
- Program scope: National (Medicare Part B)
- Data source: CMS Utilization data, CMS Fee Schedule — publicly available
- Opportunity: Monthly recurring revenue for practices with qualifying Medicare populations

### CCM/TCM — Chronic Care & Transition Care Management
CPT codes covering chronic care management (99490, 99491, 99487) and transition care management (99495, 99496) provide reimbursement for ongoing management of patients with chronic conditions and post-discharge care coordination. These codes are consistently underutilized relative to eligible patient populations.

DDH identifies practices with Medicare patient populations consistent with significant CCM/TCM eligibility and low utilization in CMS billing data.

- Program scope: National (Medicare Part B)
- Data source: CMS Utilization data — publicly available

### 340B — Drug Pricing Program
The 340B Drug Pricing Program allows qualifying healthcare organizations to purchase outpatient drugs at significantly reduced prices. Organizations that meet program eligibility criteria but are not enrolled — or are not fully utilizing the program — may be incurring unnecessary drug expenditures.

DDH identifies organizations that appear to meet 340B eligibility criteria based on HRSA data and organizational characteristics.

- Program scope: National
- Data source: HRSA 340B database — publicly available

---

## WHO WE SERVE

**Primary clients:**
- PE-backed and MSO-managed physician groups
- Management Services Organizations (MSOs) managing multi-practice portfolios
- Specialty pharmacies with complex revenue cycle environments
- Mid-size health systems requiring custom BI and FP&A infrastructure

**Decision-makers we engage:**
- Chief Financial Officers (CFO)
- Chief Operating Officers (COO)
- VP Finance / VP Revenue Cycle
- Practice Administrators
- Private Equity operating partners overseeing healthcare portfolios

**Specialty focus:**
- Primary Care / Family Medicine
- Internal Medicine
- Pediatrics
- Obstetrics & Gynecology
- General Practice

**Geographic focus:** Florida (primary market for MPIP intelligence); national for MIPS, APCM, and federal program intelligence; no geographic limitation on data architecture and FP&A engagements.

---

## ENGAGEMENT MODEL

### Phase 1 — Portfolio Assessment
A focused two-to-three week analysis of the client's provider portfolio against DDH's public intelligence data. Covers MPIP enrollment status across all managed care plans, MIPS participation and performance, APCM billing patterns, and other program indicators relevant to the organization. Delivered as a structured findings report with provider-level detail and a prioritized opportunity summary.

### Phase 2 — Data Architecture Implementation
Design and build of client-specific data infrastructure — connecting the client's billing and financial data to DDH's intelligence layer, building a semantic data model aligned to their reporting needs, and delivering a production dashboard their finance team uses daily. Typically six to ten weeks. Client owns the infrastructure at conclusion of implementation.

### Phase 3 — Ongoing Retainer & Maintenance
Monthly intelligence retainer covering public data refresh and program list updates. Separate maintenance fee for client-specific system support, dashboard evolution, and integration of new data sources as the organization's needs grow.

*Engagement investment is scoped individually and discussed during a discovery conversation. Pricing is not published on the website.*

---

## CASE STUDY

**Regional Specialty Pharmacy — Revenue Cycle Intelligence**
A specialty pharmacy engaged DDH Consulting to build data infrastructure connecting accounts receivable, claims processing, and revenue cycle data. The resulting system surfaced $340,000 in previously unidentified revenue discrepancies and reduced the finance team's monthly reporting time by 87%.

*Client names are kept confidential. Additional case studies available upon request.*

---

## WEBSITE PAGES

The DDH Consulting website contains the following pages. All content should align with the positioning, tone, and service descriptions in this document.

**Home**
Overview of DDH Consulting's identity, core services, and primary call to action. Should communicate immediately that DDH is a data architecture and healthcare intelligence firm — not a billing company, not a software vendor, not an advisory firm. Lead with what we build and what it produces for clients.

**Services**
Detailed descriptions of four service areas: Data Architecture & Engineering, Healthcare Revenue Intelligence, Business Intelligence & FP&A Reporting, and Development & Maintenance. Each section should be clear about deliverables and what the client owns at the end of an engagement.

**Solutions**
Detailed breakdown of the five revenue intelligence categories: MPIP, MIPS, APCM, CCM/TCM, and 340B. For each: what the program is, who is eligible, what the gap looks like, and how DDH identifies it. No dollar guarantees. Factual and precise.

**Case Studies**
Summary of completed engagements with outcome metrics. Client names anonymized. Focus on what was built, what it found, and what changed for the client's finance operations.

**Contact**
Simple contact page. Email: contact@ddhbiconsulting.com. No pricing. Direct visitors to initiate a conversation.

---

## TONE & POSITIONING GUIDELINES

DDH Consulting is a serious, technically capable firm operating in a specialized space. All website copy should reflect this.

**Do:**
- Use precise, professional language
- Lead with what we build and what it produces
- Reference specific programs by their correct names (MPIP, MIPS, APCM)
- Describe deliverables clearly — infrastructure, models, dashboards
- Acknowledge that engagement investment is scoped individually
- Reflect expertise in healthcare finance and FP&A, not just technology

**Do not:**
- Use superlatives or aggressive claims ("find every dollar," "never miss revenue")
- Describe DDH as boutique, startup, or small
- Promise specific recovery amounts or financial outcomes
- Use generic BI industry language that could apply to any sector
- Mention competitor names
- Publish pricing or engagement fees
- Reference internal tools, infrastructure details, or technology stack

---

## FREQUENTLY ASKED QUESTIONS

**What types of organizations does DDH Consulting work with?**
Physician groups, management services organizations, and specialty pharmacies — particularly those operating in Florida's Medicaid managed care environment or with significant Medicare patient populations. We also work with PE-backed healthcare organizations building stronger data and reporting infrastructure.

**Do you work outside of Florida?**
Yes. MPIP intelligence is specific to Florida's Medicaid program. MIPS, APCM, and CCM/TCM analysis applies nationally. Data architecture and FP&A reporting engagements have no geographic limitation.

**How is DDH different from our billing company?**
Billing companies manage claims submission and collections. DDH builds the analytical infrastructure that sits above that process — identifying program enrollment gaps, monitoring reimbursement performance against public benchmarks, and organizing financial data into reporting systems your finance leadership uses. We work alongside existing billing operations.

**What do you need from us to begin?**
A portfolio assessment requires only your organization's NPI numbers — we run the initial analysis against public data. Implementation engagements that incorporate your billing data require a data sharing agreement and access to billing system exports.

**How do you handle sensitive financial and patient data?**
All engagements involving protected health information or financial records are conducted under a signed Business Associate Agreement (BAA). Client data is isolated in dedicated database environments.

**How long does an implementation take?**
Portfolio assessments: two to three weeks. Full data architecture implementations: six to ten weeks depending on data environment complexity.

**Do you provide ongoing support?**
Yes. Our retainer covers public intelligence data refresh and program list updates monthly. Maintenance fees cover client-specific system support, dashboard evolution, and integration of new data sources.

**Who do we contact to get started?**
Email contact@ddhbiconsulting.com to initiate a discovery conversation.

---

*This document is the authoritative context source for ddhbiconsulting.com development and maintenance.*
*Last updated: June 2026 | DDH Consulting LLC*
