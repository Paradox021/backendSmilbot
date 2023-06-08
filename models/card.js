// model for card

import { Schema, model } from 'mongoose'
import * as dotenv from 'dotenv'

dotenv.config()

const cardSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        name: {type:String, required:true, trim:true, unique:true},
        description: {type:String, required:true, trim:true},
        type: String,
        imageUrl: String,
        author: String,
    },
    {
        timestamps:true,
        versionKey:false
    }
)

cardSchema.methods.setImgUrl = function setImgUrl(filename){
    const { PORT, IMAGE_HOST } = process.env
    console.log("host --- ",IMAGE_HOST)
    this.imageUrl = `${IMAGE_HOST}/public/${filename}`
}

const Card = model('Card', cardSchema)



export { Card }