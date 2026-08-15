// model for individual market offers
import { Schema, model } from 'mongoose'

export const MARKET_OFFER_STATUSES = ['ACTIVE', 'SOLD', 'CANCELLED']

const marketOfferSchema = new Schema(
    {
        _id: { type: Schema.ObjectId, auto: true },
        serverId: { type: String, required: true, trim: true, index: true },
        seller: { type: Schema.ObjectId, ref: 'User', required: true, index: true },
        sellerDiscordId: { type: String, default: null, trim: true },
        cardId: { type: Schema.ObjectId, ref: 'Card', required: true },
        price: { type: Number, required: true },
        status: {
            type: String,
            enum: MARKET_OFFER_STATUSES,
            default: 'ACTIVE',
            index: true
        },
        buyer: { type: Schema.ObjectId, ref: 'User', default: null, index: true },
        buyerDiscordId: { type: String, default: null, trim: true },
        soldPrice: { type: Number, default: null },
        soldAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        active: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

marketOfferSchema.index({ serverId: 1, status: 1, createdAt: -1 })
marketOfferSchema.index({ seller: 1, status: 1 })
marketOfferSchema.index({ buyer: 1, status: 1 })

const MarketOffer = model('MarketOffer', marketOfferSchema, 'market_offers')

export { MarketOffer }
