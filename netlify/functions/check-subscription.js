exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { subscriptionId } = JSON.parse(event.body || '{}');
        
        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Subscription ID is required' })
            };
        }

        console.log('Checking subscription ID:', subscriptionId);
        
        // Base de datos base (se actualizará con Flow)
        const baseSubscriptions = {
            '14994637052': {
                id: '14994637052',
                status: 'ACTIVE',
                customer: 'Luis Rivero',
                email: 'muchalmanomada@gmail.com',
                nextBillingDate: '2024-08-27',
                createdAt: '2024-06-27',
                plan: 'Membresía Premium'
            }
        };
        
        // En el futuro, aquí leerías de una base de datos real
        // que se actualiza con los webhooks de Flow
        const validSubscriptions = await getValidSubscriptions(baseSubscriptions);
        
        const subscription = validSubscriptions[subscriptionId];
        
        if (!subscription) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    message: 'ID de suscripción no encontrado'
                })
            };
        }

        const isActive = subscription.status === 'ACTIVE';
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: isActive,
                subscription: subscription
            })
        };
        
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

// Función para obtener suscripciones válidas
async function getValidSubscriptions(baseSubscriptions) {
    // Por ahora retorna las base
    // En el futuro, aquí consultarías una base de datos
    // que se actualiza con los webhooks
    
    return baseSubscriptions;
}






