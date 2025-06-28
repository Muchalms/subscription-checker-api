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
        
        // Obtener datos de Google Sheets
        const validSubscriptions = await getSubscriptionsFromGoogleSheets();
        
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

async function getSubscriptionsFromGoogleSheets() {
    try {
        // REEMPLAZA 'TU_SHEET_ID' con el ID real de tu Google Sheet
        const SHEET_ID = '1yMvXG2uEs_6V_nSYRCDZV9WcdRRynkNTr5Qb-AK-Buw';
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
        
        console.log('Fetching from Google Sheets:', SHEET_URL);
        
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        console.log('CSV Data received:', csvData.substring(0, 200) + '...');
        
        const subscriptions = {};
        const lines = csvData.split('\n');
        
        // Procesar cada línea (saltando el header)
        for (let i = 1; i &lt; lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Dividir por comas, pero manejar comillas
            const columns = parseCSVLine(line);
            
            if (columns.length &gt;= 4) {
                const [id, name, email, status, nextBilling, createdAt, plan] = columns;
                
                if (id &amp;&amp; id !== 'subscription_id') {
                    subscriptions[id] = {
                        id: id,
                        customer: name || 'Cliente',
                        email: email || '',
                        status: status || 'ACTIVE',
                        nextBillingDate: nextBilling || '',
                        createdAt: createdAt || '',
                        plan: plan || 'Membresía Premium'
                    };
                }
            }
        }
        
        console.log('Processed subscriptions:', Object.keys(subscriptions));
        return subscriptions;
        
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        
        // Fallback a datos estáticos si Google Sheets falla
        return {
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
    }
}

// Función auxiliar para parsear líneas CSV
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i &lt; line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' &amp;&amp; !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}







