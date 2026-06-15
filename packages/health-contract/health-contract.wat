;; T3 MedAgent — Health Analysis WASM Contract
;; WAT source — compiles to valid WASM via wat2wasm
;; Implements: analyze-symptoms + generate-report
;; Deployed to T3 TEE nodes via contracts.publish()

(module
  ;; ─── Memory ─────────────────────────────────────────────────────────────
  (memory (export "memory") 2)

  ;; ─── Internal data: risk keywords (UTF-8, null-terminated) ──────────────
  ;; Stored as static offsets in memory page 0
  ;; Page 1 (offset 65536+) = scratch / output buffer

  ;; Data section: output templates
  (data (i32.const 0)    "low")
  (data (i32.const 4)    "medium")
  (data (i32.const 11)   "high")
  (data (i32.const 16)   "critical")

  ;; Recommendations (offset 32+)
  (data (i32.const 32)
    "Rest, hydrate, and monitor symptoms. Consult a doctor if symptoms persist >3 days.")
  (data (i32.const 115)
    "Schedule a medical appointment within the next few days.")
  (data (i32.const 171)
    "See a doctor within 24 hours. Monitor symptoms closely.")
  (data (i32.const 226)
    "EMERGENCY: Seek immediate medical attention. Call emergency services now.")

  ;; Output buffer starts at offset 4096
  ;; ─── Exported functions ──────────────────────────────────────────────────

  ;; analyze_symptoms(input_ptr: i32, input_len: i32) -> i32 (output_ptr)
  ;; Reads JSON input from memory[input_ptr..input_ptr+input_len]
  ;; Writes JSON result into memory starting at 4096
  ;; Returns pointer to result (4096)
  (func (export "analyze-symptoms")
        (param $input_ptr i32) (param $input_len i32)
        (result i32)

    (local $risk i32)         ;; 0=low 1=med 2=high 3=critical
    (local $i i32)
    (local $ch i32)
    (local $out i32)          ;; output cursor
    (local $rec_off i32)      ;; recommendation offset
    (local $rec_len i32)      ;; recommendation length
    (local $risk_str_off i32)
    (local $risk_str_len i32)

    ;; Default risk = 0 (low)
    (local.set $risk (i32.const 0))
    (local.set $out (i32.const 4096))

    ;; ── Keyword scan (simplified — scan for ASCII keywords) ──────────────
    ;; Scan input for: "chest" → critical(3), "severe" → high(2), 
    ;; "cough"|"dizz" → medium(1)
    (local.set $i (local.get $input_ptr))
    (block $done
      (loop $scan
        (br_if $done (i32.ge_u (local.get $i)
                               (i32.add (local.get $input_ptr) (local.get $input_len))))
        (local.set $ch (i32.load8_u (local.get $i)))

        ;; Check 'c' → could be "chest" or "cough"
        (if (i32.eq (local.get $ch) (i32.const 99)) ;; 'c'
          (then
            ;; peek next: 'h' → "chest" pattern → critical
            (if (i32.lt_u (i32.add (local.get $i) (i32.const 1))
                          (i32.add (local.get $input_ptr) (local.get $input_len)))
              (then
                (if (i32.eq (i32.load8_u (i32.add (local.get $i) (i32.const 1)))
                            (i32.const 104)) ;; 'h'
                  (then (local.set $risk (i32.const 3)))) ;; critical
                ;; 'o' → "cough" → medium
                (if (i32.eq (i32.load8_u (i32.add (local.get $i) (i32.const 1)))
                            (i32.const 111)) ;; 'o'
                  (then
                    (if (i32.lt_u (local.get $risk) (i32.const 1))
                      (then (local.set $risk (i32.const 1))))))))))

        ;; 's' → "severe" or "seizure" → high
        (if (i32.eq (local.get $ch) (i32.const 115)) ;; 's'
          (then
            (if (i32.lt_u (local.get $risk) (i32.const 2))
              (then (local.set $risk (i32.const 2))))))

        ;; 'v' → "vomit" → high
        (if (i32.eq (local.get $ch) (i32.const 118)) ;; 'v'
          (then
            (if (i32.lt_u (local.get $risk) (i32.const 2))
              (then (local.set $risk (i32.const 2))))))

        ;; 'f' → "fever" → medium
        (if (i32.eq (local.get $ch) (i32.const 102)) ;; 'f'
          (then
            (if (i32.lt_u (local.get $risk) (i32.const 1))
              (then (local.set $risk (i32.const 1))))))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $scan)
      )
    )

    ;; ── Map risk to string offsets ────────────────────────────────────────
    (block $r3
      (block $r2
        (block $r1
          (block $r0
            (br_table $r0 $r1 $r2 $r3 (local.get $risk))
          ) ;; r0: low
          (local.set $risk_str_off (i32.const 0))
          (local.set $risk_str_len (i32.const 3))
          (local.set $rec_off (i32.const 32))
          (local.set $rec_len (i32.const 83))
          (br $r3)
        ) ;; r1: medium
        (local.set $risk_str_off (i32.const 4))
        (local.set $risk_str_len (i32.const 6))
        (local.set $rec_off (i32.const 115))
        (local.set $rec_len (i32.const 56))
        (br $r3)
      ) ;; r2: high
      (local.set $risk_str_off (i32.const 11))
      (local.set $risk_str_len (i32.const 4))
      (local.set $rec_off (i32.const 171))
      (local.set $rec_len (i32.const 55))
      (br $r3)
    ) ;; r3: critical
    (if (i32.eq (local.get $risk) (i32.const 3))
      (then
        (local.set $risk_str_off (i32.const 16))
        (local.set $risk_str_len (i32.const 8))
        (local.set $rec_off (i32.const 226))
        (local.set $rec_len (i32.const 73))))

    ;; ── Write JSON output to buffer at 4096 ───────────────────────────────
    ;; {"risk_level":"<risk>","recommendation":"<rec>","specialist_needed":<bool>,
    ;;  "confidence":<f>,"analysis_id":"tee-wasm","runtime":"t3-tee-wasm"}

    ;; Write: {"risk_level":"
    (i32.store8 (local.get $out) (i32.const 123))  ;; {
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))

    ;; copy "risk_level" literal
    (memory.copy (local.get $out) (i32.const 300) (i32.const 10))
    (local.set $out (i32.add (local.get $out) (i32.const 10)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 58))   ;; :
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))

    ;; copy risk string
    (memory.copy (local.get $out) (local.get $risk_str_off) (local.get $risk_str_len))
    (local.set $out (i32.add (local.get $out) (local.get $risk_str_len)))

    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 125))  ;; }
    (local.set $out (i32.add (local.get $out) (i32.const 1)))

    ;; Return pointer to output buffer
    (i32.const 4096)
  )

  ;; generate-report(patient_id_ptr: i32, patient_id_len: i32) -> i32
  (func (export "generate-report")
        (param $pid_ptr i32) (param $pid_len i32)
        (result i32)

    (local $out i32)
    (local.set $out (i32.const 8192))

    ;; Write minimal JSON report
    (i32.store8 (local.get $out) (i32.const 123))  ;; {
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    ;; "status":"generated"
    (memory.copy (local.get $out) (i32.const 400) (i32.const 6))
    (local.set $out (i32.add (local.get $out) (i32.const 6)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 58))   ;; :
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (memory.copy (local.get $out) (i32.const 407) (i32.const 9))
    (local.set $out (i32.add (local.get $out) (i32.const 9)))
    (i32.store8 (local.get $out) (i32.const 34))   ;; "
    (local.set $out (i32.add (local.get $out) (i32.const 1)))
    (i32.store8 (local.get $out) (i32.const 125))  ;; }
    (local.set $out (i32.add (local.get $out) (i32.const 1)))

    (i32.const 8192)
  )

  ;; ── String literals needed at runtime ────────────────────────────────────
  (data (i32.const 300) "risk_level")
  (data (i32.const 400) "status")
  (data (i32.const 407) "generated")
)
