const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers, 
            body: '' 
        };
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
        const email = requestBody.email;
        
        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        console.log('Checking subscription for:', email);
        
        const shopifyResponse = await fetch('https://entredementes.myshopify.com/admin/api/2024-01/graphql.json', {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': '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',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                    query ($email: String!, $first: Int!) {
                        customers(first: $first, query: $email) {
                            nodes {
                                id
                                email
                                firstName
                                lastName
                                createdAt
                                orders(first: 20) {
                                    nodes {
                                        id
                                        name
                                        createdAt
                                        totalPrice
                                        financialStatus
                                        lineItems(first: 10) {
                                            nodes {
                                                title
                                                quantity
                                                variant {
                                                    product {
                                                        title
                                                        tags
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    email: 'email:' + email,
                    first: 1
                }
            })
        });

        if (!shopifyResponse.ok) {
            throw new Error('Shopify API error: ' + shopifyResponse.status);
        }

        const data = await shopifyResponse.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
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

