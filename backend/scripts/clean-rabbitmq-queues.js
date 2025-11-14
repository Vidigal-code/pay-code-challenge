const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function cleanQueues() {
    try {
        console.log('Connecting to RabbitMQ...');
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const queues = [
            'financial_events',
            'financial_events.dlq',
            'audit.logs',
            'audit.logs.dlq',
        ];

        for (const queue of queues) {
            try {
                await channel.deleteQueue(queue, { ifEmpty: false });
                console.log(`✓ Deleted queue: ${queue}`);
            } catch (error) {
                if (error.code === 404) {
                    console.log(`- Queue ${queue} does not exist`);
                } else {
                    console.error(`✗ Error deleting queue ${queue}:`, error.message);
                }
            }
        }

        await channel.close();
        await connection.close();
        console.log('\n✓ Queues cleaned. Restart the application to recreate them with correct configuration.');
    } catch (error) {
        console.error('Error cleaning queues:', error.message);
        process.exit(1);
    }
}

cleanQueues();

