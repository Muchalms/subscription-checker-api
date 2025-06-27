exports.handler = async (event, context) =&gt; {
    // Enable CORS for all origins
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
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
        const { email } = JSON.parse(event.body);
        
        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        console.log('Checking subscription for:', email);
        
        const response = await fetch('https://entredementes.myshopify.com/admin/api/2024-01/graphql.json', {
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
                    email: `email:${email}`,
                    first: 1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Shopify API error: ${response.status}`);
        }

        const data = await response.json();
        
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
