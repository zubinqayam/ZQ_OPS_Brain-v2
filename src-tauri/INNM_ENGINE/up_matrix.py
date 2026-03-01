"""
INNM Engine – UP Matrix
========================
Response Synthesis layer of the Triangular Matrix.

Responsibilities:
- Consume a ValidatedContext from the BACK Matrix.
- Synthesise a human-readable response.
- Apply tone/style adjustments.
- Return the final response string.
"""

from __future__ import annotations

from back_matrix import ValidatedContext


class UpMatrix:
    """UP Matrix: Response Synthesis."""

    def synthesise(self, context: ValidatedContext) -> str:
        """Generate a final response from a ValidatedContext."""
        if not context.is_valid:
            return "⚠️ " + "; ".join(context.warnings or ["Invalid input."])

        parts: list[str] = []

        # Lead with the suggested action
        if context.suggested_action:
            parts.append(f"Action: {context.suggested_action}")

        # Mention context tags
        if context.context_tags:
            tags_str = ", ".join(context.context_tags)
            parts.append(f"Context: [{tags_str}]")

        # Warnings
        for w in context.warnings:
            parts.append(f"⚠️ Note: {w}")

        # Intent-specific response body
        body = self._build_body(context)
        parts.append(body)

        return "\n".join(parts)

    # ------------------------------------------------------------------

    def _build_body(self, context: ValidatedContext) -> str:
        parsed = context.parsed
        intent = parsed.intent

        if intent == "query":
            return (
                f'Searching WOODS documents for: "{parsed.raw}"\n'
                "FRONT → BACK → UP pipeline complete."
            )
        if intent == "command":
            if "path" in parsed.entities:
                return (
                    f"Executing command on path: {parsed.entities['path']}\n"
                    "Use `map_woods_folder` Tauri command to index documents."
                )
            return f"Command understood: {parsed.raw}"
        if intent == "status":
            return (
                "INNM Engine Status:\n"
                "  • FRONT Matrix  ✅ online\n"
                "  • BACK Matrix   ✅ online\n"
                "  • UP Matrix     ✅ online\n"
                "  • WOODS Builder ✅ ready"
            )
        if intent == "help":
            return (
                "ZQ Ops Brain v2 – INNM Help\n"
                "Commands: map <path>, status, help\n"
                "Ask any question to search your WOODS documents."
            )
        return f'Processed: "{parsed.raw}" (confidence: {parsed.confidence})'
