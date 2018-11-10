## Toggle flex time
Calculates the balance of your extra time (if using toggle).

We use two tags at our company to track this:
- `flex-plus` if you are working over
- `flex-minus` if you are going home early

Going to `/reports` and applying filters etc is tedious work.
This little cli can help you track this time to see how many flexible hours you have in your balance.  


## Using
1. Install dependencies `yarn`
2. Compile ts -> js, `yarn compile`
4. Go to your toggle account profile, `toggl.com/app/profile`
5. Scroll down until you see **API token**, copy paste it into the `apiToken` variable in `credentials.ts`
6. Run it `yarn run` 
7. Paste the token when prompted

## TODO:

- [x] type the responses
- [x] make it work for me
- [ ] npm package, so we can use `npx`
- [x] able to set and store api token()
- [ ] encrypt token or something
- [ ] able to set and change default workspace
- [ ] able to set and change default tags for flex plus / flex minus
- [ ] store user id
- [ ] colors and stuf
- [ ] spinner