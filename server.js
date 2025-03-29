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

// Configure Multer for Image Uploads (Keeps File Extensions)
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
app.get("/api/images/:filename", (req, res) => {
  const imagePath = path.join(__dirname, "uploads", req.params.filename);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});
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
  const { name, price, description } = req.body;
  if (!name || !price || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150";
  const newProduct = { id: Date.now(), name, price, description, image };

  products.push(newProduct);
  saveProducts(products);

  res.status(201).json({ message: "Product added!", product: newProduct });
});

// Update Product (Keep Old Image if No New Image)
app.put("/products/:id", upload.single("image"), (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, price, description } = req.body;
  const existingProduct = products.find((p) => p.id === productId);

  if (!existingProduct) {
    return res.status(404).json({ error: "Product not found" });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : existingProduct.image;

  const updatedProduct = { id: productId, name, price, description, image };
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
