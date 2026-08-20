import json
import urllib.request
import functools

class SynapseGuard:
    """
    SynapseGuard Python SDK
    Deterministic Runtime & Rollback Interceptor for Autonomous AI Agents
    """
    def __init__(self, api_key: str = "syn_default", server_url: str = "http://localhost:4000"):
        self.api_key = api_key
        self.server_url = server_url.rstrip("/")

    def intercept_action(self, agent_id: str, tool_name: str, parameters: dict, transaction_id: str = None, enable_shadow: bool = True):
        url = f"{self.server_url}/api/v1/intercept"
        payload = json.dumps({
            "agentId": agent_id,
            "transactionId": transaction_id,
            "toolName": tool_name,
            "parameters": parameters,
            "enableShadow": enable_shadow
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))

    def protect(self, spend_limit: float = 500.0, shadow_simulate: bool = True):
        """Decorator to guard any Python function or tool called by an LLM."""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                tool_name = func.__name__
                decision = self.intercept_action(
                    agent_id="python-agent",
                    tool_name=tool_name,
                    parameters=kwargs,
                    enable_shadow=shadow_simulate
                )
                if not decision.get("allowed", False):
                    violations = decision.get("violations", [])
                    reason = violations[0]["reason"] if violations else "Action blocked by safety policy"
                    raise PermissionError(f"[SynapseGuard Blocked]: {reason}")
                
                # Execute with sanitized parameters
                sanitized = decision.get("sanitizedParameters", kwargs)
                return func(*args, **sanitized)
            return wrapper
        return decorator
