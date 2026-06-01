# Incident Alert Dashboard

A real-time incident monitoring platform built with a serverless AWS backend and React frontend, fully provisioned with Terraform!!

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                │
│                                                                 │
│  CloudWatch ──▶ Simulator Lambda ──▶ SNS Topic ──▶ SQS Queue   │
│  (2 min)        (generates events)    (fan-out)    (buffer)     │
│                                                                 │
│                                          │                      │
│                                          ▼                      │
│                                   Processor Lambda              │
│                                   (score severity)              │
│                                      │       │                  │
│                                      ▼       ▼                  │
│                                 DynamoDB   API Gateway          │
│                                (incidents)  (WebSocket)         │
│                                               │                 │
│  S3 + CloudFront ◀── React Dashboard ◀────────┘                │
│  (static hosting)    (live alerts, actions)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Real-time alerts** — incidents push to the dashboard instantly via WebSocket, no polling
- **Severity scoring** — processor Lambda classifies events as critical, warning, or info based on configurable thresholds
- **Incident lifecycle** — acknowledge, escalate, or resolve incidents with one click, broadcast to all connected clients
- **Live filtering** — filter by severity, status, or service
- **Stats panel** — real-time counts by status/severity and mean time to acknowledge (MTTA)
- **Fully serverless** — Lambda, DynamoDB, API Gateway, SNS, SQS — no servers to manage
- **Infrastructure as Code** — 36 AWS resources across 6 Terraform modules

## Tech Stack

- **Infrastructure**: Terraform, AWS (VPC, Lambda, DynamoDB, SNS, SQS, API Gateway WebSocket, S3, CloudFront)
- **Backend**: Node.js 20.x (Lambda functions)
- **Frontend**: React, Vite

## Project Structure

```
├── terraform/
│   ├── main.tf                    # Root module
│   ├── variables.tf               # Global config
│   ├── outputs.tf                 # Endpoints and URLs
│   ├── providers.tf               # AWS provider
│   ├── modules/
│   │   ├── networking/            # VPC, subnets, IGW
│   │   ├── dynamodb/              # Incidents + connections tables
│   │   ├── messaging/             # SNS topic, SQS queue, DLQ
│   │   ├── lambda/                # 5 Lambda functions + IAM
│   │   ├── websocket/             # API Gateway WebSocket API
│   │   └── frontend/              # S3 + CloudFront hosting
│   └── lambda_src/
│       ├── simulator/             # Generates fake health events
│       ├── processor/             # Scores severity, stores, pushes
│       ├── ws_connect/            # WebSocket $connect handler
│       ├── ws_disconnect/         # WebSocket $disconnect handler
│       └── ws_default/            # Handles acknowledge/escalate/resolve
├── frontend/
│   └── src/
│       ├── App.jsx                # Main app with state management
│       ├── hooks/useWebSocket.js  # Auto-reconnecting WebSocket hook
│       └── components/            # AlertCard, AlertFeed, StatsPanel, FilterBar
├── deploy.sh                      # Build + deploy script
└── README.md
```

## Setup

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [Node.js](https://nodejs.org/) >= 18

### Deploy

```bash
# 1. Provision infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# 2. Build and upload frontend
cd ../frontend
npm install
npm run build
aws s3 sync dist s3://$(cd ../terraform && terraform output -raw frontend_bucket) --delete

# 3. Open the dashboard
cd ../terraform
terraform output frontend_url
```

### Tear down

```bash
cd terraform
terraform destroy
```

## Design Decisions

- **SNS → SQS (not direct Lambda invocation)**: Decouples the event producer from consumers. Adding a new subscriber (e.g., email alerts, Slack integration) requires only a new SNS subscription, no changes to the simulator.
- **SQS with DLQ**: Failed events retry 3 times before landing in the dead letter queue, preventing data loss without blocking the pipeline.
- **WebSocket over polling**: Sub-second alert delivery. Polling at even 5-second intervals would miss the real-time feel and waste Lambda invocations.
- **DynamoDB on-demand**: Unpredictable traffic pattern (bursty alerts) makes on-demand billing more cost-effective than provisioned capacity.
- **Separate connections table**: Storing WebSocket connection IDs separately from incidents keeps scans fast and avoids polluting the incidents table schema.

## Cost

All services used fall within AWS Free Tier limits for development usage. Run `terraform destroy` when not actively using the project to avoid charges.
