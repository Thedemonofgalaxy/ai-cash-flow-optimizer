"""
Agentic AI Framework - Base Agent Definition
Implements ReAct / Tool-Use autonomous execution loop with trace telemetry.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from .tools import Tool, GLOBAL_TOOL_REGISTRY
from .llm import LLMClient

class AgentTraceStep(BaseModel):
    step_number: int
    thought: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[Any] = None

class AgentResult(BaseModel):
    agent_name: str
    role: str
    status: str  # SUCCESS, WARNING, ERROR
    trace: List[AgentTraceStep]
    summary: str
    data: Dict[str, Any]
    artifacts: Optional[Dict[str, Any]] = None

class Agent:
    def __init__(
        self,
        name: str,
        role: str,
        system_prompt: str,
        tools: Optional[List[Tool]] = None,
        llm: Optional[LLMClient] = None
    ):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.tools = {t.name: t for t in (tools or [])}
        self.llm = llm or LLMClient()

    def add_tool(self, tool_instance: Tool):
        self.tools[tool_instance.name] = tool_instance

    def invoke_tool(self, tool_name: str, **kwargs) -> Any:
        tool_obj = self.tools.get(tool_name) or GLOBAL_TOOL_REGISTRY.get(tool_name)
        if not tool_obj:
            return {"error": f"Tool '{tool_name}' not available to agent '{self.name}'"}
        return tool_obj.execute(**kwargs)

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        Executes the agent's task. Subclasses or orchestrator customize the execution steps.
        """
        raise NotImplementedError("Subclasses should implement specific execution logic.")
