# aesoSyncDB
Getting [AESO](http://ets.aeso.ca/) pool price data and store it inside Postgres

# Setup
Create a configuration file named `dbConfig.json` and change the Postgres settings
You can do so by make a copy of `dbConfig.example.json` and rename it

# Run Script
```bash
npm i
node syncForcast.js
# or
node getForcastHistory.js
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
*/2 * * * * cd /home/ubuntu/aesoSyncDB && /usr/bin/node syncForcast.js >> /home/ubuntu/aeso_logfile.log 2>> /home/ubuntu/aeso_error.log
```
