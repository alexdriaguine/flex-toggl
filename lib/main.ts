import chalk from 'chalk'
import {getTogglClient, SummaryData} from './toggl'
import {RequestError} from './request-error'
import {prompt} from './prompt'
import {toFlexTimeString, getFlexTime} from './time'
import {store} from './store'

async function getBalance() {

  let settings = store.getSettings()

  if (!settings.apiToken) {
    const newToken = await prompt(
      'No API token found for toggl. Please enter it: ',
    )

    settings = await store.setSettings({apiToken: newToken})
  }

  const client = getTogglClient(settings)

  const {userId, workspaceId} = await client.getProfile().then(({data}) => ({
    userId: data.id,
    workspaceId: data.workspaces[0].id,
  }))

  const {plus, minus} = await client.getTags(workspaceId).then(tags => ({
    plus: tags.find(tag => tag.name === 'flex-plus'),
    minus: tags.find(tag => tag.name === 'flex-minus'),
  }))

  if (!plus || !minus) {
    throw new Error('Must have one tag for plus time and one for minus time')
  }

  const flexOptions = (flexTagId: number) => ({
    since: '2018-01-01',
    until: '2018-12-31',
    period: 'thisYear',
    flexTagId,
    userId,
    workspaceId,
  })

  const extractTime = ({data}: SummaryData) => {
    if (!data || data.length === 0) {
      return 0
    }
    const [{time}] = data
    return time
  }

  const flexPlus = await client
    .getFlexTime(flexOptions(plus.id))
    .then(extractTime)

  const flexMinus = await client
    .getFlexTime(flexOptions(minus.id))
    .then(extractTime)

  const flexTime = getFlexTime({plus: flexPlus, minus: flexMinus})

  return {
    positive: flexTime.positive,
    flexTime: toFlexTimeString(flexTime),
  }
}

getBalance()
  .then(({positive, flexTime}) => {
    const color = positive ? chalk.greenBright : chalk.redBright
    const prefix = positive ? '+' : '-'
    console.log(color(`Balance: ${prefix}${flexTime}`))
    process.exit(0)
  })
  .catch(err => {
    if (err instanceof RequestError) {
      console.log(chalk.red(`${err.code}: ${err.message}`))
      process.exit(1)
      return
      // If 403, prompt user for new token
      // Save it, and rerum main!
    } else {
      console.log(chalk.red('Something went wrong.. Im so sorry'))
      process.exit(1)
      return
    }
  })
