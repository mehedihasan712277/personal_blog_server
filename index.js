const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i0wokhn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const userDatabase = client.db("personal_Blog_DB").collection("users");
        const postDatabase = client.db("personal_Blog_DB").collection("posts");
        const categoryDatabase = client.db("personal_Blog_DB").collection("categories");

        app.get("/", (req, res) => {
            res.send("server is running ok")
        })

        // Get all users
        app.get('/api/users', async (req, res) => {
            try {
                const users = await userDatabase.find().toArray();
                res.status(200).json(users);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // add user
        app.post('/api/users', async (req, res) => {
            try {
                const result = await userDatabase.insertOne(req.body);
                res.status(201).json({ insertedId: result.insertedId });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });


        // Add post
        app.post('/api/posts', async (req, res) => {
            try {
                const result = await postDatabase.insertOne(req.body);
                res.status(201).send(result);
            } catch (err) {
                console.log(err);

                res.status(500).json({ error: err.message });
            }
        });

        // Update comments of a specific post
        app.put('/api/posts/:id', async (req, res) => {
            const postId = req.params.id;
            const { comment } = req.body; // expects: { comment: { content, createdAt, ... } }

            if (!comment || typeof comment !== "object") {
                return res.status(400).json({ error: "Invalid comment data" });
            }

            try {
                const result = await postDatabase.updateOne(
                    { _id: new ObjectId(postId) },
                    { $push: { comments: comment } }
                );

                if (result.modifiedCount === 0) {
                    return res.status(404).json({ message: "Post not found or comment not added" });
                }

                res.status(200).json({ message: "Comment added successfully" });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: err.message });
            }
        });


        // Get all posts
        app.get('/api/posts', async (req, res) => {
            try {
                const posts = await postDatabase.find().toArray();
                res.status(200).json(posts);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Get a single post by ID
        // app.get('/api/posts/:id', async (req, res) => {
        //     try {
        //         const id = req.params.id;
        //         const post = await postDatabase.findOne({ _id: new ObjectId(id) });

        //         if (!post) {
        //             return res.status(404).json({ message: 'Post not found' });
        //         }

        //         res.status(200).json(post);
        //     } catch (err) {
        //         res.status(500).json({ error: err.message });
        //     }
        // });


        app.get('/api/posts/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const _id = new ObjectId(id);

                // Increment the view count
                const updated = await postDatabase.findOneAndUpdate(
                    { _id },
                    { $inc: { view: 1 } },
                    { returnDocument: 'after' } // return the updated document
                );

                // if (!updated.value) {
                //     return res.status(404).json({ message: 'Post not found' });
                // }
                // console.log(updated);


                res.status(200).json(updated);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Get a  posts by email
        app.get('/api/posts/user/:email', async (req, res) => {
            try {
                const email = req.params.email + "@gmail.com";
                console.log(email);

                const posts = await postDatabase.find({ email: email }).toArray();

                if (posts.length === 0) {
                    return res.status(404).json({ message: 'No posts found for this email' });
                }

                res.status(200).json(posts);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });



        // Delete post
        app.delete('/api/posts/:id', async (req, res) => {
            try {
                const result = await postDatabase.deleteOne({ _id: new ObjectId(req.params.id) });
                if (result.deletedCount === 0) return res.status(404).json({ message: 'Post not found' });
                res.status(200).json({ message: 'Post deleted' });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // 6. Get categories
        app.get('/api/categories', async (req, res) => {
            try {
                const categories = await categoryDatabase.find().toArray();
                res.status(200).json(categories);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`the app is running on port ${port}`);
})