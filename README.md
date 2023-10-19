# aesoSyncDB
Getting [AESO](http://ets.aeso.ca/) pool price data and store it inside Postgres

# Run Script
```bash
pnpm i
node sync.js
# or
node getHistory.js
# for import history
```

# Run Script on Cron Jobs
- Find Node Path
```bash
which node
```
- Edit Cron Jobs
```
crontab -e
```

- Set your Change Cron Job to CD into the destination folder, call Node Path by it's full path and run script

- I have also attached logs for this script

```bash
*/2 * * * * cd /home/ubuntu/aesoSyncDB && /usr/bin/node sync.js >> /home/ubuntu/aeso_logfile.log 2>> /home/ubuntu/aeso_error.log
```