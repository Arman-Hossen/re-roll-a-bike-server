const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const jwt = require('jsonwebtoken');

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


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
        const paymentsCollection = client.db("reRollaBike").collection("payments");


        

        app.get('/categories', async(req, res) =>{
            const query = {};
            const options = await allCategoriesCollection.find(query).toArray();
            res.send(options);
        })

        app.get('/category', async(req, res) =>{
            
            
          let query ={}
          if(req.query.title){
             query = {
              title: req.query.title
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
          const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '10d'})
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
    const decodedEmail = req.decoded?.email;
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
// add products
app.post('/addproduct', async(req, res) =>{
  const addProduct = req.body
  console.log(addProduct);
  const result = await singleCategoriesCollection.insertOne(addProduct);
  res.send(result);
})
  //
  app.put("/login", verifyJWT, async (req, res) => {
    
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
app.get('/allproduct', async(req, res) =>{
            
            
  let query ={}
  if(req.query.report){
    query = {
      report: req.query.report
       }
  

  }
  
  const cursor = singleCategoriesCollection.find(query);
  const result = await cursor.toArray();
  
  res.send(result);

});


// buyers data
app.get('/mydata', async(req, res) =>{
            
            
  let query ={}
   if(req.query.email){
      query = {
          email: req.query.email
         }

  }
  else if(req.query.advertise){
    query = {
      advertise: req.query.advertise
     }

  }
  const cursor = singleCategoriesCollection.find(query);
  const result = await cursor.toArray();
  
  res.send(result);

});

//delete seller product

app.delete('/deleteproduct/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)};

  const result = await singleCategoriesCollection.deleteOne(query);
  res.send(result);
})
//Delete user
app.delete('/deleteuser/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)};

  const result = await userCollection.deleteOne(query);
  res.send(result);
})


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
//advertise status
app.patch('/advertiseupdate/:id', async (req, res) => {
  const id = req.params.id;
  const advertise = req.body.advertise
  const query = { _id: ObjectId(id) }
  const updatedDoc = {
      $set:{
        advertise: advertise
      }
  }
  const result = await singleCategoriesCollection.updateOne(query, updatedDoc);
  res.send(result);
})
//report status
app.patch('/reportupdate/:id', async (req, res) => {
  const id = req.params.id;
  const report = req.body.report;
  const query = { _id: ObjectId(id) }
  const updatedDoc = {
      $set:{
        report: report
      }
  }
  const result = await singleCategoriesCollection.updateOne(query, updatedDoc);
  res.send(result);
})
// verify status
app.patch('/verifiedupdate/:id', async (req, res) => {
  const id = req.params.id;
  const verified = req.body.verified;
  const query = { _id: ObjectId(id) }
  const updatedDoc = {
      $set:{
        verified: verified
      }
  }
  const result = await userCollection.updateOne(query, updatedDoc);
  res.send(result);
})
app.patch('/verifiedcataupdate/:email', async (req, res) => {
  const email = req.params.email;
  const verified = req.body.verified;
  const query = { email: email }
  const updatedDoc = {
      $set:{
        verified: verified
      }
  }
  const result = await singleCategoriesCollection.updateMany(query, updatedDoc);
  res.send(result);
})




// payment
app.get("/bookings/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const booking = await bookingCollection.findOne(query);
  res.send(booking);
});

//

app.post("/create-payment-intent", async (req, res) => {
  const booking = req.body;
  const resale_price = booking.resale_price;
  const amount = resale_price * 100;

  const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      payment_method_types: ["card"],
  });
  res.send({
      clientSecret: paymentIntent.client_secret,
  });
});
//
app.post('/payments', async (req, res) =>{
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);
  const id = payment.bookingId
  const filter = {_id: ObjectId(id)}
  const updatedDoc = {
      $set: {
          paid: true,
          transactionId: payment.transactionId
      }
  }
  const updatedResult = await bookingCollection.updateOne(
      filter,
      updatedDoc
  );
  res.send(result);
})


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