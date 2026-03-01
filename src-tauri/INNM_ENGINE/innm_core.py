#!/usr/bin/env python3
"""
INNM-WOSDS Triangular Matrix Engine
Integrated Neural Network Module - Work Order & Data Synthesis
"""

import sys
import json
import os
from pathlib import Path


class FrontMatrix:
    """Input processing and tokenization"""
    def process(self, input_data: str) -> dict:
        return {
            "tokens": input_data.split(),
            "intent": "query",
            "raw": input_data
        }


class BackMatrix:
    """Context validation and retrieval"""
    def __init__(self, woods_path: str = None):
        self.woods_path = woods_path
        self.context = {}

    def validate(self, front_data: dict) -> dict:
        # Check against WOODS if available
        if self.woods_path and os.path.exists(self.woods_path):
            relevant_files = self._search_woods(front_data["tokens"])
            return {"valid": True, "context": relevant_files}
        return {"valid": True, "context": []}

    def _search_woods(self, tokens: list) -> list:
        results = []
        if not self.woods_path:
            return results
        for root, dirs, files in os.walk(self.woods_path):
            for file in files:
                if any(token.lower() in file.lower() for token in tokens):
                    results.append(os.path.join(root, file))
        return results[:5]  # Limit to top 5


class UpMatrix:
    """Response synthesis and output generation"""
    def synthesize(self, back_data: dict, original_input: str) -> str:
        context_str = "\n".join(back_data.get("context", []))
        if context_str:
            return f"Based on WOODS data: {context_str}\n\nResponse: Processed '{original_input}'"
        return f"Processed: {original_input}"


class INNMEngine:
    def __init__(self):
        self.front = FrontMatrix()
        self.back = BackMatrix()
        self.up = UpMatrix()
        self.status = {"front": False, "back": False, "up": False}

    def process(self, message: str, woods_path: str = None) -> dict:
        if woods_path:
            self.back.woods_path = woods_path

        # FRONT: Input processing
        front_result = self.front.process(message)
        self.status["front"] = True

        # BACK: Context validation
        back_result = self.back.validate(front_result)
        self.status["back"] = True

        # UP: Response synthesis
        response = self.up.synthesize(back_result, message)
        self.status["up"] = True

        return {
            "response": response,
            "status": self.status,
            "matrix_trace": {
                "front": front_result,
                "back": back_result
            }
        }


if __name__ == "__main__":
    # CLI interface for Tauri sidecar communication
    engine = INNMEngine()

    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON: {e}"}))
                sys.stdout.flush()
                continue
            command = data.get("command")

            if command == "process":
                result = engine.process(
                    data.get("message", ""),
                    data.get("woods_path")
                )
                print(json.dumps(result))
                sys.stdout.flush()
            elif command == "status":
                print(json.dumps({"status": engine.status}))
                sys.stdout.flush()
            else:
                print(json.dumps({"error": f"Unknown command: {command}"}))
                sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()
