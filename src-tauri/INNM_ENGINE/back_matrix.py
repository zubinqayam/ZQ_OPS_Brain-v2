"""
INNM Engine – BACK Matrix
==========================
Context Validation layer of the Triangular Matrix.

Responsibilities:
- Validate the ParsedInput produced by the FRONT Matrix.
- Apply coherence checks against the conversation context.
- Enrich the input with contextual metadata.
- Pass a ValidatedContext object to the UP Matrix.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from front_matrix import ParsedInput


@dataclass
class ValidatedContext:
    """Validated and context-enriched representation of user input."""

    parsed: ParsedInput
    is_valid: bool = True
    warnings: list[str] = field(default_factory=list)
    context_tags: list[str] = field(default_factory=list)
    suggested_action: str = ""


class BackMatrix:
    """BACK Matrix: Context Validation."""

    def __init__(self) -> None:
        # Per-instance conversation history for coherence checking
        self._history: list[str] = []

    def validate(self, parsed: ParsedInput) -> ValidatedContext:
        """Validate a ParsedInput and return a ValidatedContext."""
        warnings: list[str] = []
        context_tags: list[str] = []

        # --- Basic checks ---
        if not parsed.raw.strip():
            return ValidatedContext(
                parsed=parsed,
                is_valid=False,
                warnings=["Empty input"],
            )

        if len(parsed.tokens) < 1:
            warnings.append("Very short message — intent confidence may be low.")

        # --- Coherence: detect repetition ---
        if parsed.raw in self._history[-5:]:
            warnings.append("Repeated message detected.")
            context_tags.append("repeated")

        # --- Intent-based tag assignment ---
        intent_tags = {
            "query": "information-request",
            "command": "action-request",
            "status": "status-check",
            "help": "help-request",
        }
        if parsed.intent in intent_tags:
            context_tags.append(intent_tags[parsed.intent])

        # --- Path entity check ---
        if "path" in parsed.entities:
            context_tags.append("filesystem-operation")

        suggested = self._suggest_action(parsed)

        # Record in history
        self._history.append(parsed.raw)
        if len(self._history) > 50:
            self._history.pop(0)

        return ValidatedContext(
            parsed=parsed,
            is_valid=True,
            warnings=warnings,
            context_tags=context_tags,
            suggested_action=suggested,
        )

    # ------------------------------------------------------------------

    def _suggest_action(self, parsed: ParsedInput) -> str:
        if parsed.intent == "command" and "path" in parsed.entities:
            return f"Execute filesystem command on {parsed.entities['path']}"
        if parsed.intent == "query":
            return "Search WOODS documents for relevant information"
        if parsed.intent == "status":
            return "Query INNM engine health metrics"
        if parsed.intent == "help":
            return "Provide guided assistance"
        return "Process general request through UP Matrix"
