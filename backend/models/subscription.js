module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('Subscription', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      start_date: {
        type: DataTypes.DATEONLY
      },
      end_date: {
        type: DataTypes.DATEONLY
      },
      activated_at: {
        type: DataTypes.DATE,
        comment: 'Date of first successful payment'
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'cancelled', 'pending'),
        defaultValue: 'pending'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'EUR'
      },
      billing_cycle: {
        type: DataTypes.ENUM('monthly', 'annual'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      preferred_payment_method: {
        type: DataTypes.STRING(50)
      },
      billing_address: {
        type: DataTypes.JSON
      },
      next_payment_date: {
        type: DataTypes.DATEONLY
      },
      duration_months: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in months (12 for annual)'
      }
    }, {
      tableName: 'subscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeValidate: (subscription, options) => {
  
          if (!subscription.reference) {
            subscription.reference = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
  
        },
        beforeCreate: async (subscription) => {
          // Validation que le user_id est présent
          if (!subscription.user_id) {
            throw new Error('User ID is required for subscription creation');
          }
  
          // Vérification que l'utilisateur existe
          const user = await sequelize.models.User.findByPk(subscription.user_id);
          if (!user) {
            throw new Error('The specified user does not exist');
          }
  
          // Validation du montant
          if (subscription.amount <= 0) {
            throw new Error('subscription amount must be greater than 0');
          }
  
          if (!subscription.user_id) {
            throw new Error('User ID is required for subscription creation');
          }
        },
        beforeUpdate: (subscription, options) => {
          // Empêcher la modification du user_id après création
          if (subscription.changed('user_id')) {
            throw new Error('You cannot change the user once set');
          }
  
          // Validation supplémentaire lors du passage à 'completed'
          if (subscription.status === 'completed' && subscription.previous('status') !== 'completed') {
            if (!subscription.billing_address) {
              throw new Error('A billing address is required to complete the subscription');
            }
          }
        }
      }
    });
  
    Subscription.associate = (models) => {
      Subscription.belongsTo(models.User, { foreignKey: 'user_id' });
      Subscription.belongsTo(models.Plan, { foreignKey: 'plan_id' });
      Subscription.hasMany(models.Payment, { foreignKey: 'subscription_id' });
      Subscription.hasMany(models.Website, { foreignKey: 'subscription_id' });
      Subscription.hasMany(models.Invoice, { foreignKey: 'subscription_id' });
      Subscription.hasMany(models.SubscriptionHistory, { foreignKey: 'subscription_id' });
    };
  
      /*
    Subscription.afterUpdate(async (subscription, options) => {
      const { SubscriptionHistory } = sequelize.models;
      if (!SubscriptionHistory.recordEvent) {
        throw new Error('recordEvent method not found on SubscriptionHistory');
      }
        if (subscription.changed('plan_id')) {
          await SubscriptionHistory.recordEvent(
            subscription.id,
            subscription.previous('plan_id') < subscription.plan_id ? 'upgrade' : 'downgrade',
            {
              oldPlanId: subscription.previous('plan_id'),
              newPlanId: subscription.plan_id,
              adminId: options.adminId || null,
              changedBy: options.adminId ? 'admin' : 'user',
              ipAddress: options.ipAddress
            }
          );
        }
        
        if (subscription.changed('status')) {
          let eventType;
          switch(subscription.status) {
            case 'cancelled': eventType = 'cancellation'; break;
            case 'suspended': eventType = 'suspension'; break;
            case 'active': 
              eventType = subscription.previous('status') === 'suspended' ? 'reactivation' : 'renewal';
              break;
          }
          
          if (eventType) {
            await SubscriptionHistory.recordEvent(
              subscription.id,
              eventType,
              {
                adminId: options.adminId,
                changedBy: options.adminId ? 'admin' : 'user',
                ipAddress: options.ipAddress
              }
            );
          }
        }
      });
      */
    return Subscription;
  };