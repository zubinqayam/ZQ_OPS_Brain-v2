"""
INNM Engine – IBox Core
========================
Central coordination module for the INNM (Integrated Neural Network Matrix)
engine.  Reads a message from stdin, passes it through the Triangular Matrix
pipeline (FRONT → BACK → UP), and writes the result to stdout.

Usage (as sidecar):
    echo "Hello INNM" | python ibox_core.py
"""

import sys
import json
from front_matrix import FrontMatrix
from back_matrix import BackMatrix
from up_matrix import UpMatrix


def process(message: str) -> str:
    """Run a message through the full Triangular Matrix pipeline."""
    front = FrontMatrix()
    back = BackMatrix()
    up = UpMatrix()

    parsed = front.process(message)
    validated = back.validate(parsed)
    response = up.synthesise(validated)
    return response


def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        print("INNM: no input received.", flush=True)
        return
    try:
        result = process(raw)
        print(result, flush=True)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        error = {"error": str(exc), "input": raw}
        print(json.dumps(error), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
