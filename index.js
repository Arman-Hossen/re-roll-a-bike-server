const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oexodue.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
  console.log("token inside verifyJWT", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if(!authHeader){
      return res.status(401).send('unauthorized access');
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
      if(err){
      return res.status(403).send({message: 'forbidden access'})
      }
      req.decoded = decoded;
      next();
  })

}

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
     app.get('/jwt', async(req, res) =>{
      const email = req.query.email;
      const query = {email:email};
      const user = await userCollection.findOne(query);
      if(user){
          const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
          return res.send({accessToken: token});
      }
      res.status(403).send({accessToken: ''})
      
  })

     //
     app.post('/bookingbike', async(req, res) =>{
      const bookingBike = req.body
      console.log(bookingBike);
      const result = await bookingCollection.insertOne(bookingBike);
      res.send(result);
  })

  //booking get
  app.get('/bookingbike', verifyJWT, async(req, res) =>{
    const email = req.query.email;
    const decodedEmail = req.decoded.email;
    if(email!== decodedEmail){
      return res.status(403).send({message:'forbidden access'});
    }
    const query = {email:email};
    const result = await bookingCollection.find(query).toArray();
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

  //
  app.get('/allrole', async(req, res) =>{
            
            
    let query ={}
    if(req.query.role){
       query = {
        role: req.query.role
       }
    }
    else if(req.query.email){
        query = {
            email: req.query.email
           }

    }
    const cursor = userCollection.find(query);
    const result = await cursor.toArray();
    
    res.send(result);

});

//


//admin
app.get('/users/admin/:email', async(req, res) =>{
  const email = req.params.email;
  const query = { email }
  const user = await userCollection.findOne(query);
  res.send({admin: user?.role === 'admin'})
});

//seller
app.get('/users/seller/:email', async(req, res) =>{
  const email = req.params.email;
  const query = { email }
  const user = await userCollection.findOne(query);
  res.send({seller: user?.role === 'Seller'})
});

//

app.put("/allrole/admin/:id", verifyJWT, async (req, res) => {
  const decodedEmail = req.decoded?.email;
  const query = { email: decodedEmail };
  const user = await userCollection.findOne(query);
  if (user?.role !== "admin") {
      return res
          .status(403)
          .send({ message: "forbidden access" });
  }
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
      $set: {
          role: "admin",
      },
  };
  const result = await userCollection.updateOne(
      filter,
      updatedDoc,
      options
  );
  res.send(result);
});


// app.put('/users/admin:id', async(req, res) =>{
//   const id = req.params.id;
//   const filter = {_id: ObjectId(id) }
//   const options = {upsert: true};

//   updatedDoc = {
//     $set : {
//       role: 'admin'
//     }
//   }
//   const result = await userCollection.updateOne(filter, updatedDoc, options);
//   res.send(result);
// })
// app.put("/allrole/admin/:id", async(req, res) => {
//   const id = req.params.id
//   const filter = {_id: ObjectId(id)}
//   const options = { upsert: true }
//   const updatedDoc = {
//       $set: {
//           role: 'admin'
//       }
//   }
//   const result = await userCollection.updateOne(filter, updatedDoc, options)
//   res.send(result)
// });

  //role
  app.get('/roll/:email',async(req, res) =>{
    const email = req.params.email;
    const query ={email: email}
    const service = await userCollection.findOne(query);
    res.send(service);
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