const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            default: 'admin',
        },
        action: {
            type: String,
            required: true,
        },
        resource: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            default: '',
        },
        ipAddress: {
            type: String,
            default: '127.0.0.1',
        },
        status: {
            type: String,
            enum: ['Success', 'Warning', 'Denied'],
            default: 'Success',
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
