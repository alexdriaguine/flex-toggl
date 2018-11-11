#!/usr/bin/env node

import chalk from 'chalk'
import {getTogglClient, SummaryData} from './toggl'
import {RequestError} from './request-error'
import {prompt} from './prompt'
import {toFlexTimeString, getFlexTime} from './time'
import {store} from './store'
import * as commandLineArgs from 'command-line-args'

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

const settings = () => {
  const settingsDefitions = [{name: 'token', alias: 't'}]
  const settingsOptions = commandLineArgs(settingsDefitions, {argv})

  if (settingsOptions.token) {
    store.setSettings({apiToken: settingsOptions.token}).then(() => {
      console.log(chalk.greenBright('Successfully set toggl api token'))
    })
  }
}

const help = (subCommand: string) => {
  if (subCommand === 'balance') {
    console.log('Balance help')
  } else if (subCommand === 'settings') {
    console.log('Settings help')
  } else {
    const help = `
${chalk.underline.bold('toggl-flex')}

  Check your flex(ible) time at toggl!

${chalk.underline.bold('Usage')}

  $ toggl-flex <command> <options>
  $ toggl-flex balance
  $ toggl-flex settings -t <your-toggle-token>

${chalk.underline.bold('Commands')}

  balance       Get your flex(ible) time balance
  settings      Set settings
  help          Se command line usage

Run 'toggl-flex help <command>' for help with a specific command
        `
    console.log(help)
  }
}

/* first - parse the main command */
let mainDefinitions = [{name: 'name', defaultOption: true}]
const mainCommand = commandLineArgs(mainDefinitions, {stopAtFirstUnknown: true})
let argv = mainCommand._unknown || []

if (mainCommand.name === 'balance') {
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
}

if (mainCommand.name === 'settings') {
  settings()
}

if (mainCommand.name === 'help' || !mainCommand.name) {
  const runDefinitions = [{name: 'name', defaultOption: true}]

  const subCommand = commandLineArgs(runDefinitions, {
    argv,
    stopAtFirstUnknown: true,
  })
  help(subCommand.name)
}
