import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});
const TOPIC = process.env.SNS_TOPIC_ARN;

const SERVICES = [
  "payment-service",
  "auth-service",
  "order-service",
  "inventory-service",
  "notification-service",
  "search-service",
];

const EVENT_TEMPLATES = [
  { type: "cpu_spike",          metric: "cpu_percent",       unit: "%",   range: [85, 99] },
  { type: "memory_leak",        metric: "memory_percent",    unit: "%",   range: [90, 99] },
  { type: "high_error_rate",    metric: "error_rate",        unit: "%",   range: [5, 45] },
  { type: "latency_spike",      metric: "p99_latency_ms",    unit: "ms",  range: [800, 5000] },
  { type: "health_check_fail",  metric: "consecutive_fails", unit: "",    range: [3, 10] },
  { type: "disk_usage_high",    metric: "disk_percent",      unit: "%",   range: [88, 98] },
  { type: "connection_pool_exhausted", metric: "active_connections", unit: "", range: [95, 100] },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function handler() {
  // generate 1-3 events per invocation
  const count = rand(1, 3);
  const events = [];

  for (let i = 0; i < count; i++) {
    const svc = pick(SERVICES);
    const tpl = pick(EVENT_TEMPLATES);
    const val = rand(tpl.range[0], tpl.range[1]);

    const event = {
      service: svc,
      eventType: tpl.type,
      metric: tpl.metric,
      value: val,
      unit: tpl.unit,
      timestamp: new Date().toISOString(),
      source: "simulator",
    };

    await sns.send(new PublishCommand({
      TopicArn: TOPIC,
      Message: JSON.stringify(event),
      MessageAttributes: {
        service: { DataType: "String", StringValue: svc },
        eventType: { DataType: "String", StringValue: tpl.type },
      },
    }));

    events.push(event);
  }

  console.log(`Published ${events.length} events`);
  return { statusCode: 200, body: `Published ${events.length} events` };
}