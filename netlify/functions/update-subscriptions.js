const fs = require('fs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Topic, X-Shopify-Hmac-Sha256',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const subscriptionData = JSON.parse(event.body);
        
        console.log('Subscription update received:', JSON.stringify(subscriptionData, null, 2));
        
        // Extraer datos importantes
        const subscriptionUpdate = {
            id: subscriptionData.subscriptionId,
            customer: subscriptionData.customerName,
            email: subscriptionData.customerEmail,
            status: subscriptionData.status,
            nextBillingDate: subscriptionData.nextBillingDate,
            createdAt: subscriptionData.createdAt,
            plan: subscriptionData.plan || 'Membresía Premium',
            lastUpdated: new Date().toISOString()
        };
        
        // En un entorno real, aquí guardarías en una base de datos
        // Por ahora, vamos a usar variables de entorno o un archivo JSON
        
        // Log para debugging
        console.log('Processed subscription:', subscriptionUpdate);
        
        // Simular actualización exitosa
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Subscription updated successfully',
                subscription: subscriptionUpdate
            })
        };
        
    } catch (error) {
        console.error('Error processing subscription update:', error);
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
