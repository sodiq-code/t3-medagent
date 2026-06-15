import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// T3 sessions — store T3 DID after authenticate()
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  did: text("did").notNull(),
  ethAddress: text("eth_address").notNull(),
  tenantDid: text("tenant_did"),
  sessionStatus: text("session_status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Patients — onboarded user profiles
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  did: text("did").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailAddress: text("email_address"),
  phoneNumber: text("phone_number"),
  countryOfResidence: text("country_of_residence"),
  otpVerified: integer("otp_verified", { mode: "boolean" }).notNull().default(false),
  profileSubmitted: integer("profile_submitted", { mode: "boolean" }).notNull().default(false),
  mapName: text("map_name"), // T3 KV store map name for this patient
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Health analyses — results from contracts.execute()
export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  patientDid: text("patient_did").notNull(),
  symptoms: text("symptoms").notNull(), // JSON array
  contractResult: text("contract_result"), // JSON from TEE execution
  riskLevel: text("risk_level"), // low/medium/high/critical
  recommendation: text("recommendation"),
  contractVersion: text("contract_version"),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Delegations — agent delegation credentials
export const delegations = sqliteTable("delegations", {
  id: text("id").primaryKey(),
  issuerDid: text("issuer_did").notNull(),
  agentPublicKey: text("agent_public_key").notNull(),
  functions: text("functions").notNull(), // JSON array of function names
  credential: text("credential").notNull(), // full DelegationCredential JSON
  signature: text("signature"),
  status: text("status").notNull().default("active"), // active/revoked
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

// Audit events — cached from contracts.logs()
export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  patientDid: text("patient_did"),
  contractTail: text("contract_tail").notNull(),
  functionName: text("function_name").notNull(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  tsMs: integer("ts_ms").notNull(),
  spanId: integer("span_id"),
  syncedAt: integer("synced_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
