module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
      invoice_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: 'Le montant doit être un nombre décimal'
          },
          min: {
            args: [0.01],
            msg: 'Le montant doit être supérieur à 0'
          }
        }
      },
      status: {
        type: DataTypes.ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'draft'
      },
      issued_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      pdf_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      currency: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'EUR'
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      payment_terms: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      billing_address: {
        type: DataTypes.JSON
      }
    }, {
      tableName: 'invoices',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeValidate: (invoice) => {
          if (!invoice.invoice_number) {
            invoice.invoice_number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
          if (!invoice.due_date) {
            const issuedDate = invoice.issued_at || new Date();
            invoice.due_date = new Date(issuedDate.setDate(issuedDate.getDate() + 30));
          }
        }
      }
    });
  
    Invoice.associate = (models) => {
      Invoice.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE'
      });
      
      Invoice.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        onDelete: 'SET NULL'
      });
      
      Invoice.belongsTo(models.Subscription, {
        foreignKey: 'subscription_id',
        onDelete: 'SET NULL'
      });
    };
  
    // Méthode d'instance
    Invoice.prototype.markAsPaid = async function(paymentId) {
      return this.update({
        status: 'paid',
        payment_id: paymentId
      });
    };
  
    // Méthode statique
    Invoice.generateInvoiceNumber = async function() {
      const lastInvoice = await this.findOne({
        order: [['created_at', 'DESC']],
        attributes: ['invoice_number']
      });
      
      if (!lastInvoice) return `INV-00001`;
      
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
      return `INV-${String(lastNumber + 1).padStart(5, '0')}`;
    };
  
    return Invoice;
  };