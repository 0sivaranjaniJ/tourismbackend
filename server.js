require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Initialize the Express app first
const app = express();

// Now you can use app middleware
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Database Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/yatradb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  destination: String,
  package: String,
  budgetMin: Number,
  budgetMax: Number,
  people: Number,
  days: Number,
  message: String,
}, { timestamps: true }); // ✅ Adds createdAt & updatedAt automatically

// Only one instance of 'Booking' model declaration
const Booking = mongoose.model("Booking", bookingSchema);

// Rest of your code...

app.use(express.json());
app.use(cors());

// Serve Uploaded Images
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// JSON Utilities
const loadProducts = () => {
  if (fs.existsSync("products.json")) return JSON.parse(fs.readFileSync("products.json"));
  return [];
};
const saveProducts = (products) => fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
let products = loadProducts();
products = products.map(p => ({ ...p, status: p.status || "active" }));
saveProducts(products);

// Blog Utilities
const loadPosts = () => {
  if (fs.existsSync("posts.json")) return JSON.parse(fs.readFileSync("posts.json"));
  return [];
};
const savePosts = (posts) => fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
let posts = loadPosts();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Blog Routes
app.get("/api/posts", (req, res) => res.json(posts));
app.post("/api/posts", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content are required" });
  const newPost = { id: Date.now(), title, content };
  posts.push(newPost);
  savePosts(posts);
  res.status(201).json(newPost);
});
app.put("/api/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content } = req.body;
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) return res.status(404).json({ error: "Post not found" });
  posts[index] = { id: postId, title, content };
  savePosts(posts);
  res.json(posts[index]);
});
app.delete("/api/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  posts = posts.filter((post) => post.id !== postId);
  savePosts(posts);
  res.json({ message: "Post deleted successfully" });
});

// Product Routes
app.get("/products", (req, res) => res.json(products));
app.post("/products", upload.single("image"), (req, res) => {
  const { name, days, description, category, destination, status } = req.body;
  if (!name || !days || !description || !category || !destination)
    return res.status(400).json({ error: "Missing required fields" });

  const newProduct = {
    id: Date.now(),
    name,
    days,
    description,
    category,
    destination,
    status: status || "active",
    image: req.file ? `/uploads/${req.file.filename}` : null,
  };

  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
});
app.put("/products/:id", upload.single("image"), (req, res) => {
  const productId = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === productId);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  const { name, days, description, category, destination, status } = req.body;
  const updatedProduct = {
    ...products[index],
    name: name || products[index].name,
    days: days || products[index].days,
    description: description || products[index].description,
    category: category || products[index].category,
    destination: destination || products[index].destination,
    status: status || products[index].status,
    image: req.file ? `/uploads/${req.file.filename}` : products[index].image,
  };
  products[index] = updatedProduct;
  saveProducts(products);
  res.json(updatedProduct);
});
app.delete("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  products = products.filter(p => p.id !== productId);
  saveProducts(products);
  res.json({ message: "Product deleted successfully" });
});

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }); // 🕒 Sort by latest first
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to retrieve bookings" });
  }
});



app.post("/api/bookings", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ message: "Booking saved successfully" });
  } catch (err) {
    console.error("❌ Error saving booking:", err.message);
    res.status(500).json({ error: "Something went wrong", detail: err.message });
  }
});


// Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));