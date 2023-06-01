// model for our discord user (not the bot)


import { Schema, model } from 'mongoose'

const userSchema = new Schema(
    {
        _id: {type:Schema.ObjectId, auto:true},
        discordId: {type:String, required:true, trim:true, unique:true},
        username: {type:String, required:true, trim:true},
        balance: {type:Number, default:0},
        cards: [{type:Schema.ObjectId, ref:'Card'}],
        lastTimeCommand: {type:Date, default:Date.now() - 1000 * 60 * 60 * 24}
    },
    {
        timestamps:true,
        versionKey:false
    }
)


userSchema.methods.canUseCommand = function canUseCommand(){
    const now = Date.now()
    const lastTimeCommand = this.lastTimeCommand
    const diff = now - lastTimeCommand
    const hours = diff / 1000 / 60 / 60
    return hours >= 23
}
// devuelve las horas y minutos para poder usar el comando
userSchema.methods.getTimeToUseCommand = function getTimeToUseCommand(){
    const now = Date.now()
    const lastTimeCommand = this.lastTimeCommand
    const diff = now - lastTimeCommand
    const hours = Math.floor(diff / 1000 / 60 / 60)
    const minutes = Math.floor((diff - hours * 1000 * 60 * 60) / 1000 / 60)
    return { hours, minutes }
}

userSchema.methods.updateLastTimeCommand = function updateLastTimeCommand(){
    this.lastTimeCommand = Date.now()
}

const User = model('User', userSchema)

export { User }