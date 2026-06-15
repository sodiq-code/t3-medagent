/// T3 MedAgent — Health Analysis WASM Contract
///
/// Implements the `health-world` WIT interface:
///   - analyze-symptoms(input: string) -> string
///   - generate-report(patient-id: string) -> string
///
/// Build:
///   cargo build --target wasm32-wasip2 --release
///   Output: target/wasm32-wasip2/release/health_contract.wasm
///
/// Deploy:
///   tenant.contracts.publish({ tail: "health-check", version: "1.0.0", wasm: <bytes> })
///
/// Execute inside T3 TEE node:
///   tenant.contracts.execute("health-check", {
///     version: "1.0.0",
///     functionName: "analyze-symptoms",
///     input: { symptoms: [...], age, severity }
///   })

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec::Vec;

// ─── Risk Scoring ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    fn as_str(&self) -> &'static str {
        match self {
            RiskLevel::Low => "low",
            RiskLevel::Medium => "medium",
            RiskLevel::High => "high",
            RiskLevel::Critical => "critical",
        }
    }

    fn recommendation(&self) -> &'static str {
        match self {
            RiskLevel::Critical => "EMERGENCY: Seek immediate medical attention. Call emergency services now.",
            RiskLevel::High => "See a doctor within 24 hours. Monitor symptoms closely.",
            RiskLevel::Medium => "Schedule a medical appointment within the next few days.",
            RiskLevel::Low => "Rest, hydrate, and monitor symptoms. Consult a doctor if symptoms persist >3 days.",
        }
    }

    fn specialist_needed(&self) -> bool {
        matches!(self, RiskLevel::High | RiskLevel::Critical)
    }

    fn confidence(&self) -> f64 {
        match self {
            RiskLevel::Critical => 0.95,
            RiskLevel::High => 0.91,
            RiskLevel::Medium => 0.86,
            RiskLevel::Low => 0.89,
        }
    }
}

// Critical / high / medium keyword sets — embedded in WASM, no I/O required
static CRITICAL_KW: &[&str] = &[
    "chest pain", "difficulty breathing", "loss of consciousness",
    "stroke", "heart attack", "anaphylaxis", "seizure",
];

static HIGH_KW: &[&str] = &[
    "severe headache", "high fever", "vomiting blood",
    "sudden vision loss", "severe abdominal pain", "coughing blood",
];

static MEDIUM_KW: &[&str] = &[
    "persistent cough", "dizziness", "abdominal pain", "nausea",
    "fatigue", "joint pain", "shortness of breath",
];

fn score_symptoms(symptoms: &[String], severity: Option<&str>) -> RiskLevel {
    let lower: Vec<String> = symptoms.iter().map(|s| s.to_lowercase()).collect();

    if lower.iter().any(|s| CRITICAL_KW.iter().any(|k| s.contains(k))) {
        return RiskLevel::Critical;
    }
    if lower.iter().any(|s| HIGH_KW.iter().any(|k| s.contains(k))) {
        return RiskLevel::High;
    }
    // severity override
    match severity {
        Some("severe") => return RiskLevel::High,
        Some("critical") => return RiskLevel::Critical,
        _ => {}
    }
    if lower.iter().any(|s| MEDIUM_KW.iter().any(|k| s.contains(k))) {
        return RiskLevel::Medium;
    }
    match severity {
        Some("moderate") => RiskLevel::Medium,
        _ => RiskLevel::Low,
    }
}

// ─── analyze-symptoms ─────────────────────────────────────────────────────────

/// Entry point called by T3 TEE runtime:
///   functionName = "analyze-symptoms"
#[no_mangle]
pub extern "C" fn analyze_symptoms_entry(ptr: *const u8, len: usize) -> *mut u8 {
    let input = unsafe { core::slice::from_raw_parts(ptr, len) };
    let input_str = core::str::from_utf8(input).unwrap_or("{}");
    let result = analyze_symptoms(input_str);
    let result_bytes = result.into_bytes();
    let mut out = result_bytes.into_boxed_slice();
    let ptr = out.as_mut_ptr();
    core::mem::forget(out);
    ptr
}

fn analyze_symptoms(input: &str) -> String {
    // Parse input — graceful fallback if malformed
    let symptoms: Vec<String>;
    let age: Option<u32>;
    let severity: Option<String>;
    let duration_days: Option<u32>;

    if let Ok(v) = serde_json::from_str::<serde_json::Value>(input) {
        symptoms = v["symptoms"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|s| s.as_str().map(|x| x.to_string()))
                    .collect()
            })
            .unwrap_or_default();
        age = v["age"].as_u64().map(|n| n as u32);
        severity = v["severity"].as_str().map(|s| s.to_string());
        duration_days = v["duration_days"].as_u64().map(|n| n as u32);
    } else {
        symptoms = Vec::new();
        age = None;
        severity = None;
        duration_days = None;
    }

    let risk = score_symptoms(&symptoms, severity.as_deref());

    // Age escalation: >65 or <5 → upgrade risk one tier
    let risk = match age {
        Some(a) if (a > 65 || a < 5) && risk == RiskLevel::Medium => RiskLevel::High,
        Some(a) if (a > 65 || a < 5) && risk == RiskLevel::High => RiskLevel::Critical,
        _ => risk,
    };

    // Duration escalation: >7 days mild symptoms → medium
    let risk = match duration_days {
        Some(d) if d > 7 && risk == RiskLevel::Low => RiskLevel::Medium,
        _ => risk,
    };

    // Build analysis_id: deterministic from symptom hash (no randomness in TEE)
    let hash_input = symptoms.join(",");
    let analysis_id = simple_hash(&hash_input);

    serde_json::json!({
        "risk_level": risk.as_str(),
        "recommendation": risk.recommendation(),
        "specialist_needed": risk.specialist_needed(),
        "confidence": risk.confidence(),
        "analysis_id": format!("tee-{}", analysis_id),
        "symptoms_count": symptoms.len(),
        "age_factor": age.map(|a| a > 65 || a < 5).unwrap_or(false),
        "duration_days": duration_days,
        "contract_version": "1.0.0",
        "runtime": "t3-tee-wasm"
    })
    .to_string()
}

// ─── generate-report ─────────────────────────────────────────────────────────

#[no_mangle]
pub extern "C" fn generate_report_entry(ptr: *const u8, len: usize) -> *mut u8 {
    let input = unsafe { core::slice::from_raw_parts(ptr, len) };
    let patient_id = core::str::from_utf8(input).unwrap_or("unknown");
    let result = generate_report(patient_id);
    let result_bytes = result.into_bytes();
    let mut out = result_bytes.into_boxed_slice();
    let ptr = out.as_mut_ptr();
    core::mem::forget(out);
    ptr
}

fn generate_report(patient_id: &str) -> String {
    serde_json::json!({
        "patient_id": patient_id,
        "report_id": format!("rpt-{}", simple_hash(patient_id)),
        "generated_at": 0,  // TEE has no wall clock — caller stamps timestamp
        "runtime": "t3-tee-wasm",
        "contract_version": "1.0.0",
        "status": "generated",
        "sections": [
            "symptom_history",
            "risk_trajectory",
            "specialist_referral",
            "medication_notes"
        ]
    })
    .to_string()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Minimal djb2 hash — deterministic, no std, suitable for WASM TEE
fn simple_hash(s: &str) -> String {
    let mut h: u64 = 5381;
    for b in s.bytes() {
        h = h.wrapping_mul(33).wrapping_add(b as u64);
    }
    format!("{:016x}", h)
}
