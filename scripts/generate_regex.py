#!/usr/bin/env python3
"""Generate regex snippets per scarab entry from data.json."""
from __future__ import annotations
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

DATA_PATH = Path('data.json')
OUTPUT_PATH = Path('scarab_regex.json')
MIN_LENGTH = 2
MIN_ALPHA_LENGTH = 3
MAX_LENGTH = 12

_token_re = re.compile(r"[^\s]+")


def escape_literal(text: str) -> str:
    special = set(r"\.^$|?*+()[]{}")
    return ''.join(f"\\{ch}" if ch in special else ch for ch in text)


@dataclass
class Segment:
    field: str
    text: str


@dataclass
class Scarab:
    details_id: str
    name: str
    segments: List[Segment]


def collect_segments(entry: dict) -> List[Segment]:
    segments: List[Segment] = []

    def push(field: str, text: Optional[str]) -> None:
        if not text:
            return
        if not _token_re.search(text):
            return
        segments.append(Segment(field=field, text=text))

    push('name', entry.get('name'))

    for idx, modifier in enumerate(entry.get('explicitModifiers') or []):
        push(f'explicit_modifier_{idx}', modifier.get('text'))

    push('flavourText', entry.get('flavourText'))

    if not segments and entry.get('detailsId'):
        push('detailsId', entry['detailsId'].replace('-', ' '))

    return segments


def load_scarabs() -> List[Scarab]:
    payload = json.loads(DATA_PATH.read_text(encoding='utf-8'))
    scarabs: List[Scarab] = []
    for entry in payload.get('lines', []):
        segments = collect_segments(entry)
        if not segments:
            continue
        scarabs.append(Scarab(details_id=entry.get('detailsId', f"scarab-{len(scarabs)}"), name=entry.get('name', ''), segments=segments))
    return scarabs


def iter_substring_candidates(segment: Segment, target_length: Optional[int] = None):
    text = segment.text
    for match in _token_re.finditer(text):
        block = match.group(0)
        block_start = match.start()
        max_len = min(len(block), MAX_LENGTH)
        if target_length is not None:
            if target_length < MIN_LENGTH or target_length > max_len:
                continue
            lengths = [target_length]
        else:
            lengths = range(MIN_LENGTH, max_len + 1)

        for length in lengths:
            for offset in range(0, len(block) - length + 1):
                snippet = block[offset : offset + length]
                if length < MIN_ALPHA_LENGTH and snippet.isalnum():
                    continue
                yield {
                    'text': snippet,
                    'start': block_start + offset,
                    'length': length,
                    'field': segment.field,
                }


def build_frequency_tables(scarabs: List[Scarab]):
    freq: Dict[int, Dict[str, set]] = {n: defaultdict(set) for n in range(MIN_LENGTH, MAX_LENGTH + 1)}
    for scarab in scarabs:
        for segment in scarab.segments:
            for candidate in iter_substring_candidates(segment):
                freq[candidate['length']][candidate['text'].lower()].add(scarab.details_id)
    return freq


def field_priority(field: str) -> int:
    if field == 'name':
        return 0
    if field.startswith('explicit_modifier'):
        return 1
    if field == 'flavourText':
        return 2
    return 3


def pick_snippet(scarab: Scarab, freq_tables: Dict[int, Dict[str, set]]):
    for length in range(MIN_LENGTH, MAX_LENGTH + 1):
        best = None
        best_info = None
        for segment in scarab.segments:
            for candidate in iter_substring_candidates(segment, target_length=length):
                key = candidate['text'].lower()
                if len(freq_tables[length].get(key, ())) != 1:
                    continue
                priority = (field_priority(segment.field), candidate['start'])
                if best is None or priority < best:
                    best = priority
                    best_info = {'text': candidate['text'], 'field': candidate['field']}
        if best_info:
            return best_info

    primary = scarab.segments[0]
    return {'text': primary.text.strip(), 'field': primary.field}


def main():
    scarabs = load_scarabs()
    freq_tables = build_frequency_tables(scarabs)
    patterns = []
    for scarab in scarabs:
        snippet_info = pick_snippet(scarab, freq_tables)
        regex = escape_literal(snippet_info['text'])
        patterns.append({
            'detailsId': scarab.details_id,
            'name': scarab.name,
            'regex': regex,
            'source_field': snippet_info['field'],
            'match_text': snippet_info['text'],
        })

    output = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source_data': DATA_PATH.name,
        'pattern_count': len(patterns),
        'patterns': patterns,
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"wrote {len(patterns)} regex patterns to {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
