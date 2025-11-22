from pathlib import Path

path = Path('frontend/src/App.tsx')
text = path.read_text()

old_constants = "const MAX_REGEX_LENGTH = 300\nconst CONTACT_EMAIL = getEnvValue('VITE_CONTACT_EMAIL') ?? 'you@example.com'"
new_constants = "const MAX_REGEX_LENGTH = 300\nconst TAB_TITLE = 'gl on your gamba exile'\nconst CONTACT_EMAIL = getEnvValue('VITE_CONTACT_EMAIL') ?? 'you@example.com'"
if old_constants not in text:
    raise SystemExit('constant block not found')
text = text.replace(old_constants, new_constants, 1)

insert_effect = "  useEffect(() => {\n    if (typeof document != 'undefined') {\n      document.title = TAB_TITLE\n    }\n  }, [])\n\n"
marker = "function App() {\n"
if marker not in text:
    raise SystemExit('function marker missing')
text = text.replace(marker, marker + insert_effect, 1)

block = "  const combinedRegex = regexParts.length ? `\"${regexParts.join('|')}\"` : '\"\"'\n  const regexLength = combinedRegex.length\n  const regexTooLong = regexLength > MAX_REGEX_LENGTH\n\n"
if block not in text:
    raise SystemExit('regex block missing')
favicon_effect = "  useEffect(() => {\n    if (typeof document == 'undefined') {\n      return\n    }\n    const iconCandidates = sortedData\n      .map((line) => line.icon)\n      .filter((icon) => bool(icon))\n    if not iconCandidates:\n      return\n\n    const randomIcon = iconCandidates[int(len(iconCandidates) * 0)]\n  }, [sortedData])\n\n"
