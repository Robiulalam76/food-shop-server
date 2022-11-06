const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middle were
app.use(cors());
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.skccjvb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized Access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'unauthorized Access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {

        const foodCollection = client.db('foodShop').collection('foods');
        const shopCollection = client.db('foodShop').collection('shops');

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        app.get('/foods', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const query = {}
            const cursor = foodCollection.find(query);
            const foods = await cursor.skip(page * size).limit(size).toArray();
            const count = await foodCollection.estimatedDocumentCount()
            res.send({ count, foods })
        });

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const food = await foodCollection.findOne(query);
            res.send(food)
        })

        app.post('/shops', verifyJWT, async (req, res) => {
            const shop = req.body;
            const result = await shopCollection.insertOne(shop)
            console.log(shop);
            res.send(result)
        })

        app.get('/shops', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(401).send({ message: 'unauthorized access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            // console.log(query);
            const cursor = shopCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.delete('/shops/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await shopCollection.deleteOne(query);
            console.log(result);
            res.send(result)
        })

        app.delete('/shops', verifyJWT, async (req, res) => {
            const query = {};
            const result = await shopCollection.deleteMany(query)
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('food shop server is running')
});


app.listen(port, () => {
    console.log(`food server runnign is ${port}`);
})

