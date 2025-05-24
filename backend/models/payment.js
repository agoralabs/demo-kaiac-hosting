module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
      payment_reference: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR'
      },
      method: {
        type: DataTypes.ENUM('card', 'bank_transfer', 'paypal', 'stripe', 'wave', 'mobile_money', 'other'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled', 'requires_payment_method'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_data: {
        type: DataTypes.JSON
      },
      billing_address: {
        type: DataTypes.JSON
      },
      payment_type: {
        type: DataTypes.ENUM('initial', 'recurring', 'renewal', 'other'),
        allowNull: false
      },
      stripe_payment_id: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      stripe_payment_client_secret: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      wave_checkout_id: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      session_id: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      tableName: 'payments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['session_id']
        },
        {
          fields: ['wave_checkout_id']
        },
        {
          fields: ['status']
        }
      ]
    });
  
    Payment.associate = (models) => {
      Payment.belongsTo(models.User, { foreignKey: 'user_id' });
      Payment.belongsTo(models.Subscription, { foreignKey: 'subscription_id' });
      Payment.hasOne(models.Invoice, { foreignKey: 'payment_id' });
    };
  
    return Payment;
  };
