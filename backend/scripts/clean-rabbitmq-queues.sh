#!/bin/bash

echo "Cleaning RabbitMQ queues..."

RABBITMQ_URL="${RABBITMQ_URL:-amqp://guest:guest@localhost:5672}"

echo "Connecting to RabbitMQ at $RABBITMQ_URL"

# Delete queues if they exist
rabbitmqadmin -H localhost -u guest -p guest delete queue name=financial_events 2>/dev/null || echo "Queue financial_events not found or already deleted"
rabbitmqadmin -H localhost -u guest -p guest delete queue name=financial_events.dlq 2>/dev/null || echo "Queue financial_events.dlq not found or already deleted"
rabbitmqadmin -H localhost -u guest -p guest delete queue name=audit.logs 2>/dev/null || echo "Queue audit.logs not found or already deleted"
rabbitmqadmin -H localhost -u guest -p guest delete queue name=audit.logs.dlq 2>/dev/null || echo "Queue audit.logs.dlq not found or already deleted"

echo "Queues cleaned. Restart the application to recreate them with correct configuration."

