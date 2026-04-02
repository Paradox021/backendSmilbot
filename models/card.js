// model for card

import { Schema, model } from 'mongoose'

const cardSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        name: {type:String, required:true, trim:true, unique:true},
        description: {type:String, required:true, trim:true},
        type: {type:Number, required:true}, // 0 for common, 1 for rare, 2 for epic, 3 for legendary and 4 for mythic
        imageUrl: String,
        imagePublicId: String, // Provider-specific ID used for deletion
        author: String,
    },
    {
        timestamps:true,
        versionKey:false
    }
)

const Card = model('Card', cardSchema)

export { Card }