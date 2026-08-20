package synapse.governance

import future.keywords.in

default allow = false
default requires_approval = false
default reason = "Default deny policy"

# Rule 1: Financial Boundary (Allow <= $300)
allow {
    input.tool_name == "issue_refund"
    input.amount <= 300.00
}

# Rule 2: Tri-State HITL Approval ($300 < amount <= $500)
requires_approval {
    input.tool_name == "issue_refund"
    input.amount > 300.00
    input.amount <= 500.00
}

# Rule 3: Zero-Destruction Invariant (Deny catastrophic drops)
deny_destructive {
    regex.match("DROP|TRUNCATE|terminate_all", input.query_or_command)
}

# Rule 4: Compound Sequence Invariant (Block bulk delete if audit disabled)
deny_sequence_breach {
    some step in input.session_trajectory
    step.tool_name == "disable_audit_logging"
    input.tool_name == "bulk_delete"
}
