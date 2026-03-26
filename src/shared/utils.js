export function capitalize(string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function comma(i, list, commaStr = ', ') {
  if (!list) return ''
  if (i < list.length - 1) return commaStr
  return ''
}

export function decoratedNumber(value) {
  return value > 0 ? `+${value}` : `${value}`
}
