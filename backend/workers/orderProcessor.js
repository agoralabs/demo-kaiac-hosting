const { Order } = require('../models');

async function processOrders() {
  try {
    // Find pending orders
    const pendingOrders = await Order.findAll({
      where: {
        status: 'paid',
        processed: false
      }
    });

    for (const order of pendingOrders) {
      try {
        // Process WordPress site creation
        await createWordPressSite(order);
        
        // Update order status
        await order.update({
          status: 'completed',
          processed: true
        });
        
        console.log(`Order ${order.id} processed successfully`);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        await order.update({
          status: 'failed',
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error('Error in order processing worker:', error);
  }
}

async function createWordPressSite(order) {
  // Implementation for WordPress site creation
  // This would involve setting up the hosting environment,
  // installing WordPress, and configuring based on the plan
}

// Run the processor every 5 minutes
setInterval(processOrders, 5 * 60 * 1000);

// Initial run
processOrders();