exports.handler = async (event, context) =&gt; {
    // Headers CORS más completos
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Manejar solicitudes OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        console.log('Processing POST request');
        console.log('Event body:', event.body);
        
        const requestBody = JSON.parse(event.body || '{}');
        let subscriptionId = requestBody.subscriptionId;
        
        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Subscription ID is required' })
            };
        }

        // Convertir ID numérico a formato GraphQL si es necesario
        if (!subscriptionId.startsWith('gid://')) {
            subscriptionId = `gid://shopify/SubscriptionContract/${subscriptionId}`;
        }

        console.log('Checking subscription ID:', subscriptionId);

        // Por ahora, simulamos la respuesta para probar CORS
        if (subscriptionId.includes('14994637052')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: true,
                    subscription: {
                        id: subscriptionId,
                        status: 'ACTIVE',
                        nextBillingDate: '2024-08-01T00:00:00Z',
                        createdAt: '2024-07-01T00:00:00Z'
                    }
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    message: 'ID de suscripción no encontrado'
                })
            };
        }

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};





