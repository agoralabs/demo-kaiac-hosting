module.exports = (sequelize, DataTypes) => {
  const UserActivity = sequelize.define('UserActivity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target: {
      type: DataTypes.STRING,
      allowNull: true
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending'),
      defaultValue: 'success'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'user_activities',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['method']
      },
      {
        fields: ['path']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  UserActivity.associate = (models) => {
    UserActivity.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  };

  return UserActivity;
};