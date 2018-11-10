import * as querystring from 'querystring'
import fetch from 'node-fetch'
import {OutgoingHttpHeaders} from 'http'
import {RequestError} from './request-error'
import {Settings} from './store'

type ClientType = 'base' | 'reports'
type AllowedMethods = 'GET'

type QueryParams = {
  [queryParam: string]: string | number | string[] | number[]
}

type ClientOptions = {
  method?: AllowedMethods
  headers?: OutgoingHttpHeaders
  queryParams?: QueryParams
}
interface Client {
  executeRequest: <TResponse>(
    path: string,
    options?: ClientOptions,
  ) => Promise<TResponse>
}

const REPORTS_PATH = 'https://toggl.com/reports/api/v2/'
const BASE_API_PATH = 'https://www.toggl.com/api/v8/'
const user_agent = 'flex-app<alexdriagin12@gmail.com>'

const getBasicAuth = ({apiToken}: Settings) =>
  `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`

const getHeaders = (settings: Settings, headers?: {[key: string]: string}) => ({
  ...headers,
  Authorization: getBasicAuth(settings),
})

const getQueryString = (variables?: QueryParams) => {
  const stringified = querystring.stringify({
    ...variables,
    user_agent,
  })
  return `?${stringified}`
}

const buildClient = (api: ClientType, settings: Settings): Client => {
  const headers = getHeaders(settings)

  let basePath = ''

  if (api === 'base') {
    basePath = BASE_API_PATH
  }
  if (api === 'reports') {
    basePath = REPORTS_PATH
  }

  const executeRequest = <TResponse>(path: string, options?: ClientOptions) => {
    const method = options ? options.method : 'GET'
    const url = `${basePath}${path}${getQueryString(
      options ? options.queryParams : {},
    )}`
    // TODO check for status codes and return human readable errors
    return fetch(url, {headers, method})
      .then(res => {
        if (res.ok) {
          return res
        }
        throw new RequestError({
          code: res.status,
          message: `${url} ${res.statusText}`,
        })
      })
      .then(res => res.json() as Promise<TResponse>)
  }

  return {executeRequest}
}

export const getTogglClient = (settings: Settings) => {
  const reports = buildClient('reports', settings)
  const base = buildClient('base', settings)

  return {
    getProfile: () => base.executeRequest<Profile>('me'),
    getTags: (workspaceId: number) =>
      base.executeRequest<Tag[]>(`workspaces/${workspaceId}/tags`),
    getFlexTime: ({
      userId,
      flexTagId,
      since,
      until,
      period,
      workspaceId,
    }: GetFlexTimeArgs) =>
      reports.executeRequest<SummaryData>('summary.json', {
        queryParams: {
          tag_ids: [flexTagId],
          user_ids: [userId],
          until,
          since,
          period,
          workspace_id: workspaceId,
        },
      }),
  }
}

interface GetFlexTimeArgs {
  userId: number
  flexTagId: number
  since: string
  until: string
  period: string
  workspaceId: number
}

// Contains only a subset of all the properties
interface Profile {
  since: number
  data: ProfileData
}
interface ProfileData {
  id: number
  api_token: string
  email: string
  fullname: string
  workspaces: Workspace[]
}

interface Workspace {
  id: number
  name: string
}

interface Tag {
  id: number
  wid: number
  name: string
  at: string
}

export interface SummaryData {
  data: SummaryDataItem[]
}

interface SummaryDataItem {
  id: number
  time: number
}
