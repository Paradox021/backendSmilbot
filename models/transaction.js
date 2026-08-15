import { Schema, model } from 'mongoose'

export const TRANSACTION_TYPES = [
    'DAILY_CLAIM',
    'CARD_BUY',
    'MARKET_BUY',
    'MARKET_SELL',
    'TRADE',
    'ADMIN_ADJUST'
]

const transactionSchema = new Schema(
    {
        _id: { type: Schema.ObjectId, auto: true },
        discordId: { type: String, required: true, trim: true, index: true },
        type: {
            type: String,
            required: true,
            enum: TRANSACTION_TYPES
        },
        amount: { type: Number, required: true },
        balanceBefore: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

transactionSchema.index({ discordId: 1, createdAt: -1 })
transactionSchema.index({ type: 1 })

const Transaction = model('Transaction', transactionSchema)

export { Transaction }
