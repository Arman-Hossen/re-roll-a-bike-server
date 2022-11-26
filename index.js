const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oexodue.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        const allCategoriesCollection = client.db('reRollaBike').collection('catagories');
        const singleCategoriesCollection = client.db('reRollaBike').collection('singlecategory');
        const bookingCollection = client.db('reRollaBike').collection('bookingsBike');
        const userCollection = client.db('reRollaBike').collection('userTable');

        app.get('/categories', async(req, res) =>{
            const query = {};
            const options = await allCategoriesCollection.find(query).toArray();
            res.send(options);
        })

        app.get('/category', async(req, res) =>{
            
            
          let query ={}
          if(req.query.service_id){
             query = {
              service_id: req.query.service_id
             }
          }
          
          const cursor = singleCategoriesCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);

     });

     //
     app.post('/bookingbike', async(req, res) =>{
      const bookingBike = req.body
      console.log(bookingBike);
      const result = await bookingCollection.insertOne(bookingBike);
      res.send(result);
  })
  app.post('/signup', async(req, res) =>{
    const addUser = req.body
    console.log(addUser);
    const result = await userCollection.insertOne(addUser);
    res.send(result);
})
  //
  app.put("/login", async (req, res) => {
    
    const user = req.body;
    const filter = { email: user.email }

    const option = { upsert: true };
    const updateUser = {
      $set:{
          name: user.name,
          email: user.email,
          role: user.role
      }
    }
    const result = await userCollection.updateOne(filter, updateUser, option)

    res.send(result);
  });

    }
    finally{

    }
}
run().catch(console.log)

app.get('/', (req, res) => {
  res.send('Wellcome to reRollaBike')
})

app.listen(port, () => {
  console.log(`rerollabike run on port ${port}`)
})