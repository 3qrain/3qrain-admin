const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

const dateOnlyFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function getParts(formatter: Intl.DateTimeFormat, ts: string | number) {
  return Object.fromEntries(
    formatter.formatToParts(new Date(ts)).map(part => [part.type, part.value])
  )
}

export function formatDate(ts: string | number) {
  const { year, month, day, hour, minute } = getParts(dateFormatter, ts)
  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

export function formatDateOnly(ts: string | number) {
  const { year, month, day } = getParts(dateOnlyFormatter, ts)
  return `${year}.${month}.${day}`
}
