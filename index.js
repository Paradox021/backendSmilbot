import express from 'express'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import morgan from 'morgan'
import cors from 'cors'
import cardRouter from './routers/cardRouter.js'
import userRouter from './routers/userRouter.js'
import marketRouter from './routers/marketRouter.js'
import path from 'path'

const __dirname = path.resolve()

dotenv.config()
const app = express()
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))

app.get('/', (req, res) => {
    res.status(200).send('Bienvenido al API de Smilbot')
})



app.use('/public', express.static(`${__dirname}/storage/images`))
app.use('/card', cardRouter)
app.use('/user', userRouter)
app.use('/market', marketRouter)


async function main(){
    mongoose.set('strictQuery', true)
    await mongoose.connect(process.env.URL_DB);
    await app.listen(process.env.PORT)
    console.log('Servidor y base de datos encencidos')
}
main().catch(error => 
    console.error('Fallo al arrancar el servidor'+error)
)