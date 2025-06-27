document.addEventListener('DOMContentLoaded', function() {
    // Replace with your actual Netlify function URL
    const API_ENDPOINT = 'https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/check-subscription';

    const form = document.getElementById('subscriptionForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('customerEmail').value.trim();
        console.log('Checking email:', email);
        await checkSubscriptionStatus(email);
    });

    async function checkSubscriptionStatus(email) {
        const checkBtn = document.getElementById('checkBtn');
        
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<span class="spinner"></span>Checking...';
        
        showResult({
            loading: true,
            message: 'Looking up your subscription status...'
        });

        try {
            console.log('Making API call to:', API_ENDPOINT);
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const customers = data.data.customers.nodes;
            
            if (customers.length === 0) {
                showResult({
                    valid: false,
                    message: 'No account found with this email address. Please check your email or contact support.'
                });
                return;
            }

            const customer = customers[0];
            const analysis = analyzeSubscriptionStatus(customer);
            
            showResult({
                valid: analysis.hasActiveSubscription,
                customer: customer,
                analysis: analysis
            });

        } catch (error) {
            console.error('Validation error:', error);
            showResult({
                valid: false,
                message: 'Unable to check subscription status. Please try again later.',
                error: error.message
            });
        } finally {
            checkBtn.disabled = false;
            checkBtn.innerHTML = 'Check My Subscription Status';
        }
    }

    function analyzeSubscriptionStatus(customer) {
        const orders = customer.orders.nodes;
        const subscriptionKeywords = ['subscription', 'membership', 'monthly', 'recurring', 'plan'];
        
        let hasActiveSubscription = false;
        let subscriptionProducts = [];
        let totalOrders = orders.length;

        orders.forEach(function(order) {
            const orderDate = new Date(order.createdAt);
            const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
            
            order.lineItems.nodes.forEach(function(item) {
                const productTitle = item.variant?.product?.title || item.title;
                const productTags = item.variant?.product?.tags || [];
                
                const isSubscriptionProduct = 
                    subscriptionKeywords.some(function(keyword) {
                        return productTitle.toLowerCase().includes(keyword) ||
                               productTags.some(function(tag) {
                                   return tag.toLowerCase().includes(keyword);
                               });
                    });
                
                if (isSubscriptionProduct &amp;&amp; order.financialStatus === 'paid') {
                    subscriptionProducts.push({
                        title: productTitle,
                        orderDate: orderDate,
                        daysSinceOrder: Math.floor(daysSinceOrder)
                    });
                    
                    if (daysSinceOrder &lt;= 35) {
                        hasActiveSubscription = true;
                    }
                }
            });
        });

        return {
            hasActiveSubscription: hasActiveSubscription || totalOrders &gt; 0, // For testing, consider any customer with orders as active
            subscriptionProducts: subscriptionProducts,
            totalOrders: totalOrders,
            customerSince: new Date(customer.createdAt).toLocaleDateString()
        };
    }

    function showResult(result) {
        const resultDiv = document.getElementById('result');
        if (!resultDiv) return;
        
        resultDiv.style.display = 'block';
        
        if (result.loading) {
            resultDiv.className = 'result loading';
            resultDiv.innerHTML = '<h3><span class="spinner"></span>Checking...</h3><p>' + result.message + '</p>';
            return;
        }
        
        if (result.valid) {
            resultDiv.className = 'result valid';
            resultDiv.innerHTML = '<h3>✅ Active Customer</h3><div class="result-details"><p><strong>Welcome, ' + result.customer.firstName + ' ' + result.customer.lastName + '!</strong></p><p><strong>Email:</strong> ' + result.customer.email + '</p><p><strong>Total Orders:</strong> ' + result.analysis.totalOrders + '</p><p><strong>Customer Since:</strong> ' + result.analysis.customerSince + '</p><p><strong>Status:</strong> Active Customer</p></div>';
        } else {
            resultDiv.className = 'result invalid';
            resultDiv.innerHTML = '<h3>❌ No Active Subscription</h3><div class="result-details"><p>' + result.message + '</p>' + (result.error ? '<p><small>Error: ' + result.error + '</small></p>' : '') + '</div>';
        }
    }
});
