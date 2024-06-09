const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const upazillas = require("./upazillas.json")
const districts = require("./districts.json")
// middlewares
app.use(cors());
app.use(express.json());

// MONGO DB

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivnezkj.mongodb.net/?retryWrites=true&w=majority`;
const uri = "mongodb+srv://user:123@cluster0.achcrxa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {


    // await client.connect();
    // console.log("db connected")

    const usersCollection = client.db("bloodBD").collection("users");
    const donationRequestCollection = client
      .db("bloodBD")
      .collection("donationRequest");
    const blogsCollection = client.db("bloodBD").collection("blogs");


    // JWT related api ---------------------------------------------------------
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, "Secret", {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares--------------------------------------------------------------
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token,"Secret", (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.get("/all-users", verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/search", async (req, res) => {
      const { bloodGroup, district, upazila } = req.query;
      try {
        const result = await usersCollection
          .find({
            bloodGroup,
            district,
            upazila,
          })
          .toArray();
        res.send(result);
      } catch (error) { }
    });
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    
    
    app.patch("/blocked-user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "blocked",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
 
    
    app.patch("/active-user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "active",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
   
    
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    
    app.patch("/users/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "volunteer",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      try {
        const usersData = req.body;
        const result = await usersCollection.insertOne(usersData);
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    app.patch("/users", async (req, res) => {
      const email = req.query.email;
      const updatedUser = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
          bloodGroup: updatedUser.bloodGroup,
          photo: updatedUser.photo,
          upazila: updatedUser.upazila,
          district: updatedUser.district,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //   get upazila and district data----------------------------------------------
    app.get("/upazilas", async (req, res) => {
      res.send(upazillas);
    });
    app.get("/districts", async (req, res) => {
      res.send(districts);
    });


    
    
    app.get("/all-donation-request", async (req, res) => {
      const result = await donationRequestCollection.find().toArray();
      res.send(result);
    });

    app.get("/pending-donation-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestCollection.findOne(query);
      res.send(result);
    });

    app.get("/pending-request", async (req, res) => {
      const query = { donationStatus: "pending" };
      const result = await donationRequestCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/my-donation-request", async (req, res) => {
      try {
        const email = req.query.email;

        const query = { requesterEmail: email };
        const result = await donationRequestCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.post("/create-donation-request", async (req, res) => {
      try {
        const donationRequest = req.body;
        const result = await donationRequestCollection.insertOne(
          donationRequest
        );
        res.send(result);
      } catch (error) {
        console.log(error);
        res.send(error);
      }
    });
    app.get("/donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestCollection.findOne(query);
      res.send(result);
    });
    app.put("/update-donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          recipientName: item.recipientName,
          bloodGroup: item.bloodGroup,
          recipientDistrict: item.recipientDistrict,
          recipientUpazila: item.recipientUpazila,
          hospitalName: item.hospitalName,
          fullAddress: item.fullAddress,
          donationDate: item.donationDate,
          donationTime: item.donationTime,
          requestMessage: item.requestMessage,
        },
      };
      const result = await donationRequestCollection.updateOne(
        filter,
        updatedDoc
        // options
      );

      res.send(result);
    });
    // handle donate
    app.put("/handle-donate/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          donorName: item.donorName,
          donorEmail: item.donorEmail,
          donationStatus: item.donationStatus,
        },
      };
      const result = await donationRequestCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });
    app.delete("/donation-data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestCollection.deleteOne(query);
      res.send(result);
    });

    // status done
    app.patch("/donation/done/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          donationStatus: "done",
        },
      };
      const result = await donationRequestCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
    // status canceled
    app.patch("/donation/canceled/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          donationStatus: "canceled",
        },
      };
      const result = await donationRequestCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    // blogs data
    app.get("/all-blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });
    app.get("/published-blogs", async (req, res) => {
      const query = { status: "published" };
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/all-blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/blogs", async (req, res) => {
      const blogsData = req.body;
      const result = await blogsCollection.insertOne(blogsData);
      res.send(result);
    });
    // publish blog
    app.patch("/publish-blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "published",
        },
      };
      const result = await blogsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // unpublish blog
    app.patch("/unpublish-blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "draft",
        },
      };
      const result = await blogsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


 
     
  } finally {

  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blood donation server running is running");
});

app.listen(port, () => {
  console.log(`Blood Heros is running on port ${port}`);
});



