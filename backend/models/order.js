module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stripePaymentId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['stripePaymentId']
      },
      {
        fields: ['userId']
      }
    ],
    hooks: {
      beforeValidate: (order) => {
        if (order.amount <= 0) {
          throw new Error('Order amount must be greater than 0');
        }
      },
      beforeCreate: async (order) => {
        if (!order.userId) {
          throw new Error('User ID is required for order creation');
        }
      }
    }
  });

  return Order;
};