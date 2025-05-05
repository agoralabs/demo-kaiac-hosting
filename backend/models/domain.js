// models/Domain.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Domain = sequelize.define('Domain', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    domain_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    yearly_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    category: {
      type: DataTypes.ENUM('buyed', 'declared'),
      allowNull: false,
      defaultValue: 'buyed'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_emails_domain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_route53_domain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_updating_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'domains',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (domain) => {
        // Calculer la date d'expiration
        // Convertit en nombre et vérifie si c'est >= 1
        const duration = Number(domain.duration);
        // if (!isNaN(duration) && duration >= 1) {
        //     const expiresAt = new Date();
        //     expiresAt.setFullYear(expiresAt.getFullYear() + Math.floor(duration));
        //     domain.expires_at = expiresAt;
        // }
      }
    }
  });

  Domain.associate = (models) => {
    Domain.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Domain.hasMany(models.Website, {
      foreignKey: 'domain_id',
      as: 'websites'
    });
  };

  return Domain;
};