const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const port = process.env.PORT || 4500;
require("dotenv").config();

//Middleware
app.use(cors(
    {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
    }
));
app.use(express.json());
app.use(cookieParser());

//carDoctor
//haPdUBeSU0LJ4fhm


//Middleware
// const logger = async (req, res, next) => {
//     console.log('called:', req.host, req.originalUrl);
//     next();
// }
//Verify
// const verifyToken = async (req, res, next) => {
//     const token = req.cookies?.token;
//     console.log('value of token in middleware', token);
//     if (!token) {
//         return res.status(401).send({ message: "not recognized" })
//     }
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//         //error
//         if (err) {
//             console.log(err)
//             return res.status(401).send({ message: "Unauthorized" })
//         }
//         //if token is valid then it would be decoded
//         console.log('value in the token', decoded);
//         req.user = decoded;
//         next();
//     })

// }
// const verifyToken = async (req, res, next) => {
//     const token = req.cookies.token;
//     if (!token) {
//         return res.status(401).send({ message: "Unauthorized access" });
//     }
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(401).send({ message: "Unauthorized access" });
//         }
//         req.user = decoded;
//         next();
//     })
// }

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1qcsvas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookedService');

        // Auth REleted api
        // app.post('/jwt', logger, async (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        //     res
        //         .cookie('token', token, {
        //             httpOnly: true,
        //             secure: false, //http://localhost:5173/login
        //             // sameSite: 'none'
        //         })
        //         .send({ success: true });
        // })

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("user for token", user);
            const token = jwt.sign(user, 'secret', { expiresIn: '1hr' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'

            })
            res.send({ token })
        })


        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log("logging out", user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        //services releted api     
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })


        ///Booking-=======
        app.get("/bookings", async (req, res) => {
            console.log(req.query.email)  //consolling users email on server terminal
            // console.log("toooken", req.cookies.token);
            console.log("from in the valid token", req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: "Forbidden access" })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            console.log(query)
            const result = await bookingCollection.find().toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking)
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })


        //Update
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking)
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        //delete 
        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Doctor server is Running");
})


app.listen(port, () => {
    console.log(`Car Doctor Server is Running on PORT:  ${port}`);
})