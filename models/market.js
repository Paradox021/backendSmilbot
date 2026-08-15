// model for market

import { Schema, model } from 'mongoose'

export const MARKET_OFFER_STATUSES = ['ACTIVE', 'SOLD', 'CANCELLED']

const offerSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        cardId: {type:Schema.ObjectId, ref:'Card'},
        price: {type:Number, required:true},
        seller: {type:Schema.ObjectId, ref:'User'},
        buyer: {type:Schema.ObjectId, ref:'User', required:false},
        buyerDiscordId: {type:String, default:null},
        soldPrice: {type:Number, default:null},
        soldAt: {type:Date, default:null},
        cancelledAt: {type:Date, default:null},
        status: {
            type: String,
            enum: MARKET_OFFER_STATUSES,
            default: 'ACTIVE'
        },
        active: {type:Boolean, default:true}
    },
    {
        timestamps:true,
        versionKey:false
    }
)

const marketSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        discordId: {type:String, required:true},
        offers: [offerSchema]
    },
    {
        timestamps:true,
        versionKey:false
    }
)

const Market = model('Market', marketSchema)

export { Market }