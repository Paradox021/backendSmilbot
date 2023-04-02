// model for card

import { Schema, model } from 'mongoose'

const cardSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        name: {type:String, required:true, trim:true},
        description: {type:String, required:true, trim:true},
        type: String,
        imageUrl: String
    },
    {
        timestamps:true,
        versionKey:false
    }
)

cardSchema.methods.setImgUrl = function setImgUrl(filename){
    const { HOST, PORT } = process.env
    this.imageUrl = `${HOST}:${PORT}/public/${filename}`
}

const Card = model('Card', cardSchema)



export { Card }