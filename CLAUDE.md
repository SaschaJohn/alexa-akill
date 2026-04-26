# Hörspiel Player — Alexa Skill

Touch-first Alexa skill for Echo Show 8. Browse MP3 Hörspiel series, play episodes, track progress.

## Build

```bash
cd lambda && npm run build   # TypeScript → dist/
```

## Deploy

```bash
# 1. Infrastructure (once)
aws cloudformation deploy \
  --template-file infrastructure/template.yaml \
  --stack-name hoerspiel-skill \
  --region eu-central-1

# 2. Skill + Lambda
ask deploy
```

## Generate catalog from MP3 folder

```bash
npx ts-node tools/generate-catalog.ts /path/to/hoerspiele
```

Expected folder structure: `SeriesName/001 - Episode Title.mp3`

## Upload MP3s to S3

```bash
S3_BUCKET=hoerspiel-skill-media tools/upload-to-s3.sh /path/to/hoerspiele
```

## Architecture

- Lambda runtime: Node.js 20, TypeScript
- APL for touch UI on Echo Show
- AudioPlayer interface for MP3 playback
- DynamoDB `HoerspielProgress` table for played/unplayed + resume position
- S3 for MP3 + cover image hosting
- Lambda region: eu-west-1 (Alexa requirement), S3/DynamoDB: eu-central-1

## Key files

- `lambda/src/index.ts` — handler registration
- `lambda/src/content/series.json` — episode catalog
- `lambda/src/handlers/UserEventHandler.ts` — APL touch event routing
- `lambda/src/handlers/AudioPlayerHandlers.ts` — playback lifecycle
- `infrastructure/template.yaml` — DynamoDB + S3 CloudFormation
