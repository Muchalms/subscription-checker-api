const fetch = require('node-fetch');

exports.handler = async (event, context) =&gt; {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const requestBody = JSON.parse(event.body || '{}');
        const subscriptionId = requestBody.subscriptionId;
        
        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Subscription ID is required' })
            };
        }

        console.log('Checking subscription ID:', subscriptionId);
        
        // Consultar Shopify para verificar la suscripción
        const shopifyResponse = await fetch('https://entredementes.myshopify.com/admin/api/2024-01/graphql.json', {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': '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',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                    query ($subscriptionId: ID!) {
                        subscriptionContract(id: $subscriptionId) {
                            id
                            status
                            nextBillingDate
                            createdAt
                            lines(first: 5) {
                                nodes {
                                    title
                                    quantity
                                    currentPrice {
                                        amount
                                        currencyCode
                                    }
                                }
                            }
                            customer {
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                `,
                variables: {
                    subscriptionId: subscriptionId
                }
            })
        });

        if (!shopifyResponse.ok) {
            throw new Error('Shopify API error: ' + shopifyResponse.status);
        }

        const data = await shopifyResponse.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        const subscription = data.data.subscriptionContract;
        
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

        // Verificar si la suscripción está activa
        const isActive = subscription.status === 'ACTIVE';
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: isActive,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    nextBillingDate: subscription.nextBillingDate,
                    createdAt: subscription.createdAt,
                    customer: subscription.customer,
                    lines: subscription.lines.nodes
                }
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



