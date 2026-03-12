"""
INNM Engine – FRONT Matrix
===========================
Input Processing layer of the Triangular Matrix.

Responsibilities:
- Tokenise and normalise the raw input string.
- Extract intent and named entities.
- Produce a structured ParsedInput object for the BACK Matrix.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class ParsedInput:
    """Structured representation of a user message."""

    raw: str
    tokens: list[str] = field(default_factory=list)
    intent: str = "unknown"
    entities: dict[str, str] = field(default_factory=dict)
    confidence: float = 0.0


# Simple intent keyword map (expandable)
_INTENT_MAP: dict[str, list[str]] = {
    "query": ["what", "how", "where", "when", "who", "why", "?"],
    "command": ["map", "create", "add", "delete", "remove", "open", "run"],
    "status": ["status", "check", "health", "ping"],
    "help": ["help", "assist", "guide", "explain"],
}


class FrontMatrix:
    """FRONT Matrix: Input Processing."""

    def process(self, message: str) -> ParsedInput:
        """Parse a raw message string into a ParsedInput."""
        tokens = re.findall(r"\w+|\?", message.lower())
        intent, confidence = self._detect_intent(tokens)
        entities = self._extract_entities(message)

        return ParsedInput(
            raw=message,
            tokens=tokens,
            intent=intent,
            entities=entities,
            confidence=confidence,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _detect_intent(self, tokens: list[str]) -> tuple[str, float]:
        scores: dict[str, int] = {k: 0 for k in _INTENT_MAP}
        for token in tokens:
            for intent, keywords in _INTENT_MAP.items():
                if token in keywords:
                    scores[intent] += 1

        best_intent = max(scores, key=lambda k: scores[k])
        total = sum(scores.values()) or 1
        confidence = scores[best_intent] / total
        return best_intent if confidence > 0 else "general", round(confidence, 2)

    def _extract_entities(self, message: str) -> dict[str, str]:
        entities: dict[str, str] = {}
        # Extract file-system paths
        path_match = re.search(r"[/\\][^\s]+", message)
        if path_match:
            entities["path"] = path_match.group(0)
        # Extract quoted strings
        quoted = re.findall(r'"([^"]+)"', message)
        if quoted:
            entities["quoted"] = quoted[0]
        return entities
