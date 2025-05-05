module.exports = (sequelize, DataTypes) => {
  const Email = sequelize.define('Email', {
    address: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'domains',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_updating_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'subscriptions',
          key: 'id'
        }
      }
  }, {
    tableName: 'emails',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });


  // Associations
  Email.associate = (models) => {
    Email.belongsTo(models.User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      onDelete: 'CASCADE'
    });

    Email.belongsTo(models.Subscription, {
      foreignKey: {
        name: 'subscription_id',
        allowNull: false
      }
    });

    Email.belongsTo(models.Domain, {
        foreignKey: {
          name: 'domain_id',
          allowNull: false
        }
      });
  };


  return Email;
};