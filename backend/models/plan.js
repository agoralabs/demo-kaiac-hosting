module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    features: {
      type: DataTypes.JSON
    },
    price_1_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_12_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_24_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_60_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_120_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    plan_type: {
      type: DataTypes.ENUM('hosting', 'domain', 'email'),
      allowNull: false
    },
    included_emails: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    included_domains: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    included_sites: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    included_storage_mb: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    monthly_billing_cycle: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    annual_billing_cycle: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, 
  {
    tableName: 'plans'
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.Subscription, { foreignKey: 'plan_id' });
  };

  return Plan;
};