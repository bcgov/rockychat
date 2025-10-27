  make {options} \
  NAMESPACE='6e2f55-dev'\
  IMAGE_TAG='latest'


## Usage:

  make template NAMESPACE='6e2f55-dev' IMAGE_TAG='dev' and

  make install NAMESPACE='6e2f55-dev' IMAGE_TAG='dev' or
  make upgrade NAMESPACE='6e2f55-dev' IMAGE_TAG='dev'
  make upgrade NAMESPACE='6e2f55-prod' IMAGE_TAG='prod'

## Redis Backup

The chart includes automated Redis backup functionality using a Kubernetes CronJob:

- **Schedule**: Daily at 1:00 AM (`00 1 * * *`)
- **Retention**: Dev: 3 backups, Prod: 3 backups (set to 0 to disable cleanup)
- **Image**: Redis (`redis:7.2.4`), includes `redis-cli` tool

### How It Works

The backup CronJob:
1. Connects to Redis master over the network using `redis-cli`
2. Dumps the database to backup PVC using `--rdb` flag
3. Saves with timestamp: `dump.rdb.YYYY-MM-DD-HHMMSS`
4. Automatically cleans up old backups based on retention policy
5. No PVC mount conflicts - works while Redis is running!

### Manual Backup

To trigger a manual backup:

```bash
# For production
oc create job --from=cronjob/rockychat-devops-redis-backup manual-backup-$(date +%s) -n 6e2f55-prod

# For dev
oc create job --from=cronjob/rockychat-devops-redis-backup manual-backup-$(date +%s) -n 6e2f55-dev
```

### View Backup Logs

```bash
# List backup jobs
oc get jobs -n 6e2f55-prod | grep backup

oc logs -f manual-backup-1761252491-657hd
```

### Restore from Backup

To restore from a backup:

```bash
# 1. Create a temporary pod to access backups
oc run backup-list --image=alpine:3.19 -n 6e2f55-prod \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "list",
        "image": "alpine:3.19",
        "command": ["sleep", "300"],
        "volumeMounts": [{"name": "backup", "mountPath": "/backups"}]
      }],
      "volumes": [
        {"name": "backup", "persistentVolumeClaim": {"claimName": "rockychat-devops-redis-backup-pvc"}}
      ],
      "restartPolicy": "Never"
    }
  }'

Wait for pod to be ready

# List available backups
oc exec backup-list -n 6e2f55-prod -- ls -lht /backups/

# Delete the temporary pod after viewing
oc delete pod backup-list -n 6e2f55-prod

# 2. Scale down Redis to prevent writes
oc scale statefulset rockychat-devops-redis-master --replicas=0 -n 6e2f55-prod

# 3. Create a restore pod with both Redis data PVC and backup PVC
oc run redis-restore --image=redis:7.2.4 -n 6e2f55-prod \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "restore",
        "image": "redis:7.2.4",
        "command": ["sleep", "3600"],
        "volumeMounts": [
          {"name": "redis-data", "mountPath": "/data"},
          {"name": "backup", "mountPath": "/backups"}
        ]
      }],
      "volumes": [
        {"name": "redis-data", "persistentVolumeClaim": {"claimName": "redis-data-rockychat-devops-redis-master-0"}},
        {"name": "backup", "persistentVolumeClaim": {"claimName": "rockychat-devops-redis-backup-pvc"}}
      ],
      "restartPolicy": "Never"
    }
  }'

# 4. Wait for pod to be ready, then copy the backup file to Redis data directory
oc wait --for=condition=Ready pod/redis-restore -n 6e2f55-prod --timeout=60s
oc exec redis-restore -n 6e2f55-prod -- cp /backups/dump.rdb.2025-01-15-010000 /data/dump.rdb

# 5. Verify the restore
oc exec redis-restore -n 6e2f55-prod -- ls -lh /data/dump.rdb

# 6. Clean up and restart Redis
oc delete pod redis-restore -n 6e2f55-prod
oc scale statefulset rockychat-devops-redis-master --replicas=1 -n 6e2f55-prod
```

### Disable Backups

To disable backups, set in your values file:

```yaml
redisBackup:
  enabled: false
```