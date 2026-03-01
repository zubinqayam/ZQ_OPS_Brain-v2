"""
INNM Engine – WOODS Builder
============================
Builds and manages the WOODS (Working Object Oriented Document Store)
index from a mapped folder.

Responsibilities:
- Walk a directory tree and index supported document types.
- Provide keyword search over indexed documents.
- Return ranked results to the INNM pipeline.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

# Supported document extensions
SUPPORTED_EXTENSIONS: set[str] = {".txt", ".md", ".csv", ".log"}


@dataclass
class Document:
    """A single indexed document."""

    path: str
    extension: str
    content: str
    tokens: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.tokens = re.findall(r"\w+", self.content.lower())


@dataclass
class SearchResult:
    """A ranked search result."""

    document: Document
    score: float
    snippet: str


class WoodsBuilder:
    """WOODS Builder: document indexing and retrieval."""

    def __init__(self) -> None:
        self._index: list[Document] = []
        self._root: str = ""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def map_folder(self, folder_path: str) -> int:
        """Index all supported documents under *folder_path*.

        Returns the number of documents indexed.
        """
        self._root = folder_path
        self._index.clear()
        self._walk(folder_path)
        return len(self._index)

    def search(self, query: str, top_k: int = 5) -> list[SearchResult]:
        """Search the index for documents relevant to *query*.

        Returns up to *top_k* ranked results.
        """
        query_tokens = set(re.findall(r"\w+", query.lower()))
        results: list[SearchResult] = []

        for doc in self._index:
            doc_tokens = set(doc.tokens)
            if not doc_tokens:
                continue
            score = len(query_tokens & doc_tokens) / len(query_tokens | doc_tokens)
            if score > 0:
                snippet = self._extract_snippet(doc.content, query_tokens)
                results.append(SearchResult(document=doc, score=score, snippet=snippet))

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]

    @property
    def document_count(self) -> int:
        """Number of indexed documents."""
        return len(self._index)

    @property
    def root_path(self) -> str:
        """The mapped root folder path."""
        return self._root

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _walk(self, path: str) -> None:
        try:
            entries = os.scandir(path)
        except PermissionError:
            return
        for entry in entries:
            if entry.is_dir(follow_symlinks=False):
                self._walk(entry.path)
            elif entry.is_file():
                _, ext = os.path.splitext(entry.name)
                if ext.lower() in SUPPORTED_EXTENSIONS:
                    self._index_file(entry.path, ext.lower())

    def _index_file(self, file_path: str, extension: str) -> None:
        try:
            with open(file_path, encoding="utf-8", errors="replace") as fh:
                content = fh.read()
            self._index.append(Document(path=file_path, extension=extension, content=content))
        except OSError:
            pass

    @staticmethod
    def _extract_snippet(content: str, query_tokens: set[str], window: int = 80) -> str:
        """Return a short snippet around the first query token match."""
        lower = content.lower()
        for token in query_tokens:
            idx = lower.find(token)
            if idx >= 0:
                start = max(0, idx - window // 2)
                end = min(len(content), idx + window // 2)
                snippet = content[start:end].replace("\n", " ").strip()
                return f"…{snippet}…"
        return content[:window].replace("\n", " ").strip() + "…"
