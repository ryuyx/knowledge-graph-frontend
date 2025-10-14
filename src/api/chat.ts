import { createParser } from 'eventsource-parser';
import { v4 as uuidv4 } from 'uuid';

export const chat = async (message: string, onMessage: (data: string ) => void) => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: uuidv4(),
            query: message
        })
    });

    if (!response.body) {
        throw new Error('Response body is not available');
    }

    const parser = createParser({
        onEvent: (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        }
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
    }
}