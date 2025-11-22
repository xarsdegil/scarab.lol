import regexPayload from './data/scarabRegex.json'

type RegexPattern = {
  detailsId: string
  regex: string
}

type RegexFile = {
  patterns: RegexPattern[]
}

const typedPayload = regexPayload as RegexFile
const regexMap = new Map<string, string>()

typedPayload.patterns.forEach((pattern) => {
  regexMap.set(pattern.detailsId, pattern.regex)
})

export function getRegexFor(detailsId: string) {
  return regexMap.get(detailsId)
}

export function hasRegex(detailsId: string) {
  return regexMap.has(detailsId)
}

export function listRegexEntries() {
  return typedPayload.patterns
}
