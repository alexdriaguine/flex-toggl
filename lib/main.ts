import * as path from 'path'
import fetch from 'node-fetch'
import * as querystring from 'querystring'
import * as http from 'http'
import {apiToken} from './credentials'
const reportsPath = 'https://toggl.com/reports/api/v2/'
const basePath = 'https://www.toggl.com/api/v8/'
const user_agent = 'flex-app<alexdriagin12@gmail.com>'

async function main() {
  const auth = Buffer.from(`${apiToken}:api_token`).toString('base64')
  const headers = {
    Authorization: `Basic ${auth}`,
  }
  const getQueryString = (variables?: {[key: string]: any}) =>
    `?${querystring.stringify({
      ...variables,
      user_agent,
    })}`
  const getHeaders = (headers?: http.OutgoingHttpHeaders) => ({
    ...headers,
    Authorization: `Basic ${auth}`,
  })
  const {userId, workspaceId} = await fetch(
    basePath + 'me' + getQueryString(),
    {
      headers: getHeaders(),
    },
  )
    .then(res => res.json())
    .then(res => {
      return {
        userId: res.data.id,
        workspaceId: res.data.workspaces[0].id,
      }
    })
  interface Tag {
    id: number
    name: string
  }

  const {plus, minus} = await fetch(
    basePath + `workspaces/${workspaceId}/tags` + getQueryString(),
    {
      headers: getHeaders(),
    },
  )
    .then(res => res.json())
    .then((tags: Tag[]) => {
      const plus = tags.find(tag => tag.name === 'flex-plus')
      const minus = tags.find(tag => tag.name === 'flex-minus')
      return {
        plus,
        minus,
      }
    })

  if (!plus || !minus) {
    throw new Error('Must have one tag for plus time and one for minus time')
  }

  const flexPlus = await fetch(
    reportsPath +
      'summary.json' +
      getQueryString({
        tag_ids: [plus.id],
        user_ids: [userId],
        since: '2018-01-01',
        until: '2018-12-31',
        period: 'thisYear',
        workspace_id: workspaceId,
      }),
    {headers: getHeaders()},
  )
    .then(res => res.json())
    .then(res => {
      if (res.data.length === 0) {
        return 0
      }
      const {time} = res.data[0]
      return time
    })

  const flexMinus = await fetch(
    reportsPath +
      'summary.json' +
      getQueryString({
        tag_ids: [minus.id],
        user_ids: [userId],
        since: '2018-01-01',
        until: '2018-12-31',
        period: 'thisYear',
        workspace_id: workspaceId,
      }),
    {headers: getHeaders()},
  )
    .then(res => res.json())
    .then(res => {
      if (res.data.length === 0) {
        return 0
      }
      const {time} = res.data[0]
      return time
    })

  const diff = Math.abs(flexPlus - flexMinus)

  const prefix = flexPlus > flexMinus ? 'Plus(+)' : 'Minus(-)'

  let seconds = Math.floor((diff / 1000) % 60)
  let minutes = Math.floor((diff / (1000 * 60)) % 60)
  let hours = Math.floor((diff / (1000 * 60 * 60)) % 24)

  const hoursStr = hours < 10 ? '0' + hours : hours
  const minutesStr = minutes < 10 ? '0' + minutes : minutes
  const secondsStr = seconds < 10 ? '0' + seconds : seconds

  console.log(`Balance: ${prefix} ${hoursStr}:${minutesStr}:${secondsStr}`)
}

main()
