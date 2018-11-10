interface GetFlexTimeArgs {
  plus: number
  minus: number
}

interface FlexTime {
  hours: number
  minutes: number
  seconds: number
  positive: boolean
}

export const getFlexTime = ({plus, minus}: GetFlexTimeArgs) => {
  const diff = Math.abs(plus - minus)

  let seconds = Math.floor((diff / 1000) % 60)
  let minutes = Math.floor((diff / (1000 * 60)) % 60)
  let hours = Math.floor((diff / (1000 * 60 * 60)) % 24)

  return {
    hours,
    seconds,
    minutes,
    positive: plus > minus,
  }
}

export const toFlexTimeString = (args: FlexTime) => {
  const hours = args.hours < 10 ? '0' + args.hours : args.hours
  const minutes = args.minutes < 10 ? '0' + args.minutes : args.minutes
  const seconds = args.seconds < 10 ? '0' + args.seconds : args.seconds

  const prefix = args.positive ? '+' : '-'

  return `${prefix}${hours}:${minutes}:${seconds}`
}
