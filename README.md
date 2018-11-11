## Toggle flex time
Calculates the balance of your extra time (if using toggle).

We use two tags at our company to track this:
- `flex-plus` if you are working over
- `flex-minus` if you are going home early

Going to `/reports` and applying filters etc is tedious work.
This little cli can help you track this time to see how many flexible hours you have in your balance.

## Note
:warning:
This is still a WIP, and assumes a lot of things, as I primarly made it for myself.  
First, it assumes you have one workspace, if you have more there is no way of choosing as it defaults to basically `workspaces[0]`.  
Second, the tags must be named `flex-plus` and `flex-minus`.


To use this, you have to grab your personal API-token from
`toggl.com/app/profile`. The token will be stored in clear text in a json-file on your computer. If you are not comfortable with this, do not use this.




## Installing
`npm install -g toggl-flex`

## Usage
- `toggl-flex` prints help
- `toggl-flex balance` gets flex balance
- `toggl-flex settings -t <your-token-here>` sets your toggl api token  

## TODO:

- [x] type the responses
- [x] make it work for me
- [x] npm package, so we can use `npx`
- [x] able to set and store api token()
- [ ] encrypt token or something
- [ ] able to set and change default workspace
- [ ] able to set and change default tags for flex plus / flex minus
- [ ] store user id
- [ ] spinner