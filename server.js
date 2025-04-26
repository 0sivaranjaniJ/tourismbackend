// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Ensure Uploads Directory Exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());

// Serve Uploaded Images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Read & Write Products from JSON File
const loadProducts = () => {
  if (fs.existsSync("products.json")) {
    return JSON.parse(fs.readFileSync("products.json"));
  }
  return [];
};

const saveProducts = (products) => {
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
};

let products = loadProducts();

// Get All Products
app.get("/products", (req, res) => {
  res.json(products);
});

// Add Product (with Image Upload)
app.post("/products", upload.single("image"), (req, res) => {
  const { name, days, description, category, destination } = req.body;
  if (!name || !days || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  

  const image = req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150";

  const newProduct = {
    id: Date.now(),
    name,
    days: parseInt(days),
    description,
    category,
    destination,
    image
  };

  products.push(newProduct);
  saveProducts(products);

  res.status(201).json({ message: "Product added!", product: newProduct });
});

// Update Product
app.put("/products/:id", upload.single("image"), (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, days, description, category, destination } = req.body;

  const existingProduct = products.find((p) => p.id === productId);

  if (!existingProduct) {
    return res.status(404).json({ error: "Product not found" });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : existingProduct.image;

  const updatedProduct = {
    id: productId,
    name,
    days: parseInt(days),
    description,
    category,
    destination,
    image
  };

  products = products.map((p) => (p.id === productId ? updatedProduct : p));
  saveProducts(products);

  res.json({ message: "Product updated!", product: updatedProduct });
});

// Delete Product
app.delete("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  products = products.filter((p) => p.id !== productId);
  saveProducts(products);

  res.json({ message: "Product deleted successfully!" });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
